import { z } from 'zod';
import { passwordSchema } from './authSchemas.js';

export const forgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
});

export const resetPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    code: z.string().trim().min(4, 'Enter the code the ICT team gave you').max(20),
    newPassword: passwordSchema,
});