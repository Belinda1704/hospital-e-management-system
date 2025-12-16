import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} from '../controllers/notice.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getAllNotices);
router.get('/:id', authenticate, getNoticeById);
router.post('/', authenticate, authorize('admin'), createNotice);
router.put('/:id', authenticate, authorize('admin'), updateNotice);
router.delete('/:id', authenticate, authorize('admin'), deleteNotice);

export default router;




