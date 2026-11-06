import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/HttpError.js';
import { listNotificationsQuery } from '../validators/notificationSchemas.js';

const select = { id: true, type: true, message: true, isRead: true, createdAt: true, ticketId: true };

// GET - /api/notifications?unread
export async function listNotifications(req, res){
    const q = listNotificationsQuery.parse(req.query);
    const where = { userId: req.user.id, ...(q.unread === 'true' && { isRead: false }) };

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          select,
          orderBy: { createdAt: 'desc' },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
      ]);

      res.json({ notifications, unreadCount, page: q.page, limit: q.limit, total });
}

// GET /api/notifications/unread-count 
export async function unreadCount(req, res) {
  const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({ count });
}

// POST /api/notifications/:id/read
export async function markRead(req, res) {
  const { count } = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  if (count === 0) throw new HttpError(404, 'Notification not found');
  res.json({ ok: true });
}

// POST /api/notifications/read-all
export async function markAllRead(req, res) {
  const { count } = await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ updated: count });
}
