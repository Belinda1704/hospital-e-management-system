import express from 'express';
import {
  getAllMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
} from '../controllers/medicalRecord.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllMedicalRecords);
router.get('/:id', authenticate, getMedicalRecordById);
router.post('/', authenticate, authorize('admin', 'doctor'), createMedicalRecord);
router.put('/:id', authenticate, authorize('admin', 'doctor'), updateMedicalRecord);
router.delete('/:id', authenticate, authorize('admin', 'doctor'), deleteMedicalRecord);

export default router;




