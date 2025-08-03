import { Request, Response } from 'express';
import pool from '../db';

export const sendRequest2 = async (req: Request, res: Response) => {
  const menteeId = req.user?.id;
  const { mentor_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id)
       VALUES ($1, $2) RETURNING *`,
      [menteeId, mentor_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const viewIncomingRequests = async (req: Request, res: Response) => {
  const mentorId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT mr.id, u.name AS mentee_name, mr.status, mr.created_at
       FROM mentorship_requests mr
       JOIN users u ON u.id = mr.mentee_id
       WHERE mr.mentor_id = $1`,
      [mentorId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const respondToRequest2 = async (req: Request, res: Response) => {
  const mentorId = req.user?.id;
  const { request_id, action } = req.body;

  if (!['accepted', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const result = await pool.query(
      `UPDATE mentorship_requests
       SET status = $1
       WHERE id = $2 AND mentor_id = $3
       RETURNING *`,
      [action, request_id, mentorId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found or not yours' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



export const sendRequest = async (req: Request, res: Response) => {
  const menteeId = req.user?.id;
  const { mentor_id } = req.body;

  try {
    // 🔐 Prevent sending request to self
    if (parseInt(mentor_id) === menteeId) {
      return res.status(400).json({ error: 'You cannot request mentorship from yourself' });
    }

    // ✅ Check for duplicate
    const existing = await pool.query(
      `SELECT * FROM mentorship_requests
       WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'pending'`,
      [menteeId, mentor_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Request already sent and pending' });
    }

    // ✅ Insert new request
    const result = await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id)
       VALUES ($1, $2) RETURNING *`,
      [menteeId, mentor_id]


      
    );

    res.status(201).json({
      message: 'Mentorship request sent',
      request: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};



export const respondToRequest = async (req: Request, res: Response) => {
  const mentorId = req.user?.id;
  const { mentee_id, response } = req.body;

  try {
    // Validate response
  const cleanResponse = response.toLowerCase();

    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response. Use accepted or rejected.' });
    }

    // Check request exists and belongs to this mentor
    const check = await pool.query(
      `SELECT * FROM mentorship_requests
       WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'pending'`,
      [mentee_id, mentorId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'No pending request from this mentee' });
    }

    // Update status
    const result = await pool.query(
      `UPDATE mentorship_requests
       SET status = $1
       WHERE mentee_id = $2 AND mentor_id = $3
       RETURNING *`,
      [response, mentee_id, mentorId]
    );

    res.json({ message: `Request ${response}`, request: result.rows[0] });
  } catch (err: any) {
    console.error('❌ Mentor respond error:', err.message);
    res.status(500).json({ error: err.message });
  }
};