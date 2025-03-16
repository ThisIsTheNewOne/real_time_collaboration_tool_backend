import { pgPool } from "../config/db";
import { authMiddleware } from "../middleware/auth";
import router from "./auth";
import crypto from "crypto";

// Create a document
router.post("/", authMiddleware, async (req, res) => {
  const { title, visibility = "public" } = req.body;
  const userId = req.user!.id; // From JWT middleware

  try {
    // Create a document with the proper schema
    const documentData = JSON.stringify({
      title: title || "",
      content: "",
    });

    // Use a UUID for document ID
    const docId = crypto.randomUUID(); // Add import for crypto if needed

    const result = await pgPool.query(
      "INSERT INTO documents (collection, id, doc_type, data, owner_id, visibility) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      ["documents", docId, "json0", documentData, userId, visibility]
    );

    // Handle data that might be string or already parsed object
    const data =
      typeof result.rows[0].data === "string"
        ? JSON.parse(result.rows[0].data)
        : result.rows[0].data;

    res.status(201).json({
      ...result.rows[0],
      data,
    });
  } catch (err) {
    console.error("Document creation error:", err);
    res.status(500).json({ error: "Failed to create document" });
  }
});

// Get All Documents
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user!.id;

  console.log("this is the user in the end", userId);

  try {
    // Get documents that:
    // 1. User owns, OR
    // 2. Are public, OR
    // 3. User has explicit permission for
    const result = await pgPool.query(
      `
      SELECT d.id, d.data, d.visibility, d.owner_id, d.created_at
      FROM documents d
      LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
      WHERE d.owner_id = $1                     -- User owns the document
        OR d.visibility = 'public'              -- Document is public
        OR dp.user_id IS NOT NULL               -- User has explicit permission
      ORDER BY d.created_at DESC
    `,
      [userId]
    );

    const documents = result.rows.map((row) => {
      let parsedData;

      // Check if 'data' is already an object
      if (typeof row.data === "string") {
        parsedData = JSON.parse(row.data);
      } else {
        parsedData = row.data; // Already parsed
      }

      return {
        id: row.id,
        owner_id: row.owner_id,
        visibility: row.visibility,
        created_at: row.created_at,
        data: parsedData,
      };
    });

    res.json(documents);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.delete("/:id", authMiddleware, async (req, res): Promise<void> => {
  const docId = req.params.id;
  const userId = req.user!.id;

  try {
    // Check if document exists and user is the owner
    const checkResult = await pgPool.query(
      "SELECT id FROM documents WHERE id = $1 AND owner_id = $2",
      [docId, userId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Delete the document
    await pgPool.query("DELETE FROM documents WHERE id = $1", [docId]);

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Get a document by ID
router.get("/:id", authMiddleware, async (req, res): Promise<void> => {
  const docId = req.params.id;
  const userId = req.user!.id;

  try {
    const result = await pgPool.query(
      `
      SELECT d.* FROM documents d
      LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
      WHERE d.id = $2 AND (
        d.owner_id = $1                     -- User owns the document
        OR d.visibility = 'public'          -- Document is public
        OR dp.user_id IS NOT NULL           -- User has explicit permission
      )
    `,
      [userId, docId]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Handle data that might be string or already parsed object
    let data;
    if (typeof result.rows[0].data === "string") {
      data = JSON.parse(result.rows[0].data);
    } else {
      data = result.rows[0].data;
    }

    res.json({
      ...result.rows[0],
      data,
    });
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Set document visibility
router.patch("/:id/visibility", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { visibility } = req.body;
  const userId = req.user!.id;

  if (!['public', 'private'].includes(visibility)) {
     res.status(400).json({ error: "Visibility must be 'public' or 'private'" });
     return
  }

  try {
    // Check if user is the owner
    const docResult = await pgPool.query(
      "SELECT owner_id FROM documents WHERE id = $1",
      [id]
    );

    if (docResult.rowCount === 0) {
       res.status(404).json({ error: "Document not found" });
       return
    }

    if (docResult.rows[0].owner_id !== userId) {
      res.status(403).json({ error: "Only the owner can change visibility" });
      return
    }

    await pgPool.query(
      "UPDATE documents SET visibility = $1 WHERE id = $2",
      [visibility, id]
    );

    res.json({ success: true, visibility });
  } catch (err) {
    console.error("Error updating visibility:", err);
    res.status(500).json({ error: "Failed to update visibility" });
  }
});

export default router;
