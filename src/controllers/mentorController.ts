import { Request, Response } from 'express';
import pool from '../db';

export const discoverMentors = async (req: Request, res: Response) => {
  const { search } = req.query;

  let query = `
    SELECT id, name, email, bio, skills, goals
    FROM users
    WHERE role = 'mentor'
  `;

  const values: any[] = [];

  if (search) {
    query += ` AND (
      name ILIKE $1 OR
      skills ILIKE $1 OR
      goals ILIKE $1 OR
      bio ILIKE $1
    )`;
    values.push(`%${search}%`);
  }

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Mentor discovery error:', err.message);
    res.status(500).json({ error: err.message });
  }
};