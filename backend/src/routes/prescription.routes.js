import express from 'express';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription
} from '../controllers/prescription.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.post('/', authenticate, authorize('admin', 'doctor'), createPrescription);
router.put('/:id', authenticate, authorize('admin', 'doctor'), updatePrescription);
router.delete('/:id', authenticate, authorize('admin', 'doctor'), deletePrescription);

export default router;




