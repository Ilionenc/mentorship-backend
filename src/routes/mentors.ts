import express from 'express';
import { discoverMentors } from '../controllers/mentorController';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';

const router = express.Router();

router.get('/discover', authenticateUser, discoverMentors); // mentees only


// routes/mentorRoutes.ts

router.get('/mentors', authenticateUser, async (req, res) => {
  const skill = req.query.skill?.toString().toLowerCase();

  try {
    let query = 'SELECT id, name, email, skills FROM users WHERE role = $1';
    let values: any[] = ['mentor'];

    if (skill) {
      query += ' AND LOWER(skills::text) LIKE $2';
      values.push(`%${skill}%`);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});




/*
// ✅ GET /mentors - list all mentors
router.get('/mentors', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE role = $1',
      ['mentor']
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching mentors:', err.message);
    res.status(500).json({ error: 'Failed to load mentors' });
  }
});
*/

export default router;