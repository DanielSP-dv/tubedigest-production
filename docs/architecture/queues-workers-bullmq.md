# Queues & Workers (BullMQ)
- ingest-queue: discover new uploads per channel (Data API → Search fallback)
- transcript-queue: fetch/normalize captions; optional ASR fallback if enabled
- summarize-queue: LLM summaries + chaptering
- digest-queue: assemble per-user digest items and compose
- email-queue: send digest emails; record results; generate web view

Retry Policy: exponential backoff; max attempts configurable per queue; DLQ topics with alerting.

