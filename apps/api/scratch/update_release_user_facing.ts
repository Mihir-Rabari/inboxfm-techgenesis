import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const version = "0.2.0";
const title = "The Big Update";
const slug = "the-big-update-0-2-0";
const description = "We've spent the last few weeks improving reliability, polishing the experience, and building tools that help us communicate better with our beta community.";

const changes = [
  {
    "category": "FEATURE",
    "description": "✨ New Experience: The new 'Imagine Tomorrow Morning' storytelling section visualizing calm narrated briefings."
  },
  {
    "category": "IMPROVEMENT",
    "description": "📧 Better Emails: Redesigned email experience with cleaner layouts, improved readability, and beautiful dark-mode support."
  },
  {
    "category": "IMPROVEMENT",
    "description": "🔒 Simpler Controls: Permanent one-click unsubscribe links that work instantly and never expire."
  },
  {
    "category": "FIX",
    "description": "🛠 Reliability Improvements: Fixed navigation and page loading issues affecting some visitors."
  },
  {
    "category": "FIX",
    "description": "🎯 Polish & Design Improvements: Polished page layouts, cleaner messaging, and an improved mobile experience."
  },
  {
    "category": "IMPROVEMENT",
    "description": "🚀 Performance & Stability: Numerous under-the-hood improvements that make InboxFM faster and more reliable."
  }
];

const content = `We've spent the last few weeks improving reliability, polishing the experience, and building tools that help us communicate better with our beta community.

### ✨ New Experience

The new "Imagine Tomorrow Morning" storytelling section.

See the difference between starting your day buried under dozens of notifications versus receiving a calm, narrated briefing that tells you exactly what matters.

---

### 📧 Better Emails

Redesigned email experience with improved readability and reliability.

Expect:

* Cleaner layouts
* Better readability
* Improved dark-mode support
* More reliable delivery
* Faster access to important updates

---

### 🔒 Simpler Controls

Permanent one-click unsubscribe support.

No expired links.
No extra steps.
No frustration.

---

### 🛠 Reliability Improvements

Fixed navigation and loading issues across browsers.

The platform is now more stable across browsers and devices.

---

### 🎨 Design Improvements

Cleaner pages, improved mobile experience, and better dark mode support.

* Improved mobile layout and navigation
* Cleaner branding and messaging
* Better search engine previews
* Enhanced accessibility across pages
* Consistent light and dark mode support

---

### 🚀 Performance & Stability

Numerous under-the-hood improvements that make InboxFM faster and more reliable.

---

### Looking Ahead

InboxFM is still in closed beta, but v0.2.0 lays the foundation for a more reliable, polished, and scalable experience as we prepare for wider access.
`;

async function main() {
    console.log(`Locating release ${version} in database...`);
    const existing = await prisma.releaseNote.findFirst({
        where: { version }
    });

    if (existing) {
        console.log(`Found release ${version} (ID: ${existing.id}). Updating to user-facing copy...`);
        const updated = await prisma.releaseNote.update({
            where: { id: existing.id },
            data: {
                title,
                slug,
                description,
                changes,
                content,
                isPublished: true,
                updatedAt: new Date()
            }
        });
        console.log(`Successfully updated release ${version} (ID: ${updated.id}) to user-facing format!`);
    } else {
        console.log(`Release ${version} does not exist. Creating fresh in user-facing format...`);
        const created = await prisma.releaseNote.create({
            data: {
                version,
                title,
                slug,
                description,
                changes,
                content,
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log(`Successfully created release ${version} (ID: ${created.id})!`);
    }

    // Invalidate Redis Cache
    try {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        console.log(`Connecting to Redis at ${host}:${port} to invalidate cache...`);
        const redis = new Redis({ host, port });
        
        await redis.del('releases:all');
        await redis.del(`releases:slug:${slug}`);
        console.log('Successfully cleared and invalidated Redis cache for releases!');
        
        await redis.disconnect();
    } catch (err: any) {
        console.error('Failed to invalidate Redis cache:', err.message);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
