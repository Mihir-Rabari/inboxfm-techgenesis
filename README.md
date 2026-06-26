# 🎧 Inbox FM

> *"AI-powered daily email briefings for faster decisions."*

Inbox FM turns Gmail activity into concise spoken and text summaries, powered by Gemini AI.

## Tech Stack

- **Frontend**: Next.js 14 + TailwindCSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL (Docker)
- **Queue**: Redis + Bull (Docker)
- **AI**: Gemini 3 flash
- **TTS**: Google Gemini TTS

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start Docker services for development (PostgreSQL + Redis + MinIO)
pnpm docker:up

# Start Docker services for production infra only (PostgreSQL + Redis)
# Requires POSTGRES_PASSWORD in your environment
pnpm docker:up:prod

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Environment Variables

Copy the example files and fill in values:

1. `apps/api/.env.example` → `apps/api/.env`
2. `apps/web/.env.example` → `apps/web/.env.local`

The API requires `S3_*` credentials for audio storage, and VAPID keys enable web push notifications.

## Project Structure

```
inbox-fm/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types & utils
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## License

MIT
