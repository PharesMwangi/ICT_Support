import { app } from './app.js'
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () =>{
    console.log(`ICT Support API running on port ${env.PORT} (${env.NODE_ENV})`);
});

// Render sends SIGTERM when it restarts or redeploys the service.
async function shutdown(){
    server.close(async () =>{
        await prisma.$disconnect();
        process.exit(0);
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGint', shutdown);