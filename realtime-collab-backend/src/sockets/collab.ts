import { Server, Socket } from "socket.io";
import { pgPool, redisClient } from "../config/db";
import jwt from "jsonwebtoken";

type DocId = string;
type UserId = string;
type CursorPosition = { x: number; y: number };

// Track active documents and their content
const activeDocuments = new Map<string, any>();
// Track document versions to handle concurrency
const documentVersions = new Map<string, number>();

export const setupCollabSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentDocId: DocId | null = null;
    let userId: UserId | null = null;
    let saveVersionTimeout: NodeJS.Timeout | null = null;
    let pendingChanges = 0;
    let lastSavedContent = "";

    // Load document content from database
    const loadDocument = async (docId: DocId): Promise<any> => {
      if (activeDocuments.has(docId)) {
        return activeDocuments.get(docId);
      }

      try {
        const result = await pgPool.query(
          "SELECT data FROM documents WHERE id = $1",
          [docId]
        );

        if (result.rowCount !== null && result.rowCount > 0) {
          // Handle data that might already be parsed or might be a string
          let parsedData;

          if (typeof result.rows[0].data === "string") {
            // If it's a string, parse it
            parsedData = JSON.parse(result.rows[0].data);
          } else {
            // If it's already an object, use it directly
            parsedData = result.rows[0].data;
          }

          activeDocuments.set(docId, parsedData);
          documentVersions.set(docId, 1); // Initial version
          return parsedData;
        } else {
          // Create new document if it doesn't exist
          const newContent = { title: "", content: "" };
          await pgPool.query(
            "INSERT INTO documents (collection, id, doc_type, data) VALUES ($1, $2, $3, $4)",
            ["documents", docId, "json0", JSON.stringify(newContent)]
          );
          activeDocuments.set(docId, newContent);
          documentVersions.set(docId, 1);
          return newContent;
        }
      } catch (err) {
        console.error("Error loading document:", err);
        throw err;
      }
    };

    // Save document content to database
    const saveDocument = async (docId: DocId, content: any) => {
      const newContent = JSON.stringify(content);

      // Avoid saving duplicate data
      if (newContent === lastSavedContent) return;

      try {
        await pgPool.query("UPDATE documents SET data = $1 WHERE id = $2", [
          JSON.stringify(content),
          docId,
        ]);
        lastSavedContent = newContent; // Update last saved state
        console.log(`Document ${docId} saved`);
      } catch (err) {
        console.error("Error saving document:", err);
      }
    };

    const saveDocumentVersion = async () => {
      if (!currentDocId || !userId) return;

      try {
        const content = activeDocuments.get(currentDocId);
        await pgPool.query(
          `INSERT INTO document_versions (doc_id, content, created_by)
           VALUES ($1, $2, $3)`,
          [currentDocId, JSON.stringify(content), userId]
        );
        console.log(`Version saved for document ${currentDocId}`);
      } catch (err) {
        console.error("Version save failed:", err);
      }
    };

    // Handle joining a document room
    socket.on("join-document", async (docId: DocId, authToken: string) => {
      try {
        console.log(`Attempting to join document ${docId} with token`);
        // Verify JWT and get user ID
        let decoded;
        try {
          decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
            userId: string;
          };
          console.log(`JWT verified successfully for user: ${decoded.userId}`);
        } catch (jwtErr) {
          console.error("JWT verification failed:", jwtErr);
          socket.emit("error", "Unauthorized: Invalid token");
          return;
        }
        const userResult = await pgPool.query(
          "SELECT id FROM users WHERE id = $1",
          [decoded.userId]
        );
        userId = userResult.rows[0]?.id;

        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        // Check document access permission
        const permResult = await pgPool.query(
          `
          SELECT d.*,
                 d.visibility,
                 CASE 
                   WHEN d.owner_id = $1 THEN 'owner'
                   WHEN dp.permission_level IS NOT NULL THEN dp.permission_level
                   WHEN d.visibility = 'public' THEN 'view'
                   ELSE NULL
                 END as access_level
          FROM documents d
          LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
          WHERE d.id = $2 AND (
            d.owner_id = $1                     -- User owns the document
            OR d.visibility = 'public'          -- Document is public
            OR dp.user_id IS NOT NULL           -- User has explicit permission
          )
          `,
          [userId, docId]
        );

        if (permResult.rows.length === 0) {
          socket.emit("error", "Access denied");
          return;
        }

        const accessLevel = permResult.rows[0].access_level;
        const visibility = permResult.rows[0].visibility;
        // Allow edit if document is public OR user has owner/edit permission
        const canEdit =
          visibility === "public" || ["owner", "edit"].includes(accessLevel);

        currentDocId = docId;
        socket.join(docId);

        // Load or create document
        const docContent = await loadDocument(docId);

        // Send initial data to client
        socket.emit("document-content", {
          ...docContent,
          access_level: accessLevel,
          can_edit: canEdit,
          visibility: visibility,
        });

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

    // Handle text changes
    socket.on("text-change", async (delta: any) => {
      if (!currentDocId || !userId) return;

      // Check permission level
      const permResult = await pgPool.query(
        `
        SELECT 
          d.visibility,
          CASE 
            WHEN d.owner_id = $1 THEN 'owner'
            WHEN dp.permission_level = 'edit' THEN 'edit'
            ELSE NULL
          END as access_level
        FROM documents d
        LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
        WHERE d.id = $2
        `,
        [userId, currentDocId]
      );

      if (permResult.rows.length === 0) {
        socket.emit("error", "Document not found");
        return;
      }

      const { visibility, access_level } = permResult.rows[0];
      // Allow edit if:
      // 1. Document is public, OR
      // 2. User has owner/edit permission
      const canEdit =
        visibility === "public" ||
        (access_level && ["owner", "edit"].includes(access_level));

      if (!canEdit) {
        socket.emit(
          "error",
          "You don't have edit permission for this document"
        );
        return;
      }

      // In a real implementation, you'd want to apply the delta
      // This is simplified - assumes delta is the full new content
      activeDocuments.set(currentDocId, delta);

      // Broadcast changes to other users
      socket.to(currentDocId).emit("text-change", delta);

      // Schedule periodic save
      pendingChanges++;
      if (saveVersionTimeout) clearTimeout(saveVersionTimeout);
      saveVersionTimeout = setTimeout(() => {
        saveDocument(currentDocId!, delta);
        saveDocumentVersion();
        pendingChanges = 0;
      }, 60000);

      // **Save immediately if pending changes exceed 20**
      if (pendingChanges >= 100) {
        if (saveVersionTimeout) clearTimeout(saveVersionTimeout);
        saveDocument(currentDocId, delta);
        saveDocumentVersion();
        pendingChanges = 0;
      }
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
        const content = activeDocuments.get(currentDocId);
        await saveDocument(currentDocId, content);
        await saveDocumentVersion();
      }

      // Cleanup presence
      await redisClient.hDel(`doc:${currentDocId}:users`, socket.id);
      const activeUsers = await redisClient.hGetAll(
        `doc:${currentDocId}:users`
      );
      io.to(currentDocId).emit("active-users", activeUsers);

      // Cleanup if no users left
      if (Object.keys(activeUsers).length === 0) {
        activeDocuments.delete(currentDocId);
        documentVersions.delete(currentDocId);
      }

      // Save document when server shuts down
      process.on("beforeExit", async () => {
        if (currentDocId) {
          const content = activeDocuments.get(currentDocId);
          await saveDocument(currentDocId, content);
        }
      });
    });
  });
};
