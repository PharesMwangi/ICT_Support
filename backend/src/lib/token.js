import jwt from 'jsonwebtoken';
import { env } from '../config/env'

export const COOKIE_NAME ='ict_token';
const EIGHT_HOURS_MS = 8*60*60*1000;

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
