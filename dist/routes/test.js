"use strict";
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
// ✅ Sample handler function
const testSecureData = (req, res) => {
    res.json({
        message: 'Secure data access granted!',
        user: req.user,
    });
};
// ✅ Protected route using authenticateUser
router.get('/secure-data', authenticateUser, testSecureData);
module.exports = router;
