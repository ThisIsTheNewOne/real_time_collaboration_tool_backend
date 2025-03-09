import { Server, Socket } from "socket.io";
import { pgPool, redisClient } from "../config/db";
import ShareDB from "sharedb";
import ShareDBPostgres from "sharedb-postgres";
import jwt from "jsonwebtoken";

// Configure ShareDB with PostgreSQL
const db = new ShareDBPostgres({
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: Number(process.env.PG_PORT) || 5432,
  },
});

const backend = new ShareDB({ db });
const connection = backend.connect();
const activeDocuments = new Map<string, ShareDB.Doc>();

type DocId = string;
type UserId = string;
type CursorPosition = { x: number; y: number };

export const setupCollabSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentDocId: DocId | null = null;
    let currentDoc: ShareDB.Doc | null = null;
    let userId: UserId | null = null;
    let saveVersionTimeout: NodeJS.Timeout | null = null;
    let pendingChanges = 0;

    const getOrCreateDoc = (docId: DocId): ShareDB.Doc => {
      if (!activeDocuments.has(docId)) {
        const doc = connection.get("documents", docId);
        activeDocuments.set(docId, doc);
      }
      return activeDocuments.get(docId)!;
    };

    const saveDocumentVersion = async () => {
      if (!currentDocId || !currentDoc || !userId) return;

      try {
        await pgPool.query(
          `INSERT INTO document_versions (doc_id, content, created_by)
           VALUES ($1, $2, $3)`,
          [currentDocId, JSON.stringify(currentDoc.data), userId]
        );
        console.log(`Version saved for document ${currentDocId}`);
      } catch (err) {
        console.error("Version save failed:", err);
      }
    };

    // Handle joining a document room
    socket.on("join-document", async (docId: DocId, authToken: string) => {
      try {
        // Verify JWT and get user ID
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
          userId: string;
        };
        const userResult = await pgPool.query(
          "SELECT id FROM users WHERE id = $1",
          [decoded.userId]
        );
        userId = userResult.rows[0]?.id; // Fix: Assign to outer userId variable

        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        currentDocId = docId;
        socket.join(docId);
        currentDoc = getOrCreateDoc(docId);

        await new Promise<void>((resolve, reject) => {
          currentDoc!.fetch((err) => (err ? reject(err) : resolve()));
        });

        // Add ShareDB operation listener
        currentDoc!.on("op", (op: any, source: string) => {
          if (source === socket.id) {
            pendingChanges++;

            if (saveVersionTimeout) clearTimeout(saveVersionTimeout);
            saveVersionTimeout = setTimeout(() => {
              saveDocumentVersion();
              pendingChanges = 0;
            }, 30000);

            if (pendingChanges >= 10) {
              if (saveVersionTimeout) clearTimeout(saveVersionTimeout);
              saveDocumentVersion();
              pendingChanges = 0;
            }
          }
        });

        // Send initial data to client
        socket.emit("document-content", currentDoc!.data);

        // Sync presence
        await redisClient.hSet(
          `doc:${docId}:users`,
          socket.id,
          JSON.stringify({
            userId: socket.id,
            name: "Anonymous",
            cursor: { x: 0, y: 0 },
          })
        );
        const activeUsers = await redisClient.hGetAll(`doc:${docId}:users`);
        io.to(docId).emit("active-users", activeUsers);
      } catch (err) {
        console.error("Join document error:", err);
        socket.emit("error", "Failed to load document");
      }
    });

    // Text changes
    socket.on("text-change", (delta: any) => {
      if (!currentDoc) return;
      currentDoc.submitOp(delta, { source: socket.id });
    });

    // Cursor movement
    socket.on("cursor-move", (cursorPos: CursorPosition) => {
      if (!currentDocId || !cursorPos.x || !cursorPos.y) return;
      socket.to(currentDocId).emit("cursor-position", {
        userId: socket.id,
        cursorPos,
      });
      redisClient.hSet(
        `doc:${currentDocId}:users`,
        socket.id,
        JSON.stringify({ cursor: cursorPos })
      );
    });

    // Disconnect
    socket.on("disconnect", async () => {
      if (!currentDocId) return;

      // Save final version if needed
      if (pendingChanges > 0) {
        await saveDocumentVersion();
      }

      // Cleanup presence
      await redisClient.hDel(`doc:${currentDocId}:users`, socket.id);
      const activeUsers = await redisClient.hGetAll(
        `doc:${currentDocId}:users`
      );
      io.to(currentDocId).emit("active-users", activeUsers);

      // Cleanup ShareDB doc
      if (Object.keys(activeUsers).length === 0 && currentDoc) {
        currentDoc.unsubscribe();
        activeDocuments.delete(currentDocId);
      }
    });
  });
};
