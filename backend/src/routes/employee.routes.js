import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  getMyEmployeeInfo,
  createEmployee,
  updateEmployee
} from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllEmployees);
router.get('/me', authenticate, getMyEmployeeInfo);
router.get('/:id', authenticate, authorize('admin'), getEmployeeById);
router.post('/', authenticate, authorize('admin'), createEmployee);
router.put('/:id', authenticate, authorize('admin'), updateEmployee);

export default router;




