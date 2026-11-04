import { prisma } from './prisma.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const KEEP_DAYS = 60;

//notifications older than 60 days are removed.
export async function deleteOldNotifications(now = new Date()){
    const cutoff = new Date(now.getTime() - KEEP_DAYS * DAY_MS);
    const { count } = await prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff }}});
    return count;
}

// Finished or abandoned password reset requests are not kept for long either.
export async function deleteOldPasswordResets(now = new Date()) {
  const cutoff = new Date(now.getTime() - 7 * DAY_MS);
  const { count } = await prisma.passwordReset.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}

export function startNotificationCleanup(){
    const run = () => deleteOldNotifications().catch((err) => console.error(`Notification cleanup failed: ${err.message}`));
    run();
    setInterval(run, DAY_MS).unref();
}