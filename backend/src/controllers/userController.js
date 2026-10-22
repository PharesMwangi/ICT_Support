import {prisma} from '../lib/prisma.js';
import {HttpError} from '../lib/HttpError.js';
import { ADMIN_DEPARTMENT } from '../lib/constants.js';
import {listUsersQuery} from '../validators/userSchemas.js';
import { email } from 'zod';

const adminSelect = {
    id: true,
    name: true,
    email:true,
    role:true,
    department: true,
    isActive:true,
    createdAt:true,
};

//admins only
export async function listUsers(req, res) {
  const { department, role } = listUsersQuery.parse(req.query);

  const users = await prisma.user.findMany({
    where: { ...(department && { department }), ...(role && { role }) },
    select: adminSelect,
    orderBy: { name: 'asc' },
  });

  res.json({ users });
}

//update role
export async function setRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  if (id === req.user.id) throw new HttpError(400, 'You cannot change your own role');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'User not found');

  if (role === 'ADMIN') {
    if (!target.isActive) throw new HttpError(400, 'A deactivated account cannot be made an admin');
    if (target.department !== ADMIN_DEPARTMENT) {
      throw new HttpError(400, `Only users in the ${ADMIN_DEPARTMENT} department can be made admins`);
    }
  }

  if (target.role === role) {
    return res.json({ user: pick(target) });
  }

  const user = await prisma.user.update({ where: { id }, data: { role }, select: adminSelect });
  res.json({ user });
}

// PATCH /api/users/:id/active   body: { isActive: true | false }   (admins only)
export async function setActive(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;

  if (id === req.user.id) throw new HttpError(400, 'You cannot deactivate your own account');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, 'User not found');

  const user = await prisma.user.update({ where: { id }, data: { isActive }, select: adminSelect });
  res.json({ user });
}

function pick(u) {
  const { id, name, email, role, department, isActive, createdAt } = u;
  return { id, name, email, role, department, isActive, createdAt };
}
