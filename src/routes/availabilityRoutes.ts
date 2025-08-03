import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';
import { error } from 'console';

const router = express.Router();


/*
// POST /availability
router.post('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { available_date, available_time } = req.body;

  // Check if user is a mentor
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Only mentors can set availability' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO mentor_availability (mmentor_id, available_date, available_time) VALUES ($1, $2, $3) RETURNING *',
      [userId, available_date, available_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
*/
// POST /availability
router.post('/', authenticateUser, async (req, res) => {
  const mentor_id = req.user.id;
  const { available_date, available_time } = req.body;

  if (!available_date || !available_time) {
    return res.status(400).json({ error: 'Date and time are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO mentor_availability (mentor_id, available_date, available_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [mentor_id, available_date, available_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error saving availability:', err.message);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});






 //GET /availability
router.get('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    'SELECT * FROM mentor_availability WHERE mentor_id = $1 ORDER BY available_date, available_time',
    [userId]
  );

  res.json(result.rows);
});

/*  WORKING GET

//Get a mentor availabilty
router.get('/:mentor_id', authenticateUser, async (req, res) => {
  const { mentor_id } = req.params;

  const result = await pool.query(
   'SELECT * FROM mentor_availability WHERE mentor_id = $1 ORDER BY available_date, available_time',
   //'SELECT * FROM mentor_availability WHERE mentor_id = $1',
    [mentor_id]
  );

  res.json(result.rows);
});
OLD
*/


//NEW
// ✅ Get a mentor's availability slots
router.get('/availability/:mentorId', authenticateUser, async (req, res) => {
  const { mentorId } = req.params;

  try {
    const mentorIdNumber = parseInt(mentorId);
    if (isNaN(mentorIdNumber)) {
      return
      res.status(400).json({error:
        'Invalid mentorId format'
      })
    }
    const result = await pool.query(
      'SELECT * FROM mentor_availability WHERE mentor_id = $1',
      [mentorId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching availability:', err.message);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});


// DELETE /availability/:mentorId/:slotId
router.delete('/availability/:mentorId/:slotId', authenticateUser, async (req, res) => {
  const { mentorId, slotId } = req.params;
  await pool.query(
    'DELETE FROM mentor_availability WHERE id = $1 AND mentor_id = $2',
    [slotId, mentorId]
  );
  res.sendStatus(204);
});



// ✅ Add availability
router.post('/', authenticateUser, async (req, res) => {
  const { available_date, available_time } = req.body;
  const mentorId = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO mentor_availability (mentor_id, available_date, available_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [mentorId, available_date, available_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/*
// ✅ Get all availability slots for the logged-in mentor
router.get('/', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mentor_availability WHERE mentor_id = $1 ORDER BY available_date, available_time',
      [req.user.id]
    );
    res.json(result.rows); // ✅ send to frontend
  } catch (err: any) {
    console.error('Error fetching availability:', err.message);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});



// GET /availability/:mentorId → return that mentor's slots
router.get('/:mentorId', authenticateUser, async (req, res) => {
  const { mentorId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, available_date, available_time
       FROM mentor_availability
       WHERE mentor_id = $1
       ORDER BY available_date, available_time`,
      [mentorId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Error loading mentor availability:', err.message);
    res.status(500).json({ error: 'Unable to load slots' });
  }
});

*/





export default router;