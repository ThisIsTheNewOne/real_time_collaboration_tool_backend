import { pgPool } from "../config/db";
import { authMiddleware } from "../middleware/auth";
import router from "./auth";
import crypto from "crypto";

// Create a document
router.post("/", authMiddleware, async (req, res) => {
  const { title } = req.body;
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
      "INSERT INTO documents (collection, id, doc_type, data) VALUES ($1, $2, $3, $4) RETURNING *",
      ["documents", docId, "json0", documentData]
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
  try {
    const result = await pgPool.query("SELECT id, data FROM documents");

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
        ...parsedData,
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

  try {
    // First, check if the document exists
    const checkResult = await pgPool.query("SELECT id FROM documents WHERE id = $1", [docId]);

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
router.get("/:id", authMiddleware, async (req, res) => {
  const docId = req.params.id;
  try {
    const result = await pgPool.query("SELECT * FROM documents WHERE id = $1", [
      docId,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

export default router;
