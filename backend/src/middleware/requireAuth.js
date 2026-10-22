import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/HttpError.js";
import { COOKIE_NAME, verifyToken } from "../lib/token.js";

export async function requireAuth(req, res, next){
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) throw new HttpError(401, 'Please Log in');

    let payload;
    try {
        payload = verifyToken(token);
    } catch  {
        throw new HttpError(401, 'Your session has expired. Please log in again');
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
    });

    if(!user || !user.isActive) throw new HttpError(401, 'Please log in');

    req.user = user;
    next();
}