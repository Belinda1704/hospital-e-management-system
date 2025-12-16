import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment
} from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.post('/', authenticate, authorize('admin', 'nurse', 'doctor', 'patient'), createAppointment);
router.put('/:id', authenticate, authorize('admin', 'nurse', 'doctor'), updateAppointment);
router.post('/:id/cancel', authenticate, authorize('admin', 'nurse', 'doctor', 'patient'), cancelAppointment);
router.post('/:id/complete', authenticate, authorize('admin', 'doctor'), completeAppointment);

export default router;

