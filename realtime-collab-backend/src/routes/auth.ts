import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pgPool } from "../config/db";

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Add validation
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pgPool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        ) 
        res.status(201).json({ userId: result.rows[0].id})
    } catch (err) {
        res.status(500).json({ error: 'Registration failed'});
    }
})

export default router