import express from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  dischargePatient,
  transferPatient
} from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllPatients);
router.get('/:id', authenticate, getPatientById);
router.post('/', authenticate, authorize('admin', 'nurse'), createPatient);
router.put('/:id', authenticate, authorize('admin', 'nurse', 'doctor'), updatePatient);
router.post('/:id/discharge', authenticate, authorize('admin', 'doctor'), dischargePatient);
router.post('/:id/transfer', authenticate, authorize('admin', 'doctor'), transferPatient);

export default router;




