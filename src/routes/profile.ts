import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';

const router = express.Router();



// Update user profile
router.put('/me', authenticateUser, async (req, res) => {
  const { name, role, bio, skills, goals } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           role = $2,
           bio = $3,
           skills = $4,
           goals = $5
       WHERE id = $6
       RETURNING id, name, email, role, bio, skills, goals`,
      [name, role, bio, skills, goals, userId]
    );

    res.json(result.rows[0]); // Send updated user info
  } catch (err: any) {
    console.error('❌ Error updating profile:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});






/*
router.put('/me', authenticateUser, async (req, res) => {
  const { name, bio, skills, goals } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, bio = $2, skills = $3, goals = $4
       WHERE id = $5
       RETURNING id, name, email, role, bio, skills, goals`,
      [name, bio, skills, goals, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ UPDATE ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});




// ✅ Update Profile after login
router.put('/me', authenticateUser, async (req, res) => {
  const { name, role, bio, skills, goals } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, role=$2, bio=$3, skills=$4, goals=$5 WHERE id=$6 RETURNING *`,
      [name, role, bio, skills, goals, userId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

*/










router.get('/me', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, bio, skills, goals FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ GET PROFILE ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});





export default router;