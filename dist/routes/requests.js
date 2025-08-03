"use strict";
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const requestController = require('../controllers/requestController');
router.post('/', authenticateUser, requestController.sendRequest);
router.get('/incoming', authenticateUser, requestController.viewIncomingRequests);
router.put('/respond', authenticateUser, requestController.respondToRequest);
module.exports = router;
