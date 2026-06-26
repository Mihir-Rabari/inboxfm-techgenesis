import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.release.deleteMany({});
    console.log(`Deleted ${deleted.count} releases`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
