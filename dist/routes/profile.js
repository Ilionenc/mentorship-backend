"use strict";
const express = require('express');
const router = express.Router();
// import the midddleware and controller
const { authenticateUser } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
//console.log(profileController); // debug line
// View own profile 
router.get('/me', authenticateUser, profileController.getMyProfile);
console.log('DEBUG:', profileController);
// Update own profile
//router.put('/me', { authenticateUser }, profileController.updateMyProfile);
module.exports = router;
