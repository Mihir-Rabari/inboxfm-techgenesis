# 🎧 Inbox FM

<div align="center">
  <img src="https://img.shields.io/badge/Tech--Stack-Next.js%2014%20%7C%20NestJS%20%7C%20PostgreSQL-ff6a00?style=for-the-badge" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/AI--Engine-Gemini%203.5%20Flash%20%26%20Pro-0091ff?style=for-the-badge" alt="AI Engine" />
  <img src="https://img.shields.io/badge/Queue--System-Redis%20%2F%20BullMQ-cc0000?style=for-the-badge" alt="Queue System" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<p align="center">
  <strong>"The open-source audio-first inbox. We turn cluttered emails into a daily morning podcast."</strong>
</p>

---

## ⚡ Overview

**Inbox FM** is a premium, open-source personal briefing assistant. Instead of spending your first 30 minutes of the morning scanning hundreds of newsletter updates, project alerts, and sales threads, Inbox FM securely indexes your inbox, groups them intelligently, synthesizes key details using **Google Gemini 3.5**, and narrates them to you as a high-fidelity daily spoken briefing.

---

## 🏗️ System Architecture

Inbox FM is built as a production-grade TypeScript monorepo designed for high throughput and reliable background processing.

```mermaid
flowchart TB
    subgraph Client ["🖥️ Presentation Layer (Next.js)"]
        WebDash["Web Dashboard (Dashboard, Player, Settings)"]
        Landing["Landing Page & Onboarding"]
    end

    subgraph APIGateway ["⚙️ Gateway & Coordination (NestJS)"]
        AuthCtrl["Auth Controller (OAuth & JWT)"]
        WaitlistCtrl["Waitlist Controller"]
        BriefCtrl["Briefings Controller"]
        PrismaORM["Prisma Client"]
    end

    subgraph DataStore ["🗄️ Storage Layer"]
        PG["PostgreSQL DB"]
        S3["AWS S3 / MinIO (Audio Cache)"]
    end

    subgraph Workers ["⚡ Async Queue Processing (BullMQ & Redis)"]
        RedisQ[("Redis BullMQ Queues")]
        MailFetcher["Gmail Fetcher Job"]
        AISynth["Gemini Summarizer Job"]
        TTSWorker["Gemini TTS Generator Job"]
    end

    subgraph ExtServices ["🌐 External Gateways"]
        GoogleOAuth["Google OAuth & Gmail API"]
        GeminiAPI["Google Gemini API (AI Synthesis)"]
    end

    %% Connections
    WebDash <-->|HTTPS / REST| APIGateway
    AuthCtrl <-->|OAuth Tokens| GoogleOAuth
    BriefCtrl -->|Read / Write Metadata| PrismaORM
    PrismaORM <--> PG
    
    %% Queue Jobs
    BriefCtrl -->|Enqueue Fetch/Process Request| RedisQ
    RedisQ <--> MailFetcher
    RedisQ <--> AISynth
    RedisQ <--> TTSWorker
    
    %% Worker Operations
    MailFetcher -->|Pull raw emails| GoogleOAuth
    AISynth -->|Context Summarization| GeminiAPI
    TTSWorker -->|Generate voice briefs| GeminiAPI
    TTSWorker -->|Save MP3 files| S3
    
    %% Dashboard pulls audio
    WebDash <-->|Stream Spoken Briefings| S3
```

### Architectural Highlights
- **Rate-Limit Safe Rotation**: Supports up to three distinct Gemini API keys, automatically rotating them to safeguard against API quota failures.
- **Strict Decoupled Queues**: BullMQ offloads Gmail connection fetches, text summarization, and heavy audio synthesis tasks to background workers, ensuring 100ms API response times.
- **Secure Encrypted Tokens**: Gmail connection OAuth refresh tokens are stored in the database encrypted via `AES-256-GCM` using custom hardware keys.

---

## ✨ Features Breakdown

### 📬 Smart Email Syncer
- Integrates securely via Google OAuth.
- Fetches and classifies threads into categories: `URGENT`, `ACTION_REQUIRED`, `MEETINGS`, and `NEWSLETTERS`.

### 🎙️ AI Spoken briefings
- Conversational audio generation powered by Google Gemini TTS.
- Select from multiple custom voice personas:
  - 📡 **Newsroom**: Structured, authoritative, anchor-style reading.
  - ☕ **Friend**: Conversational, lighthearted, and casual.
  - 🏎️ **Speedster**: Ultra fast, high-density, action-item-focused recap.

### 📅 Action Item Automation
- Automatically parses and extracts project agreements, calendar updates, and requests.
- Offers one-click scheduling interfaces for events.

---

## 🛠️ Tech Stack & Directory Structure

```
inbox-fm/
├── apps/
│   ├── api/          # NestJS application (controllers, modules, prisma schemas)
│   └── web/          # Next.js 14 client (pages, player components, styles)
├── packages/
│   └── shared/       # Shared TypeScript types, utility helpers, and schemas
```

* **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion, Phosphor Icons.
* **Backend**: NestJS, Prisma ORM, BullMQ, Redis.
* **Storage**: PostgreSQL (Relational Database), MinIO/S3 (Object Store for Audio caching).
* **AI Engine**: Gemini 3.5 Flash & Pro, Google TTS.

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

- **Node.js**: `18.x` or higher
- **pnpm**: `8.x` or higher
- **Docker & Docker Compose**: installed and running

### 🔧 Step-by-Step Installation

1. **Clone and Install Workspace Dependencies**
   ```bash
   pnpm install
   ```

2. **Spin Up Infrastructural Services (PostgreSQL + Redis + MinIO)**
   ```bash
   pnpm docker:up
   ```

3. **Database Configuration & Migrations**
   ```bash
   # Generate Prisma client bindings
   pnpm db:generate

   # Apply schema database migrations
   pnpm db:migrate
   ```

4. **Environment Setups**
   Set up your keys and secrets by copying the configurations:
   * **API Gateway Configuration**: Copy `apps/api/.env.example` ➡️ `apps/api/.env`
   * **Web Client Configuration**: Copy the web section in [.env.example](file:///K:/ifn/.env.example) to `apps/web/.env.local`

5. **Start Dev Server**
   ```bash
   pnpm dev
   ```
   * Frontend: `http://localhost:3000` | Backend Gateway: `http://localhost:3001`

---

## 🔑 Access Control Bypass (Testing)

> [!TIP]
> **Waitlist & Access Code Requirement is Disabled**
> We modified the registration process so that anyone can register and verify accounts immediately. No waitlist validation or access code is required for email/password signup or direct Google OAuth login.

### Re-Enabling Access Codes
If you want to run the platform in private beta mode:
1. Revert changes in `apps/api/src/modules/auth/auth.service.ts` to re-enable waitlist verification.
2. The platform automatically generates `IFM-XXXXXXXX` access codes.
3. For testing, you can associate the approved email with the active bypass code: **`IFM-TECHGENESIS`**.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](file:///K:/ifn/LICENSE) for more details.
