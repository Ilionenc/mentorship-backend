import { Request, Response } from 'express';
import pool from '../db';

export const bookSession = async (req: Request, res: Response) => {
  const mentee_id = req.user?.id;
  const { mentor_id, topic, session_date, session_time } = req.body;
  

  try {
    const result = await pool.query(
      `INSERT INTO sessions (mentee_id, mentor_id, topic, session_date, session_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [mentee_id, mentor_id, topic, session_date, session_time]
    );

    // After successfully creating session
 await pool.query(
  'DELETE FROM mentor_availability WHERE mentor_id = $1 AND available_date = $2 AND available_time = $3',
  [mentor_id, session_date, session_time]
);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
  
  console.log('Booking ')
};

export const getMySessions = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT * FROM sessions
       WHERE mentor_id = $1 OR mentee_id = $1
       ORDER BY session_date ASC, session_time ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



export const getSessionDashboard = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const { status, date } = req.query;

console.log('getSessionDashboard called');

  let query = `
    SELECT
      s.id,
      s.topic,
      s.session_date,
      s.session_time,
      s.status,
      CASE
        WHEN $2 = 'mentor' THEN u.name
        ELSE m.name
      END AS other_person
    FROM sessions s
    JOIN users u ON u.id = s.mentee_id
    JOIN users m ON m.id = s.mentor_id
    WHERE (s.mentor_id = $1 OR s.mentee_id = $1)
  `;

  const values: any[] = [userId, userRole];
  let count = 3;

  if (status) {
    query += ` AND s.status = $${count++}`;
    values.push(status);
  }

  if (date) {
    query += ` AND s.session_date = $${count++}`;
    values.push(date);
  }

  query += ` ORDER BY s.session_date ASC, s.session_time ASC`;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const rescheduleSession = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { session_date, session_time, topic } = req.body;

  try {
    // Check if the user owns the session
    const check = await pool.query(
      `SELECT * FROM sessions WHERE id = $1 AND (mentee_id = $2 OR mentor_id = $2)`,
      [id, userId]
    );

    if (check.rowCount === 0) {
      return res.status(403).json({ error: 'You are not allowed to reschedule this session' });
    }

    // Update the session
    const result = await pool.query(
      `UPDATE sessions
       SET session_date = $1,
           session_time = $2,
           topic = COALESCE($3, topic)
       WHERE id = $4
       RETURNING *`,
      [session_date, session_time, topic, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const cancelSession = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    // Confirm the session belongs to the user
    const check = await pool.query(
      `SELECT * FROM sessions WHERE id = $1 AND (mentee_id = $2 OR mentor_id = $2)`,
      [id, userId]
    );

    if (check.rowCount === 0) {
      return res.status(403).json({ error: 'You are not allowed to cancel this session' });
    }

    // Update status to 'cancelled'
    const result = await pool.query(
      `UPDATE sessions SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.status(200).json({ message: 'Session cancelled successfully', session: result.rows[0] });
  } catch (err: any) {
    console.error('❌ Error cancelling session:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getSessionSummary = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM sessions
       WHERE mentor_id = $1 OR mentee_id = $1
       GROUP BY status`,
      [userId]
    );

    const summary: Record<string, number> = {
      scheduled: 0,
      completed: 0,
      cancelled: 0
    };

    result.rows.forEach((row) => {
      summary[row.status] = parseInt(row.count);
    });

    res.json(summary);
  } catch (err: any) {
    console.error('❌ Summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
};