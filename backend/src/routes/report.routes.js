import express from 'express';
import { getDashboardStats, getAppointmentStats } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/dashboard-stats', authenticate, getDashboardStats);
router.get('/appointment-stats', authenticate, getAppointmentStats);

export default router;




