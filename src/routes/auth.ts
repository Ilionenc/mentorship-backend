// src/routes/auth.ts

// src/routes/auth.ts

//import express from 'express';
import { register } from '../controllers/authController';
import { login } from '../controllers/authController';
//import { register } from '../controllers/authController';
//import { login } from '../controllers/authController';
import { authenticateUser } from '../middleware/authMiddleware';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';


const router = express.Router();

router.post('/register', register); // 👈 This is your /auth/register route
router.post('/login', login);


// =====================
// GET LOGGED-IN USER
// =====================
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Fetch user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});








export default router;





















