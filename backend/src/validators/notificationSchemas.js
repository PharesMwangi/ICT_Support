import { z } from 'zod';

export const listNotificationsQuery = z.object({
    unread: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});