import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/HttpError.js';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../lib/password.js';
import { notifyPasswordResetRequested } from '../lib/notify.js';
import {
  CODE_MINUTES,
  MAX_ATTEMPTS,
  formatResetCode,
  generateResetCode,
  normalizeResetCode,
} from '../lib/resetCode.js';

const userSelect = { id: true, name: true, email: true, department: true };

// POST /api/auth/forgot-password
export async function forgotPassword(req, res){
    const user = await prisma.user.findUnique({where: {email: req.body.email}});

    if( user && user.isActive){
        const waiting = await prisma.passwordReset.findFirst({
            where: { userId: user.id, status: 'PENDING' },
            select: { id: true },
        });
        if (!waiting) {
            await prisma.passwordReset.create({ data: { userId: user.id, status: 'PENDING' } });
            await notifyPasswordResetRequested({ user });
        }
    }
    res.json({
    message: 'Please wait for a reset code from the ICT team.',
  });
}

const BAD_CODE = 'Invalid code!';

// POST /api/auth/reset-password
export async function resetPassword(req, res){
    const { email, code, newPassword } = req.body;
    const user = await prisma.user.findUnique({where: {email}});

    const reset =
    user && user.isActive
    ? await prisma.passwordReset.findFirst({
        where: { userId: user.id, status: 'CODE_ISSUED', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      })
    : null;

    // Always do one comparison
    const codeOk = await verifyPassword(normalizeResetCode(code), reset?.codeHash ?? DUMMY_HASH);

    if (!reset || !codeOk) {
      if (reset) {
        const attempts = reset.attempts + 1;
        await prisma.passwordReset.update({
          where: { id: reset.id },
          data: attempts >= MAX_ATTEMPTS ? { attempts, status: 'DISMISSED' } : { attempts },
          });
        }
        throw new HttpError(400, BAD_CODE);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
        // "Only if still CODE_ISSUED" makes sure one code can be used once, even with two requests at the same time.
        const { count } = await tx.passwordReset.updateMany({
          where: { id: reset.id, status: 'CODE_ISSUED' },
          data: { status: 'USED' },
        });
        if (count === 0) throw new HttpError(400, BAD_CODE);
     
        await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
        await tx.passwordReset.updateMany({
          where: { userId: user.id, status: { in: ['PENDING', 'CODE_ISSUED'] } },
          data: { status: 'DISMISSED' },
        });
    });

    res.json({ message: 'Your password has been changed. You can log in now.' });
}

async function issueCode(resetId, adminId){
    const reset = await prisma.passwordReset.findUnique({
        where: { id: resetId },
        select: { id: true, status: true, user: { select: { ...userSelect, isActive: true } } },
    });
    if (!reset || !['PENDING', 'CODE_ISSUED'].includes(reset.status)) throw new HttpError(404, 'Reset request not found');
    if (!reset.user.isActive) throw new HttpError(400, 'This account is deactivated');
    if (reset.user.id === adminId) throw new HttpError(400, 'Ask another admin to reset your password');
    
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + CODE_MINUTES * 60_000);
    await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { status: 'CODE_ISSUED', codeHash: await hashPassword(code), expiresAt, attempts: 0 },
    });
    
      // This is the only time the code can be seen.
    return { code: formatResetCode(code), expiresAt, user: { id: reset.user.id, name: reset.user.name, email: reset.user.email } };
}

// GET /api/password-resets
export async function listResets(req, res) {
  const resets = await prisma.passwordReset.findMany({
    where: {
      OR: [{ status: 'PENDING' }, { status: 'CODE_ISSUED', expiresAt: { gt: new Date() } }],
    },
    select: { id: true, status: true, createdAt: true, expiresAt: true, user: { select: userSelect } },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ resets });
}

// POST /api/password-resets/:id/issue-code
export async function issueResetCode(req, res) {
  res.json(await issueCode(req.params.id, req.user.id));
}

// POST /api/password-resets/:id/dismiss
export async function dismissReset(req, res) {
  const { count } = await prisma.passwordReset.updateMany({
    where: { id: req.params.id, status: { in: ['PENDING', 'CODE_ISSUED'] } },
    data: { status: 'DISMISSED' },
  });
  if (count === 0) throw new HttpError(404, 'Reset request not found');
  res.json({ ok: true });
}

// POST /api/users/:id/password-reset   
export async function startResetForUser(req, res) {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, isActive: true } });
  if (!target) throw new HttpError(404, 'User not found');
  if (target.id === req.user.id) throw new HttpError(400, 'Ask another admin to reset your password');
  if (!target.isActive) throw new HttpError(400, 'This account is deactivated');

  const open = await prisma.passwordReset.findFirst({
    where: { userId: target.id, status: { in: ['PENDING', 'CODE_ISSUED'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  const reset = open ?? (await prisma.passwordReset.create({ data: { userId: target.id, status: 'PENDING' }, select: { id: true } }));

  res.json(await issueCode(reset.id, req.user.id));
}
