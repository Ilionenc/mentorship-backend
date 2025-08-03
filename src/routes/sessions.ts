import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';

const router = express.Router();




// ✅ GET /sessions/dashboard — returns all sessions 

router.get('/dashboard', authenticateUser, async (req, res) => {
  console.log('✅ sessions/dashboard hit'); // Log route reached
  console.log('👤 User ID:', req.user?.id); // Log the user making the request

  try {
    const result = await pool.query(
  `SELECT s.id, s.date AS date, s."time", s.status, s.created_at,
          mentor.name AS mentor_name, mentor.email AS mentor_email,
          mentee.name AS mentee_name, mentee.email AS mentee_email
   FROM mentorship_requests s
   JOIN users mentor ON s.mentor_id = mentor.id
   JOIN users mentee ON s.mentee_id = mentee.id
   WHERE s.mentor_id = $1 OR s.mentee_id = $1
   ORDER BY s.date DESC, s."time" DESC`,
  [req.user.id]
);

    console.log('✅ Sessions fetched:', result.rows.length);
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ SQL Error:', err.message); // FULL ERROR
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// ✅ GET /sessions/dashboard — returns scheduled sessions a Mentee

router.get('/dashboard/:menteeId', authenticateUser, async (req, res) => {
  console.log('✅ sessions/dashboard hit'); // Log route reached
  console.log('👤 User ID:', req.user?.id); // Log the user making the request

  try {
    const result = await pool.query(
  `SELECT s.id, s.date AS date, s."time", s.status, s.created_at,
          mentor.name AS mentor_name, mentor.email AS mentor_email,
          mentee.name AS mentee_name, mentee.email AS mentee_email
   FROM mentorship_requests s
   JOIN users mentor ON s.mentor_id = mentor.id
   JOIN users mentee ON s.mentee_id = mentee.id
   WHERE s.mentor_id = $1 OR s.mentee_id = $1
   ORDER BY s.date DESC, s."time" DESC`,
  [req.user.id]
);

    console.log('✅ Sessions fetched:', result.rows.length);
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ SQL Error:', err.message); // FULL ERROR
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});


router.post('/sessions', authenticateUser, async (req, res) => {
  const menteeId = req.user.id;
  const { mentor_id, date, time, topic } = req.body;

  if (menteeId === mentor_id) {
    return res.status(400).json({ error: 'You cannot book a session with yourself.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (mentor_id, mentee_id, session_date, time, topic, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [mentor_id, menteeId, date, time, topic, 'scheduled']
    );

    // Optionally delete the slot from mentor_availability
    await pool.query(
      `DELETE FROM mentor_availability WHERE mentor_id = $1 AND available_date = $2 AND available_time = $3`,
      [mentor_id, date, time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ Error creating session:', err.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});


// GET all sessions for a mentor
router.get('/mentor/:mentorId', authenticateUser, async (req, res) => {
  const { mentorId } = req.params;

  try {
    const result = await pool.query(
    `SELECT s.id, s.date AS date, s."time", s.status, s.created_at,
          mentor.name AS mentor_name, mentor.email AS mentor_email,
          mentee.name AS mentee_name, mentee.email AS mentee_email
   FROM mentorship_requests s
   JOIN users mentor ON s.mentor_id = mentor.id
   JOIN users mentee ON s.mentee_id = mentee.id
   WHERE s.mentor_id = $1 OR s.mentee_id = $1
   ORDER BY s.date DESC, s."time" DESC`,
      [mentorId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching mentor sessions:', err.message);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// ✅ GET /sessions/dashboard — returns all sessions for current user

router.get('/dashboard/:mentorId', authenticateUser, async (req, res) => {
  console.log('✅ sessions/dashboard hit'); // Log route reached
  console.log('👤 User ID:', req.user?.id); // Log the user making the request

  try {
    const result = await pool.query(
  `SELECT s.id, s.session_date, s."time", s.topic, s.status, s.created_at,
          mentor.name AS mentor_name, mentor.email AS mentor_email,
          mentee.name AS mentee_name, mentee.email AS mentee_email
   FROM sessions s
   JOIN users mentor ON s.mentor_id = mentor.id
   JOIN users mentee ON s.mentee_id = mentee.id

   WHERE s.mentor_id = $1 OR s.mentee_id = $1
   ORDER BY s.session_date DESC,  s."time" DESC`,
  [req.user.id]
);

    console.log('✅ Sessions fetched:', result.rows.length);
    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ SQL Error:', err.message); // FULL ERROR
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});






export default router;




/*
old
router.post('/sessions', authenticateUser, async (req, res) => {


if (req.user.role === 'mentor') {
  return res.status(403).json({ error: 'Mentors cannot book sessions.' });
}



  const menteeId = req.user.id;
  const { mentor_id, date, time, topic } = req.body;

  if (menteeId === mentor_id) {
    return res.status(400).json({ error: 'You cannot book a session with yourself.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (mentor_id, mentee_id, session_date, time, topic, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [mentor_id, menteeId, date, time, topic, 'scheduled']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ Error creating session:', err.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;
ens here


import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';

const router = express.Router();

// ✅ GET /sessions/dashboard — show all sessions for logged-in user
router.get('/dashboard', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  try {
   const result = await pool.query(
  `SELECT s.id, s."date", s."time", s.topic, s.status, s.created_at,
          mentor.name AS mentor_name, mentor.email AS mentor_email,
          mentee.name AS mentee_name, mentee.email AS mentee_email
   FROM sessions s
   JOIN users mentor ON s.mentor_id = mentor.id
   JOIN users mentee ON s.mentee_id = mentee.id
   WHERE s.mentor_id = $1 OR s.mentee_id = $1
   ORDER BY s."session_date" DESC, s."session_time" DESC`,
  [userId]
);

    res.json(result.rows);
  } catch (err: any) {
  console.error('❌ SQL Error:', err.message); // <-- log actual error
  res.status(500).json({ error: 'Failed to load sessions' });
}
});

export default router;
*/ 