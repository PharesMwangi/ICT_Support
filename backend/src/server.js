import { app } from "./app";
import { env } from "./config/env";
import { Prisma } from "./lib/prisma";

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