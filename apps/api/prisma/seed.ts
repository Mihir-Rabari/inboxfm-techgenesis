import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user email
  const adminEmail = "mihirrabari2604@gmail.com";
  const adminPassword = "Admin@InboxFM2024";

  // Check if admin already exists
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.log(`Creating admin user: ${adminEmail}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Mihir Rabari",
        password: hashedPassword,
      },
    });

    // Create admin record
    await prisma.admin.create({
      data: {
        userId: admin.id,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("   ⚠️  IMPORTANT: Change this password after first login!");
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);

    // Check if admin record exists
    const adminRecord = await prisma.admin.findUnique({
      where: { userId: admin.id },
    });

    if (!adminRecord) {
      await prisma.admin.create({
        data: {
          userId: admin.id,
        },
      });
      console.log("✅ Admin record created for existing user");
    }
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
