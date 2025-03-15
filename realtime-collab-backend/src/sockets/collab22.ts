import { Server, Socket } from "socket.io";
import { pgPool, redisClient } from "../config/db";
import ShareDB from "sharedb";
import ShareDBPostgres from "sharedb-postgres";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

// Create a dedicated pg pool for ShareDB
const shareDBPgPool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: Number(process.env.PG_PORT) || 5432,
  max: 10, // connection pool size
});

// Test at the top of your file or in a separate script
shareDBPgPool
  .query("SELECT NOW()")
  .then((result) =>
    console.log("PostgreSQL connected successfully:", result.rows[0])
  )
  .catch((err) => console.error("PostgreSQL connection error:", err));

  export async function initShareDBSchema(pool: Pool): Promise<void> {
    console.log("Initializing ShareDB PostgreSQL schema...");
  
    try {
      // First check if tables exist
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'snapshots'
        );
      `);
      
      const tablesExist = tableCheck.rows[0].exists;
      
      // Drop existing tables if they exist
      if (tablesExist) {
        console.log("Dropping existing ShareDB tables...");
        await pool.query(`
          DROP TABLE IF EXISTS ops;
          DROP TABLE IF EXISTS snapshots;
        `);
      }
      
      // Create tables with proper schema
      console.log("Creating ShareDB tables...");
      await pool.query(`
        -- ops table for operations
        CREATE TABLE ops (
          collection VARCHAR(255) NOT NULL,
          doc_id VARCHAR(255) NOT NULL,
          version INTEGER NOT NULL,
          operation JSONB NOT NULL,
          PRIMARY KEY (collection, doc_id, version)
        );
  
        -- snapshots table for document snapshots - note doc_type is already NOT NULL
        CREATE TABLE snapshots (
          collection VARCHAR(255) NOT NULL,
          doc_id VARCHAR(255) NOT NULL,
          doc_type VARCHAR(255) NOT NULL,
          version INTEGER NOT NULL,
          data JSONB NOT NULL,
          PRIMARY KEY (collection, doc_id)
        );
      `);
  
      console.log("ShareDB schema initialized successfully");
    } catch (error) {
      console.error("Failed to initialize ShareDB schema:", error);
      throw error;
    }
  }


// Initialize ShareDB and backend only after schema is created
let backend: any;
let connection: any;
const activeDocuments = new Map<string, ShareDB.Doc>();

// Initialize ShareDB schema before setting up ShareDB
(async () => {
  try {
   // Create schema first
    await initShareDBSchema(shareDBPgPool);
    
    // Initialize ShareDB with the correct configuration
    const db = new ShareDBPostgres({
      pool: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD, // Use environment variable
        database: process.env.PG_DATABASE,
        port: Number(process.env.PG_PORT) || 5432,
      }
    });
    
    backend = new ShareDB({ db });
    connection = backend.connect();
    
    console.log("ShareDB successfully initialized");
  } catch (err) {
    console.error("Error initializing ShareDB:", err);
    process.exit(1); // Exit if schema initialization fails
  }
})();

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
        // Validate that auth token exists
        if (!authToken) {
          socket.emit("error", "Authentication token required");
          return;
        }
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
