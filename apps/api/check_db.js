const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.summarySchedule.findMany();
  console.dir(schedules, { depth: null });
  
  const briefs = await prisma.dailyBrief.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.dir(briefs, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
