import { z } from 'zod';
import { CATEGORIES } from '../lib/constants.js';
import { STATUSES } from '../lib/ticketRules.js';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');

export const reportQuery = z.object({
    from: day.optional(),
    to: day.optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
    category: z.enum(CATEGORIES).optional(),
});