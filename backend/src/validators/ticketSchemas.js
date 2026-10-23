import { z } from 'zod';
import { CATEGORIES } from '../lib/constants.js';
import { STATUSES } from '../lib/ticketRules.js';

export const createTicketSchema = z.object({
  summary: z.string().trim().min(5, 'Summary is too short').max(150, 'Summary is too long (150 characters at most)'),
  description: z.string().trim().min(10, 'Please describe the problem in a bit more detail').max(5000, 'Description is too long'),
  category: z.enum(CATEGORIES, { message: 'Choose a category from the list' }),
});

export const listTicketsQuery = z.object({
  status: z.enum(['OPEN', ...STATUSES]).optional(), // OPEN = not resolved and not closed
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  category: z.enum(CATEGORIES).optional(),
  assignee: z.string().trim().max(50).optional(), // a user id, or "me"
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const updateTicketSchema = z
  .object({
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    assigneeId: z.string().min(1).max(50),
    status: z.enum(STATUSES),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Send a priority, an assignee or a status to update' });

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Write a comment first').max(2000, 'Comment is too long'),
  isInternal: z.boolean().optional(),
});

export const attachmentParams = z.object({
  id: z.string().min(1).max(50),
  attachmentId: z.string().min(1).max(50),
});
