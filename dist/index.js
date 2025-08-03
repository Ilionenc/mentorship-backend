"use strict";
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
//import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const mentorRoutes = require('./routes/mentors');
const requestRoutes = require('./routes/requests');
//const testRoute = require('./routes/test');
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/mentors', mentorRoutes);
app.use('/requests', requestRoutes);
//app.use('/test', testRoute);
app.listen(PORT, () => {
    console.log('Server running on port 5000');
});
