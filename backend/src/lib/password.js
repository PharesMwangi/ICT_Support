import bcrypt from 'bcryptjs';

const COST = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain, hash) => bcrypt.compare( plain, hash);

//for unknown emails
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);