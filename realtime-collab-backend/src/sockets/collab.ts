import { Server, Socket } from "socket.io";
import { redisClient } from "../config/db";
import ShareDB from "sharedb";
import ShareDBPostgres from "sharedb-postgres";

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

// Track active documents
const activeDocuments = new Map<string, ShareDB.Doc>();

// Define types of clarity
type DocId = string;
type UserId = string;
type CursorPosition = { x: number; y: number };

export const setupCollabSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentDocId: DocId | null = null;
    let currentDoc: ShareDB.Doc | null = null;

    const getOrCreateDoc = (docId: DocId): ShareDB.Doc => {
      if (!activeDocuments.has(docId)) {
        const doc = connection.get("documents", docId);
        activeDocuments.set(docId, doc);
      }
      return activeDocuments.get(docId)!;
    };

    // Handle joining a document room
    socket.on("join-documnet", async (docId: DocId) => {
      // Join the room for this document
      currentDocId = docId;
      socket.join(docId);
      console.log(`User ${socket.id} joined document ${docId}`);

      // Initialize ShareDB document
      currentDoc = getOrCreateDoc(docId);

      // Fetch document state
      currentDoc.fetch(async (err: any) => {
        if (err) throw err;

        // Send initial document state to client
        socket.emit("document-content", currentDoc!.data);

        // Track active user
        await redisClient.sAdd(`doc:${docId}:users`, socket.id);
        socket.to(docId).emit("user-connected", socket.id);
      });

      // Handle text changes
      socket.on("text-change", (delta: any) => {
        if (!currentDoc) return;

        // Submit operation to ShareDB
        currentDoc.submitOp(delta, { source: socket.id }, (err: any) => {
          if (err) console.error("Operation error:", err);
        });
      });

      // Listen for ShareDB changes
      currentDoc.on("op", (op: any, source: string) => {
        if (source !== socket.id) {
          socket.emit("text-update", op);
        }
      });
    });

    // Send current document content to the new user
    // socket.emit("document-content", initialContent)

    // Handle cursor movement
    socket.on("cursor-move", (cursorPos: CursorPosition) => {
      if (!currentDocId) return;
      // Broadcast cursor position to others in the same doc ( excluding sender )
      socket.to(currentDocId).emit("cursor-position", {
        userId: socket.id,
        cursorPos,
      });
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User ${socket.id} disconnected`);

      if (currentDocId) {
        // Clean up Redis tracking
        await redisClient.sRem(`doc:${currentDocId}:users`, socket.id);
        socket.to(currentDocId).emit("user-disconnected", socket.id);

        // Clean up ShareDB document if no users left
        const users = await redisClient.sMembers(`doc:${currentDocId}:users`);
        if (users.length === 0 && currentDoc) {
          currentDoc.destroy();
          activeDocuments.delete(currentDocId);
        }
      }
    });
  });
};
