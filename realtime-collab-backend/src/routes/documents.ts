import { pgPool } from "../config/db";
import { authMiddleware } from "../middleware/auth";
import router from "./auth";

// Create a document
router.post("/", authMiddleware, async (req, res) => {
  const { title } = req.body;
  const userId = req.user!.id; // From JWT middleware

  try {
    const result = await pgPool.query(
      "INSERT INTO documents (title, created_by) VALUES ($1, $2) RETURNING *",
      [title, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create document" });
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