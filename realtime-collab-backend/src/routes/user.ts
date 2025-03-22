import express from "express";
import { pgPool } from "../config/db";
import asyncHandler from "../utils/asyncHandler";
import { authMiddleware } from "../middleware/auth";


const router = express.Router();

// Get current user's information - THIS MUST COME FIRST
router.get("/me", authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  
  try {
    const userResult = await pgPool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to retrieve user information" });
  }
}));

// Get user information by ID (authenticated)
router.get("/:id", authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user!.id; // From JWT middleware
  
  // Optional: Check if user is requesting their own info or is an admin
  if (userId !== requestingUserId) {
    return res.status(403).json({ error: "Access denied" });
  }
  
  try {
    const userResult = await pgPool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to retrieve user information" });
  }
}));

export default router;