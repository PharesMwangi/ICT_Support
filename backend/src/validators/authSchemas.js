import { z } from 'zod';
import { DEPARTMENTS } from '../lib/constants';

export const passwordSchema = z
.string()
.min(8, 'Password must be at least 8 characters')
.max(72, 'Password must be at most 72 characters')
.regex(/[A-Za-z]/, 'Password must contain at least one letter')
.regex(/[0-9]/, 'Password must contain at least one number');


export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  department: z.enum(DEPARTMENTS, { message: 'Choose a department from the list' }),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(72),
});
