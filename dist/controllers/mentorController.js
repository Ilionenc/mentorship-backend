"use strict";
const pool = require('../db');
exports.getAllMentors = async (req, res) => {
    const { name, skill } = req.query;
    let query = 'SELECT id, name, email, bio, skills, goals FROM users WHERE role = $1';
    const values = ['mentor'];
    if (name) {
        query += ' AND name ILIKE $2';
        values.push(`%${name}%`);
    }
    else if (skill) {
        query += ' AND $2 = ANY(skills)';
        values.push(skill);
    }
    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
