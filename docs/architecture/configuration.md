# Configuration
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

