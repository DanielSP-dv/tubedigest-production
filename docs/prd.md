# TubeDigest MVP — PRD

## Scope (MVP)
- Connect YouTube account (OAuth), let user select up to 10 channels
- Daily or weekly digest with paragraph summaries and timestamped chapter breakdowns
- HTML email delivery; “Save to Watch Later” from email or dashboard; basic search
- English-only; process videos up to 4 hours; optimize for speed

## Product Decisions
- Transcript & discovery: Use YouTube Data API (Uploads/Captions). If a video match isn’t found via primary lookups, fall back to YouTube Search API to resolve channel uploads/new videos. Gracefully skip videos without accessible captions.
- Email delivery: Prefer free/open-source first (Listmonk or Mautic). If not feasible, use managed provider (Postmark or SendGrid).
- LLM for summaries: Prefer free/local first (Ollama with Qwen/Llama family). If a hosted free tier is available (e.g., OpenAI/others), can be used; otherwise keep provider-pluggable.
- Digest cadence: Default daily at 9:00 AM user local time (configurable to weekly).

## Must‑Have Features
1. YouTube OAuth + channel picker (limit 10)
2. Automatic summaries with timestamped chapters
3. HTML email digest delivery
4. Save to Watch Later + search in dashboard

## Acceptance Criteria (MVP)
- Given a connected account and selected channels, new uploads within the window are summarized and included in the next digest
- Each digest item contains: title, URL, paragraph summary, chapter list with timestamps
- Emails are sent on schedule (default daily 9 AM local); failures are logged and retried
- User can save a video to Watch Later from email or dashboard; items appear in Watch Later list and are searchable
- Private/missing-caption videos are skipped with a recorded reason

## Metrics
- Digest open/click rate; time-to-summary; save-to-watch-later actions; weekly retention

---

# Product Requirements Document (Structured per BMAD Template)

## Goals and Background Context

### Goals
- Deliver daily/weekly digest of new videos from user-selected channels (≤10)
- Provide concise paragraph summaries plus chaptered timestamps
- Let users save items to a Watch Later list and search later
- Reduce time spent watching while keeping users fully informed

### Background Context
TubeDigest targets heavy YouTube learners who follow multiple long‑form educational channels. They want to scan what’s new quickly, pick what’s worth watching, and avoid time sinks. The MVP connects a YouTube account, lets users pick channels, summarizes new uploads, and emails a daily/weekly digest with clear CTAs to save videos.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-14 | v0.1 | Initial MVP PRD draft | PM |

## Requirements

### Functional (FR)
- FR1: User can authenticate with Google/YouTube OAuth and connect their account
- FR2: User can select up to 10 channels for digest inclusion
- FR3: System ingests new uploads for selected channels within the time window
- FR4: System fetches transcripts from captions when available; otherwise records skip reason
- FR5: System generates a paragraph summary for each video
- FR6: System generates chaptered timestamps across the video timeline
- FR7: System assembles and sends an HTML email digest on schedule (daily/weekly)
- FR8: User can save a video to a personal Watch Later list via email and dashboard
- FR9: User can search saved/summarized items (title/summary/chapters)
- FR10: Admin/ops logging for failures and retry states (ingest, LLM, email)
- FR11: Prefer creator-provided YouTube chapters when available; otherwise generate chapters programmatically
- FR12: Provide a web view of each digest (in addition to email)

### Non‑Functional (NFR)
- NFR1: English‑only; videos up to 4 hours
- NFR2: “As fast as possible” UX; digest build completes within practical limits for daily runs
- NFR3: Reliable scheduling with retries and dead‑letter handling for failed jobs
- NFR4: Secure storage of OAuth tokens; least privilege OAuth scopes
- NFR5: Observability for pipeline steps (metrics/logs)
- NFR6: Pluggable providers (LLM, email) behind stable interfaces
- NFR7: Per‑user daily processing time budget with prioritized queueing to ensure on‑time sends
- NFR8: Hybrid LLM fallback policy for long/urgent items (e.g., switch to hosted model when local model exceeds time budget)

## User Interface Design Goals
- Overall UX Vision: Simple “scan and decide” experience; one clear digest per cadence; easy Save action; clean dashboard with search
- Key Interaction Paradigms: Email‑first scanning; minimal clicks to save; dashboard filtering/search
- Core Screens and Views: Auth/Connect; Channel Picker; Digest Email; Dashboard (Saved/All); Settings (Cadence/TZ)
- Accessibility: None specific for MVP; adopt reasonable defaults
- Branding: Minimal MVP styling; space for future brand
- Target Device and Platforms: Web Responsive; email clients (desktop/mobile)

## Technical Assumptions
- Repository Structure: Monorepo (single NestJS service)
- Service Architecture: Monolith (NestJS)
- Testing Requirements: Unit + Integration (services, jobs)
- Additional Assumptions and Requests:
  - YouTube Data API v3 for uploads/captions; Search API as fallback discovery
  - Email provider preference: Listmonk or Mautic; fallback Postmark/SendGrid
  - LLM via Ollama (Qwen/Llama family); optional hosted free tier; adapter abstraction
  - Postgres primary DB; Redis + BullMQ for jobs
  - Default schedule: daily 09:00 local; weekly optional
  - Optional ASR fallback (e.g., Whisper) behind a feature flag for videos without captions
  - Email deliverability: SPF/DKIM/DMARC required and sender warmup plan
  - Digest personalization: per‑user filters and “top N” cap configurable to control noise

## Epic List (proposed)
- Epic 1: Foundation & Auth — Project setup, Google OAuth, token storage, basic health checks
- Epic 2: Channel Selection — List subscriptions, pick ≤10, persist preferences and cadence
- Epic 3: Ingest & Summarize — Fetch new uploads, transcripts, summaries, chapters, persistence
- Epic 4: Digest Email — Template, assemble per user, send, track
- Epic 5: Watch Later & Search — Save from email/UI, list/search saved items

## Next Steps
- UX Expert Prompt: “Design a simple, scannable digest email and a minimal dashboard for Watch Later and search.”
- Architect Prompt: “Produce NestJS module design, queues, providers, and data model aligned with PRD constraints.”
