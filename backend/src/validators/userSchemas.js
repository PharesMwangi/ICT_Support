import { z } from 'zod';
import { DEPARTMENTS, ROLES } from '../lib/constants.js';

export const listUsersQuery = z.object({
    department: z.enum(DEPARTMENTS).optional(),
    role: z.enum(ROLES).optional(),
});

export const setRoleSchema = z.object({ role: z.enum(ROLES)});

export const setActiveSchema = z.object({ isActive: z.boolean() });