"use strict";
const pool = require('../db');
// Mentee sends a request to mentor
exports.sendRequest = async (req, res) => {
    const menteeId = req.user.id;
    const { mentor_id } = req.body;
    try {
        const result = await pool.query(`INSERT INTO mentorship_requests (mentee_id, mentor_id)
       VALUES ($1, $2) RETURNING *`, [menteeId, mentor_id]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Mentor views requests sent to them
exports.viewIncomingRequests = async (req, res) => {
    const mentorId = req.user.id;
    try {
        const result = await pool.query(`SELECT mr.id, u.name AS mentee_name, mr.status, mr.created_at
       FROM mentorship_requests mr
       JOIN users u ON u.id = mr.mentee_id
       WHERE mr.mentor_id = $1`, [mentorId]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Mentor accepts or rejects a request
exports.respondToRequest = async (req, res) => {
    const mentorId = req.user.id;
    const { request_id, action } = req.body;
    if (!['accepted', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }
    try {
        const result = await pool.query(`UPDATE mentorship_requests
       SET status = $1
       WHERE id = $2 AND mentor_id = $3
       RETURNING *`, [action, request_id, mentorId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Request not found or not yours' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
