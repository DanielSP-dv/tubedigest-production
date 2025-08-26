# Modules (NestJS)
- auth: Google OAuth, token storage, scopes
- channels: list/select subscriptions (limit 10)
- videos: discovery (Data API + Search fallback), metadata
- transcripts: captions fetch/normalization; optional ASR fallback (feature-flagged)
- summaries: LLM calls, prompt templates, chaptering
- digests: scheduling, assembly, email send, tracking, web view rendering
- watchlist: save/list/search user items
- search: simple text search over titles/summaries/chapters
- jobs: BullMQ queues, workers, retries, dead-letter handling

