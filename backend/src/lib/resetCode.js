import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;
export const CODE_MINUTES = 30;
export const MAX_ATTEMPTS = 5;

export function generateResetCode(){
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
    return code;
}

// Shown as ABCD-EFGH.
export const formatResetCode = (code) => `${code.slice(0, 4)}-${code.slice(4)}`;

export const normalizeResetCode = (input) => input.toUpperCase().replace(/[^A-Z0-9]/g, '');