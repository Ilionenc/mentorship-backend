import express from 'express';
import pool from '../db';

const router = express.Router();

router.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'connected', time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

export default router;