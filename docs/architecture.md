# Architecture

## System Overview
- Backend: NestJS
- Storage: Postgres (primary DB)
- Queue: Redis + BullMQ for background jobs
- Integrations: YouTube Data API v3 (uploads/captions), YouTube Search API (fallback discovery), Email provider
- LLM: Provider-agnostic adapter (local via Ollama preferred; supports Qwen/Llama family; pluggable hosted models if needed)
- Default schedule: daily 09:00 local per user

## High-Level Flow
1. OAuth: User connects Google/YouTube; store refresh tokens securely
2. Channel selection: User selects up to 10 channels; persist preferences and cadence
3. Scheduler (cron): At cadence, enqueue per-user “digest-run” job
4. Ingest pipeline per channel:
   - Fetch new uploads within window via Data API
   - If lookups fail or are incomplete, use Search API to discover latest uploads
   - For each video: prefer creator-provided chapters; resolve captions/transcript; if unavailable → skip with reason or (optionally) run ASR fallback
5. Summarization pipeline per video:
   - Generate paragraph summary and chaptered timeline with timestamps
   - Chaptering: window transcript, title segments heuristically, align to caption timecodes
6. Persistence: Store Transcript (optional), Summary, Chapters; index for search
7. Digest assembly: Build HTML email from latest items; send; record results; also generate a web view URL for each digest
8. Watch Later: Signed link/endpoint from email and action in dashboard to persist item

## Modules (NestJS)
- auth: Google OAuth, token storage, scopes
- channels: list/select subscriptions (limit 10)
- videos: discovery (Data API + Search fallback), metadata
- transcripts: captions fetch/normalization; optional ASR fallback (feature-flagged)
- summaries: LLM calls, prompt templates, chaptering
- digests: scheduling, assembly, email send, tracking, web view rendering
- watchlist: save/list/search user items
- search: simple text search over titles/summaries/chapters
- jobs: BullMQ queues, workers, retries, dead-letter handling

## Performance & Prioritization
- Per-user processing time budget enforced for daily runs; long videos may be truncated, deferred, or skipped with reason
- Job priorities: recent uploads and shorter videos first to meet send window; exponential backoff and DLQ on repeated failures
- Hybrid LLM fallback: if local model exceeds time budget or quality threshold for long/urgent items, temporarily switch to a hosted model

## Deliverability & Web View
- Email deliverability: require SPF/DKIM/DMARC and sender warmup plan
- Provide a web view for each digest (signed token link in email)
- Save-to-Watch-Later CTA hits a signed endpoint that records the user and video id

## Rate Limiting & Caching
- Respect YouTube quotas with request budgeting and staggering across users
- Cache channel uploads lists and last-processed timestamps to reduce API calls
- Retry with backoff on quota/rate-limit errors; spillover jobs scheduled for next cadence

## Data Model (draft)
- user(id, email, tz, created_at)
- oauth_token(user_id, provider, access_token, refresh_token, expires_at)
- channel_subscription(user_id, channel_id, title, selected_at)
- video(id, channel_id, title, url, published_at, duration_s)
- transcript(video_id, source, has_captions, text or blob)
- summary(video_id, model, summary_text)
- chapter(id, video_id, start_s, end_s, title)
- digest_run(id, user_id, scheduled_for, sent_at, status)
- digest_item(digest_run_id, video_id, position)
- watch_later(id, user_id, video_id, saved_at)

## Configuration
- DIGEST_DEFAULT_CADENCE: daily
- DIGEST_DEFAULT_TIME: 09:00 local
- EMAIL_PROVIDER: listmonk|mautic|postmark|sendgrid
- LLM_PROVIDER: ollama|hosted; LLM_MODEL: qwen2:7b or similar
- RATE LIMITS/RETRIES: set per provider; exponential backoff for workers

### Feature Flags & Limits
- ASR_ENABLE: boolean (default false)
- MAX_PROCESSING_TIME_PER_VIDEO_S: number (e.g., 60–180)
- MAX_VIDEOS_PER_DIGEST: number cap (optional per-user)
- PRIORITY_WEIGHTS: recentness vs duration weighting for queues

## Error Handling
- Missing/private captions: mark and skip; include note in logs
- API failures: retry with backoff; DLQ after N attempts
- Email failures: retry send; alert if persistent
- ASR failures (if enabled): mark and skip; never block digest send

## API Design (REST, NestJS)
- Auth
  - GET /auth/google (redirect)
  - GET /auth/google/callback (handles OAuth, stores tokens)
  - GET /me (current user, tz, settings)
- Channels
  - GET /channels (list user subscriptions)
  - POST /channels/select {channelIds: string[]} (limit 10)
  - GET /channels/selected
- Digests
  - GET /digests/latest (user’s latest digest metadata)
  - GET /digests/:id (signed link web view)
  - POST /digests/run (admin/service-trigger)
- Watch Later
  - POST /watchlater {videoId}
  - GET /watchlater?q=... (list/search)
  - DELETE /watchlater/:id
- Videos
  - GET /videos/:id (summary + chapters)

## Queues & Workers (BullMQ)
- ingest-queue: discover new uploads per channel (Data API → Search fallback)
- transcript-queue: fetch/normalize captions; optional ASR fallback if enabled
- summarize-queue: LLM summaries + chaptering
- digest-queue: assemble per-user digest items and compose
- email-queue: send digest emails; record results; generate web view

Retry Policy: exponential backoff; max attempts configurable per queue; DLQ topics with alerting.

## Provider Adapters
- LLMAdapter
  - summarizeTranscript(videoId, transcript, options) → {summaryText}
  - generateChapters(videoId, transcript, options) → {chapters: [{start_s,end_s,title}]}
  - Health: ping() and latency metrics
- EmailAdapter
  - sendDigestEmail(user, items, webUrl) → {messageId,status}
  - supports: Listmonk/Mautic via SMTP/API; Postmark/SendGrid fallback
- CaptionsProvider
  - fetchCaptions(videoId) → {has_captions, text}
  - Optional: runASR(videoUrl) → {text} (feature-flagged)

## Security
- OAuth scopes: YouTube read-only where possible; store refresh tokens encrypted
- Signed links (JWT/HMAC) for web digest and watch-later actions in emails
- Rate limiting: per-IP for public routes; per-user for mutation endpoints
- Secrets: managed via environment; never log tokens or PII

## Deployment & Environments
- Envs: local, staging, prod
- DB migrations: Prisma/TypeORM migrations on deploy
- Background workers: scale independently (ingest/transcript/summarize/email) with concurrency settings
- Static assets: none required for MVP; email templates embedded or stored

## Observability
- Logs: structured JSON (request id, job id, user id)
- Metrics (Prometheus-ready):
  - digests_sent_total, digest_build_seconds
  - captions_coverage_ratio, asr_usage_ratio
  - summarize_job_seconds, email_send_seconds
  - provider_error_total{provider,operation}
- Tracing: optional OpenTelemetry (NestJS plugin)

## Testing Strategy
- Unit: services (summaries, transcripts, digests), adapters (mock providers)
- Integration: end-to-end job chains in local env with test Redis/Postgres
- API: supertest for endpoint contracts and auth flows
- Fixtures: sample transcripts and videos metadata; golden files for email HTML

## Open Design Questions
- Which ORM: Prisma vs TypeORM
- Default local model: qwen2:7b vs llama3.1 variants
- Email templating engine choice (MJML, Handlebars)
