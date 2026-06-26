const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.release.deleteMany({});
    console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
