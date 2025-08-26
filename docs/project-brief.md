# TubeDigest — Project Brief (MVP)

## 1) Overview
TubeDigest helps heavy YouTube learners stay fully informed without watching every video. Users connect their YouTube account, select up to 10 channels, and receive a daily/weekly email digest with concise paragraph summaries and timestamped chapter breakdowns. From the email or dashboard, they can save interesting videos to a personal Watch Later list and search them later.

## 2) Target Users
- Knowledge workers, students, researchers
- Productivity-focused people who follow multiple channels
- First niche: self‑learners in tech/finance/science long‑form content

## 3) Core Job‑to‑Be‑Done
“Let me quickly scan what’s new from my chosen channels, decide what’s worth watching later, and reduce total YouTube time while staying informed.”

## 4) MVP Scope
- Connect YouTube (OAuth) and select up to 10 channels
- Summarize new uploads and generate chaptered timestamps
- Deliver HTML email digest (daily or weekly)
- Save to Watch Later from email or dashboard; basic search

## 5) Outputs
- Paragraph summary
- Chapter list with timestamps (e.g., 0:00–5:00 Intro)
- Formats: HTML email (MVP); optional export: Markdown/PDF/JSON (later)

## 6) Inputs
- MVP: Connected YouTube account (selected channels only)

## 7) Constraints & Defaults
- Language: English‑only
- Max video length: 4 hours
- Latency: as fast as possible
- Default digest cadence: Daily at 9:00 AM user local time (configurable)
- Backend stack: NestJS (TypeScript/Node)

## 8) Key Differentiators
- Curated digest from user‑selected channels (≤10)
- Inline “Save to Watch Later” from email and dashboard
- Tight loop between summaries, watch‑later, and searchable dashboard

## 9) Tech/Integration Decisions (MVP)
- YouTube ingestion: Data API v3 (uploads/captions)
- Fallback discovery: YouTube Search API when uploads lookup fails
- Transcripts: Use captions when available; gracefully skip otherwise
- Email delivery: Prefer open‑source free (Listmonk/Mautic); fallback to managed (Postmark/SendGrid)
- LLM: Prefer free/local via Ollama (Qwen/Llama family); allow hosted free tier if available; provider‑agnostic adapter
- Storage: Postgres; Jobs: Redis + BullMQ

## 10) Success Metrics (MVP)
- Digest open/click rates
- Time‑to‑summary per video and per digest run
- “Save to Watch Later” actions
- Weekly retained users

## 11) Risks & Mitigations
- Missing captions/private videos → skip with reason; surface count in digest run report
- API rate limits → queue with backoff; DLQ for persistent failures
- Email deliverability → SPF/DKIM setup; start with small warmup volume

## 12) Open Questions
- Which email provider first (Listmonk vs Mautic vs managed)?
- Which default local model (e.g., Qwen2 7B) and prompt template?
- Weekly digest default day/time and time‑zone handling UX?
