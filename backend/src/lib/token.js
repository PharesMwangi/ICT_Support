import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'

export const COOKIE_NAME ='ict_token';
const EIGHT_HOURS_MS = 8*60*60*1000;

// The token only holds the user id. Role and active status are read from the
// database on every request, so promotions and deactivations apply immediately.
export const signToken = (userId) =>
    jwt.sign({ sub: userId }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });

export const verifyToken = (token) =>
    jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

export const cookieOptions ={
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
};

export const loginCookieOptions = { ...cookieOptions, maxAge: EIGHT_HOURS_MS };
