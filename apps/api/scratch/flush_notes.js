const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.releaseNote.deleteMany({});
    console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
