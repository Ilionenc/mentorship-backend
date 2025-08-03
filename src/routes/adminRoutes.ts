import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';
import pool from '../db';

const router = express.Router();

// Middleware: Only allow admins
//const adminOnly = [authenticateUser, checkRole('admin')];

/**
* POST /admin/users - Admin registers a user manually
*/
router.post('/users', authenticateUser, checkRole('admin'), async (req, res) => {
  const { name, email, password, role, bio, skills, goals } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, bio, skills, goals)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, bio, skills, goals`,
      [name, email, password, role, bio, skills, goals]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ Error registering user:', err.message);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
* GET /admin/users - View all users
*/
router.get('/users', authenticateUser, checkRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email, role, skills FROM users`);
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
* GET /admin/mentors?skill=Python - Filter mentors by skill
*/


// Get all mentors
router.get('/mentors', authenticateUser, checkRole('admin'), async (req, res) => {
  const result = await pool.query('SELECT id, name, email, skills FROM users WHERE role = $1', ['mentor']);
  res.json(result.rows);
});

/*
router.get('/mentors',  authenticateUser, checkRole('admin'), async (req, res) => {
  const { skill } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, name, email, skills FROM users WHERE role = 'mentor' AND $1 = ANY(skills)`,
      [skill]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});
*/

/**
* GET /admin/mentees?skill=UI/UX - Filter mentees by skill
*/


// Get all mentees
router.get('/mentees', authenticateUser, checkRole('admin'), async (req, res) => {
  const result = await pool.query('SELECT id, name, email, skills FROM users WHERE role = $1', ['mentee']);
  res.json(result.rows);
});




/*
router.get('/mentees', authenticateUser, checkRole('admin'), async (req, res) => {
  const { skill } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, name, email, skills FROM users WHERE role = 'mentee' AND $1 = ANY(skills)`,
      [skill]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mentees' });
  }
});
*/
/**
* POST /admin/matches - Admin manually matches a mentor to a mentee
* Body: { mentorId, menteeId }
*/
router.post('/matches', authenticateUser, checkRole('admin'), async (req, res) => {
  const { mentorId, menteeId } = req.body;

  if (mentorId === menteeId) {
    return res.status(400).json({ error: 'Mentor and Mentee cannot be the same user' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (mentor_id, mentee_id)
       VALUES ($1, $2)
       RETURNING *`,
      [mentorId, menteeId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});


// Get availability
router.get('/availability', authenticateUser, checkRole('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM mentor_availability');
  res.json(result.rows);
});


// GET /admin/mentee/:id/skills
router.get('/mentee/:id/skills', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT skills FROM users WHERE id = $1 AND role = $2', [id, 'Mentee']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mentee not found' });
    }

    res.json({ skills: result.rows[0].skills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});









export default router;