import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { idParams } from '../validators/commonSchemas.js';
import { listNotifications, markAllRead, markRead, unreadCount } from '../controllers/notificationController.js';

const router = Router();

// Every logged-in user (staff and admin) has their own notifications.
router.use(requireAuth);
router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.post('/read-all', markAllRead);
router.post('/:id/read', validate(idParams, 'params'), markRead);

export default router;