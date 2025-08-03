"use strict";
const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
router.get('/', mentorController.getAllMentors);
module.exports = router;
