import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/db';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return; 
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const result = await pgPool.query('SELECT id, email FROM users WHERE id = $1', [decoded.userId]);
    
    if (!result.rows[0]) {
        res.status(401).json({ message: 'User not found' });
        return; 
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};