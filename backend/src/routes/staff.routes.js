import express from 'express';
import { createStaff, getAllStaff } from '../controllers/staff.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Allow all authenticated users to view staff (for appointment booking, etc.)
// But only admins can create staff
router.get('/', authenticate, getAllStaff);
router.post('/', authenticate, authorize('admin'), createStaff);

export default router;

