import express from 'express';
import {
  getAllPayroll,
  getMyPayroll,
  createPayroll,
  updatePayroll
} from '../controllers/payroll.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllPayroll);
router.get('/me', authenticate, getMyPayroll);
router.post('/', authenticate, authorize('admin'), createPayroll);
router.put('/:id', authenticate, authorize('admin'), updatePayroll);

export default router;




