import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import healthRoutes from './routes/health';
import sessionRoutes from './routes/sessions';
import profileRoutes from './routes/profile';
import mentorRoutes from './routes/mentors';
import availabilityRoutes from './routes/availabilityRoutes';
import adminRoutes from './routes/adminRoutes';



import pool from './db';

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', res.rows[0]);
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

dotenv.config();
const app = express();
app.use(cors({origin:'http://localhost:3000', //React frontend
credentials:true,
}));
app.use(express.json());

app.use('/users', userRoutes);
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/requests', requestRoutes);
app.use('/mentor-requests', requestRoutes);
app.use('/sessions', sessionRoutes);
app.use('/profile', profileRoutes);
app.use('/', mentorRoutes);
app.use('/availability', availabilityRoutes);
app.use('/', availabilityRoutes);
app.use('/admin', adminRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});