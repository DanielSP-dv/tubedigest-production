# Tech Stack

## Core
- Language/Runtime: TypeScript on Node.js (NestJS)
- Database: Postgres
- Queue/Jobs: Redis + BullMQ

## Integrations
- YouTube: Data API v3 (uploads/captions), Search API (fallback discovery)
- Email (primary preference): Listmonk or Mautic (open-source)
- Email (fallback managed): Postmark or SendGrid

## AI / Summaries
- Local: Ollama runtime
- Models: Qwen/Llama family (configurable); provider-agnostic adapter
- Hosted (optional): pluggable client if free tier available

## Libraries (indicative)
- NestJS modules: @nestjs/*
- HTTP: axios or fetch
- Queue: @nestjs/bullmq + bullmq
- DB: Prisma or TypeORM (choose at implementation)
- Email: provider SDK or SMTP for Listmonk/Mautic
