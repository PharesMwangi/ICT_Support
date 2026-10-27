import { prisma } from "../lib/prisma.js";
import jwt from 'jsonwebtoken';
import {HttpError } from "../lib/HttpError.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from '../lib/password.js';
import { COOKIE_NAME, cookieOptions, loginCookieOptions, signToken } from '../lib/token.js';

const publicUser = (u) => ({
    id: u.id,
    name:u.name,
    email: u.email,
    role: u.role,
    department:u.department,
});

//signup
export async function signup(req, res){
    const {name, email, department, password} = req.body;

    const existing = await prisma.user.findUnique({where: {email} });
    if(existing) throw new HttpError( 409, 'An account with this email already existe!');

    const user = await prisma.user.create({
        data:{
            name,
            email, 
            department,
            passwordHash: await hashPassword(password),
            role: 'STAFF',
        },
    });
    res.cookie(COOKIE_NAME, signToken(user.id), loginCookieOptions);
    res.status(201).json({ user: publicUser(user) });
}

//login
export async function login(req, res){
    const {email, password } = req.body;

    const user = await prisma.user.findUnique({where: {email} });

    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if( !user || !passwordOk) throw new HttpError(401, 'Invalid email or password');

    if (!user.isActive){
        throw new HttpError(403, 'This account has been deactivated. Please contact the ICT department');
    }

    res.cookie(COOKIE_NAME, signToken(user.id), loginCookieOptions);
    res.json({ user: publicUser(user) });
}

//logout
export function logout(req, res){
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ message: 'Logged out' });
}

//me
export function me(req, res) {
    res.json({ user: publicUser(req.user) });
}