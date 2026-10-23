// Run with:  npm run db:seed      (safe to run more than once)
// 1. Fills the SLA targets table.
// 2. Creates the first ADMIN from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env.

import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';
import { ADMIN_DEPARTMENT } from '../src/lib/constants.js';
import { passwordSchema } from '../src/validators/authSchemas.js';

const SLA_MINUTES = { HIGH: 3 * 60, MEDIUM: 6 * 60, LOW: 2 * 24 * 60 };

async function seedSla(){
    for(const [priority, resolutionMinutes] of Object.entries(SLA_MINUTES)){
        await prisma.slaPolicy.upsert({
            where: { priority },
            update: {}, // keep any changes the ICT team made later
            create: { priority, resolutionMinutes },
        });
    }
    console.log('SLA targets ready: High 3h, Normal 6h, Low 2 days');
}

async function seedAdmin(){
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if(!ADMIN_NAME | !ADMIN_EMAIL | !ADMIN_PASSWORD){
        console.log('ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD not set: skipping first admin');
        return;
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await prisma.user.findUnique({where: { email } });
    if(existing){
        console.log(`Admin ${email} already exists: left unchanged`);
        return;
    }

    const check = passwordSchema.safeParse(ADMIN_PASSWORD);
    if(!check.success){
        console.error('ADMIN_PASSWORD is too weak:', check.error.issues.map((i) => i.message).join('; '));
        process.exitCode = 1;
        return;
    }

    await prisma.user.create({
        data:{
            name: ADMIN_NAME.trim(),
            email,
            department: ADMIN_DEPARTMENT,
            passwordHash: await hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
        },
    });
    console.log(`First admin created: ${email}`);
}

try {
    await seedSla();
    await seedAdmin();
} finally {
    await prisma.$disconnect();
}