import { z } from 'zod';

const title = z.string().trim().min(3, 'Title is too short').max(150, 'Title is too long');
const description = z
    .string()
    .trim()
    .min(30, 'Description is too short')
    .max(2000, 'Descriptio too long');

export const createArticleSchema = z.object({ title, description });

export const updateArticleSchema = z
  .object({ title, description })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Send a title or a description to update' });

export const listKbQuery = z.object({ q: z.string().trim().max(100).optional() });