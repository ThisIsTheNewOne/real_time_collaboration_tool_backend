import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pgPool } from "../config/db";
import asyncHandler from "../utils/asyncHandler";

const router = express.Router();

// Register
router.post("/register", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Check if user already exists
    const existingUser = await pgPool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Add validation
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pgPool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    res.status(201).json({ userId: result.rows[0].id });
  } catch (err: any) {
    console.error("Registration error:", err);
    
    // Check for specific PostgreSQL error codes
    if (err.code === '23505') { // unique_violation error code
      return res.status(409).json({ error: "Email already registered" });
    }
    
    res.status(500).json({ error: "Registration failed" });
  }
}));

// Login
router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
  
    const userResult = await pgPool.query(
      "SELECT id, password FROM users WHERE email = $1",
      [email]
    );
  
    if (!userResult.rows[0]) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  
    const isValid = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  
    const token = jwt.sign(
      { userId: userResult.rows[0].id },
      process.env.JWT_SECRET!, 
      { expiresIn: "1h" }
    );
  
    res.json({ token });
  }));

export default router;
