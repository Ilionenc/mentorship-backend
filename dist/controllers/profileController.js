"use strict";
const pool = require('../db');
async function getMyProfile(req, res) {
    try {
        const result = await pool.query('SELECT id, name, email, role, bio, skills, goals FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateMyProfile(req, res) {
    const { name, bio, skills, goals } = req.body;
    try {
        const result = await pool.query('UPDATE users SET name = $1, bio = $2, skills = $3, goals = $4 WHERE id = $5 RETURNING *', [name, bio, skills, goals, req.user.id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
module.exports = {
    getMyProfile,
    updateMyProfile,
};
