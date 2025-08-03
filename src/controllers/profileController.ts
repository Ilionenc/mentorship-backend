import { Request, Response } from 'express';
import pool from '../db';

// ✅ Get current user's profile
export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log('Authenticated user', req.user);
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, bio, skills, goals FROM users WHERE id = $1`,
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update current user's profile
export const updateMyProfile = async (req: Request, res: Response) => {
  const { name, bio, skills, goals } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, bio = $2, skills = $3, goals = $4
       WHERE id = $5
       RETURNING id, name, email, role, bio, skills, goals`,
      [name, bio, skills, goals, req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};