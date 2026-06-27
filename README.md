# 🎧 Inbox FM

<div align="center">
  <img src="https://img.shields.io/badge/Tech--Stack-Next.js%2014%20%7C%20NestJS%20%7C%20PostgreSQL-ff6a00?style=for-the-badge" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/AI--Engine-Gemini%203.5%20Flash%20%26%20Pro-0091ff?style=for-the-badge" alt="AI Engine" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<p align="center">
  <strong>"AI-powered daily email briefings for faster decisions."</strong>
</p>

Inbox FM transforms your cluttered Gmail activity into concise, engaging spoken and text summaries powered by Google Gemini AI. Wake up to a personalized narrative briefing of your inbox instead of reading hundreds of emails manually.

---

## ✨ Features

- **📬 Smart Email Fetching**: Securely logs into Gmail using Google OAuth and indexes fresh emails.
- **🎙️ Narrative Audio Briefings**: Uses Gemini's advanced Text-to-Speech (TTS) models to generate high-quality spoken newsletters.
- **⚡ Voice Persona Selection**: Customize briefings with different speaking styles:
  - `NEWSROOM`: Professional, authoritative anchor tone.
  - `FRIEND`: Casual, conversational, and lighthearted.
  - `SPEEDSTER`: Fast-paced, action-oriented recap.
- **📅 Action Item Automation**: Extracts calendar invitations, task agreements, and deadlines, offering one-click scheduling.
- **🔔 Web Push Notifications**: Keep updated on briefing status right in your browser.
- **🚀 Access Code Bypass (Enabled)**: Registration and login are open for evaluation, bypassing waitlist approvals.

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 14, React, TailwindCSS, Framer Motion, Phosphor Icons, Lucide React |
| **Backend** | NestJS (TypeScript), Prisma ORM, BullMQ, Redis |
| **Database** | PostgreSQL |
| **Storage** | MinIO / AWS S3 (for audio caching and transcripts) |
| **AI/TTS** | Google Gemini (3.1/3.5 Flash and Pro), Google TTS Engine |
| **Deployment** | Docker, Nginx, Vercel |

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js**: `18.x` or higher
- **pnpm**: `8.x` or higher
- **Docker & Docker Compose**: installed and running

### 🔧 Step-by-Step Setup

1. **Clone and Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Spin Up Infrastructural Services (PostgreSQL, Redis, MinIO)**
   ```bash
   pnpm docker:up
   ```

3. **Database Configuration & Migrations**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Apply schema changes and run database migrations
   pnpm db:migrate
   ```

4. **Set Up Environments**
   Copy the Unified environment templates to respective locations and fill out configuration details:
   - Root template: [.env.example](file:///K:/ifn/.env.example)
   - Copy API secrets: `apps/api/.env.example` ➡️ `apps/api/.env`
   - Copy Web client parameters: `apps/web/.env.example` ➡️ `apps/web/.env.local`

5. **Start Dev Mode**
   ```bash
   pnpm dev
   ```
   *Frontend will run at `http://localhost:3000` and API gateway at `http://localhost:3001`.*

---

## 🔑 Onboarding & Access Code Override

> [!NOTE]
> **Waitlist & Access Code Requirement is Disabled**
> To allow seamless public testing, the signup validation logic has been simplified. Anyone can register an account and try the application instantly.

### Re-enabling Access Codes (Production Mode)

If you wish to enforce private access controls:
1. Revert changes in [auth.service.ts](file:///K:/ifn/apps/api/src/modules/auth/auth.service.ts) to re-enable waitlist queries.
2. In the DB, approved waitlist submissions generate access codes in the format `IFM-XXXXXXXX`.
3. Set your active test code in the database or waitlist entry:
   - **Current Testing Access Code**: `IFM-TECHGENESIS` (Assign this to a waitlisted email address in the database with status `APPROVED`).

---

## 📁 Project Structure

```
inbox-fm/
├── apps/
│   ├── api/          # NestJS Web Server, Queue Processing & OAuth Services
│   └── web/          # Next.js Frontend Dashboard, Player Client & Landing Page
├── packages/
│   └── shared/       # Shared TypeScript models, contracts, and utilities
├── docker-compose.dev.yml   # Multi-container dev system config
└── docker-compose.prod.yml  # Multi-container production config
```

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](file:///K:/ifn/LICENSE) for more details.
