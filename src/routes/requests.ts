// routes/mentor_requests.ts

import express from 'express';
import { Request, Response } from 'express';
import pool from '../db';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// POST /mentor-requests
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  const menteeId = req.user.id;
  const { mentor_id, date, time } = req.body;

  try {
 // Prevent duplicate requests
    const existing = await pool.query(
      `SELECT * FROM mentorship_requests WHERE mentor_id = $1 AND mentee_id = $2 AND date = $3 AND time = $4`,
      [mentor_id, menteeId, date, time]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Request already exists for this slot.' });
    }


    // Insert request into mentor_requests
    const result = await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id, date, time, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [menteeId, mentor_id, date, time, 'pending']
    );

    // Remove the requested time slot from mentor_availability
    await pool.query(
      `DELETE FROM mentor_availability
       WHERE mentor_id = $1 AND available_date = $2 AND available_time = $3`,
      [mentor_id, date, time]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('❌ Failed to send mentor request:', err.message);
    res.status(500).json({ error: 'Failed to send request' });
  }
});


// GET /mentor-requests/me
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  const menteeId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS mentor_name
       FROM mentorship_requests r
       JOIN users u ON r.mentor_id = u.id
       WHERE r.mentee_id = $1
       ORDER BY r.created_at DESC`,
      [menteeId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Failed to fetch mentor requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch mentor requests' });
  }
});






// DELETE /mentor-requests/:id/cancel
router.delete('/:id/cancel', authenticateUser, async (req: Request, res: Response) => {
  const requestId = req.params.id;
  const menteeId = req.user.id;

  try {
    // Check if the request belongs to this mentee
    const check = await pool.query(
      'SELECT * FROM mentorship_requests WHERE id = $1 AND mentee_id = $2',
      [requestId, menteeId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or request not found' });
    }

    // Option 1: Soft delete (update status)
    await pool.query(
      'UPDATE mentorship_requests SET status = $1 WHERE id = $2',
      ['cancelled', requestId]
    );

    // Option 2: Hard delete (remove from DB entirely)
    // await pool.query('DELETE FROM mentor_requests WHERE id = $1', [requestId]);

    res.json({ message: '✅ Request cancelled' });
  } catch (err: any) {
    console.error('❌ Failed to cancel request:', err.message);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});


// Accept or reject a mentee's request
router.put('/:id/respond', authenticateUser, async (req, res) => {
  const mentorId = req.user.id;
  const requestId = req.params.id;
  const { status } = req.body;
  const menteeId = req.user.id;
  const { mentor_id, date, time, topic } = req.body;


  try {
    // 🛑 Check for existing session at same time and date
    const duplicate = await pool.query(
      'SELECT * FROM sessions WHERE mentor_id = $1 AND mentee_id = $2 AND session_date = $3 AND time = $4',
      [mentor_id, menteeId, date, time]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'A session already exists for this date and time.' });
    }



  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

//  try {
    // Get the original request info
    const requestRes = await pool.query(
      'SELECT * FROM mentorship_requests WHERE id = $1 AND mentor_id = $2',
      [requestId, mentorId]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestRes.rows[0];

    // Update the request status
    await pool.query(
      'UPDATE mentorship_requests SET status = $1 WHERE id = $2',
      [status, requestId]
    );

    // ✅ If accepted, insert into sessions table
    if (status === 'accepted') {
      // Get mentee skills to use as session topic
      const userRes = await pool.query('SELECT skills FROM users WHERE id = $1', [request.mentee_id]);
      const menteeSkills = userRes.rows[0]?.skills?.join(', ') || 'Mentorship Session';

      await pool.query(
        `INSERT INTO sessions (mentor_id, mentee_id, session_date, time, topic, status)
         VALUES ($1, $2, $3, $4, $5, 'scheduled')`,
        [request.mentor_id, request.mentee_id, request.date, request.time, menteeSkills]
      );
    }

    res.json({ message: 'Request updated successfully' });
  } catch (err: any) {
    console.error('❌ Error responding to request:', err.message);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});







/* PATCH /mentor-requests/:id/respond
router.put('/:id/respond', authenticateUser, async (req, res) => {
  const mentorId = req.user.id;
  const { id } = req.params;
  const { status } = req.body; // should be either 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be accepted or rejected.' });
  }

  try {
    // Check if the request exists and belongs to this mentor
    const check = await pool.query(
      'SELECT * FROM mentorship_requests WHERE id = $1 AND mentor_id = $2',
      [id, mentorId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized.' });
    }

    // Update the status
    const result = await pool.query(
      'UPDATE mentorship_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error responding to request:', err.message);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});
*/

// GET /mentor-requests/me
router.get('/mentorship_requests/me', authenticateUser, async (req, res) => {
  const menteeId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT mr.id, mr.mentor_id, u.name as mentor_name, mr.date, mr.time, mr.status, mr.created_at
       FROM mentor_requests mr
       JOIN users u ON mr.mentor_id = u.id
       WHERE mr.mentee_id = $1
       ORDER BY mr.created_at DESC`,
      [menteeId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching mentee requests:', err.message);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});


// ✅ Get all pending mentorship requests for the logged-in mentor
router.get('/me2', authenticateUser, async (req, res) => {
  const mentorId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.date,
        r.time,
        r.status,
        u.name AS mentee_name
      FROM mentorship_requests r
      JOIN users u ON r.mentee_id = u.id
      WHERE r.mentor_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
      `,
      [mentorId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching mentor requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});


// Accept mentorship request and create a session
router.post('/:id/respond', authenticateUser, async (req, res) => {
  const mentorId = req.user.id;
  const requestId = req.params.id;
  const { action } = req.body; // 'accepted' or 'rejected'

  try {
    // Step 1: Get request details
    const requestResult = await pool.query(
      `SELECT r.*, u.skills, u.name AS mentee_name
       FROM mentorship_requests r
       JOIN users u ON r.mentee_id = u.id
       WHERE r.id = $1 AND r.mentor_id = $2`,
      [requestId, mentorId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    const request = requestResult.rows[0];

    if (action === 'accepted') {
      // Step 2: Insert into sessions table with mentee's skills as topic
      const insertSession = await pool.query(
        `INSERT INTO sessions (mentor_id, mentee_id, session_date, time, topic, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          request.mentor_id,
          request.mentee_id,
          request.date,
          request.time,
          request.skills || 'No skills provided',
          'scheduled'
        ]
      );
    }

    // Step 3: Update mentor_request status
    await pool.query(
      `UPDATE mentorship_requests SET status = $1 WHERE id = $2`,
      [action, requestId]
    );

    res.json({ message: `Request ${action} successfully` });

  } catch (err: any) {
    console.error('❌ Error responding to request:', err.message);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

// mentor-requests.ts
router.get('/pending', authenticateUser, async (req, res) => {
  try {
    const mentorId = req.user.id;
    const result = await pool.query(
      `SELECT r.*, u.name AS mentee_name, u.skills
       FROM mentorship_requests r
       JOIN users u ON u.id = r.mentee_id
       WHERE r.mentor_id = $1 AND r.status = 'pending'`,
      [mentorId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching pending requests:', err.message);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});







export default router;



/*
import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import pool from '../db';

const router = express.Router();

// ✅ Send Mentorship Request
router.post('/mentor-requests', authenticateUser, async (req, res) => {
  const menteeId = req.user.id;
  const { mentor_id, date, time } = req.body;

  try {
    // Prevent self-request
    if (menteeId === mentor_id) {
      return res.status(400).json({ error: 'You cannot request yourself.' });
    }

    // Check for duplicate request
    const existing = await pool.query(
      'SELECT * FROM mentorship_requests WHERE mentee_id = $1 AND mentor_id = $2 AND slot_id = $3',
      [menteeId, mentor_id, date, time]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Request already sent for this slot.' });
    }
    // Insert request as pending
    const result = await pool.query(
      `INSERT INTO mentorship_requests (mentor_id, mentee_id, slot_id, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [mentor_id, menteeId, ]
    );

 //   res.status(201).json(result.rows[0]);
 // } catch (err: any) {
 //   console.error('❌ Send request error:', err.message);
//    res.status(500).json({ error: 'Failed to send request' });
//  }



 // 2. Remove that slot from mentor availability
    await pool.query(
      `DELETE FROM mentor_availability
       WHERE mentor_id = $1 AND available_date = $2 AND available_time = $3`,
     // [mentor_id, date, time]
    [mentor_id, menteeId, slot_id]
    );

    res.status(201).json({ message: 'Request created successfully.' });
  } catch (err: any) {
    console.error('❌ Error sending request:', err.message);
    res.status(500).json({ error: 'Failed to send request' });
  }



});





// ❌ Cancel Mentorship Request// 
router.delete('/:id', authenticateUser, async (req, res) => {
  const menteeId = req.user.id;
  const requestId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM mentorship_requests
       WHERE id = $1 AND mentee_id = $2
       RETURNING *`,
      [requestId, menteeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    res.json({ message: '❌ Request cancelled', request: result.rows[0] });
  } catch (err: any) {
    console.error('❌ Cancel request error:', err.message);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

export default router;









/*
import express from 'express';
import pool from '../db';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// PATCH /requests/:id/respond
router.patch('/:id/respond', authenticateUser, async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Access denied: Only mentors can respond' });
  }

  const requestId = req.params.id;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use accepted or rejected.' });
  }

  try {
    const result = await pool.query(
      `UPDATE mentorship_requests
       SET status = $1
       WHERE id = $2 AND mentor_id = $3
       RETURNING *`,
      [status, requestId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    res.json({ message: `Request ${status}`, request: result.rows[0] });
  } catch (err: any) {
    console.error('❌ Mentor respond error:', err.message);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

export default router;
*/

/*
import express from 'express';
import {
  sendRequest,
  viewIncomingRequests,
  respondToRequest
} from '../controllers/requestController';
import { authenticateUser } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';
import pool from '../db';
import { error } from 'node:console';




const router = express.Router();

// only mentees can send mentorship
router.post('/', authenticateUser, async (req, res) => {
  const { mentor_id} = req.body;
  const mentee_id = req.user.id;
  try {
// prevent duplicate requests

    const existing = await pool.query(
      `SELECT * FROM mentorship_requests
       WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'pending'`,
      [mentee_id, mentor_id]
    );
if (existing.rows.length > 0){
  return
  res.status(400).json({error:'Request already sent to this mentor.'})
}
 const result = await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id)
       VALUES ($1, $2) RETURNING *`,
      [mentee_id, mentor_id]
);
res.status(201).json(result.rows[0]);
  } catch(err: any){

    console.error('Error Sending request:', err.message);

    res.status(500).json({error:'Failed to send request'});
  }
});


router.post('/requests', authenticateUser, async (req, res) => {
  const { mentor_id } = req.body;
  const mentee_id = req.user.id;

  // ✅ Block mentor from sending requests
  if (req.user.role !== 'mentee') {
    return res.status(403).json({ error: 'Access denied: Only mentees can send requests' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO mentorship_requests (mentee_id, mentor_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [mentee_id, mentor_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});







// ✅ Get all requests sent by the logged-in mentee
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.created_at, u.name AS mentor_name, u.email AS mentor_email
       FROM mentorship_requests r
       JOIN users u ON r.mentor_id = u.id
       WHERE r.mentee_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error fetching requests:', err.message);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// ✅ Mentors fetch requests sent to them
router.get('/incoming', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.created_at,
              u.name AS mentee_name, u.email AS mentee_email
       FROM mentorship_requests r
       JOIN users u ON r.mentee_id = u.id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('❌ Error loading incoming requests:', err.message);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// PUT /requests/:id/respond
router.put('/:id/respond', authenticateUser, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid response. Use accepted or rejected' });
  }

  try {
    // ✅ 1. Update mentorship request
    const requestRes = await pool.query(
      `UPDATE mentorship_requests
       SET status = $1
       WHERE id = $2 AND mentor_id = $3
       RETURNING *`,
      [status, id, req.user.id]
    );

    const request = requestRes.rows[0];

    if (!request) {
      return res.status(403).json({ error: 'Request not found or access denied' });
    }

    // ✅ 2. If accepted → create session
    let session = null;

    if (status === 'accepted') {
      const now = new Date();
      const defaultDate = now.toISOString().split('T')[0]; // e.g. "2025-07-15"
      const defaultTime = now.toTimeString().split(' ')[0].slice(0, 5); // e.g. "14:30"
      const defaultTopic = 'Getting Started with Mentorship';

      const sessionRes = await pool.query(
        `INSERT INTO sessions (mentee_id, mentor_id, date, time, topic)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [request.mentee_id, request.mentor_id, defaultDate, defaultTime, defaultTopic]
      );

      session = sessionRes.rows[0];
    }

    res.json({
      message: `✅ Request ${status}`,
      request,
      session: session || null,
    });

  } catch (err: any) {
    console.error('❌ Response error:', err.message);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

// ✅ Mentee cancels their own request
router.delete('/:id/cancel', authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    // Only allow canceling if it's your request and still pending
    const result = await pool.query(
      `DELETE FROM mentorship_requests
       WHERE id = $1 AND mentee_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Cancel failed: Not your request or already processed' });
    }

    res.json({ message: '✅ Request canceled', request: result.rows[0] });
  } catch (err: any) {
    console.error('❌ Cancel error:', err.message);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});


// only mentors can send requests
router.put('/respond', authenticateUser, checkRole('mentor'),respondToRequest);

//allow both to view their related requests
router.get('/incoming', authenticateUser, viewIncomingRequests);



//console.log('auth header:', req.headers.authorization);

export default router;

*/
