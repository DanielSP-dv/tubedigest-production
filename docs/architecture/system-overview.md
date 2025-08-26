# System Overview
- Backend: NestJS
- Storage: Postgres (primary DB)
- Queue: Redis + BullMQ for background jobs
- Integrations: YouTube Data API v3 (uploads/captions), YouTube Search API (fallback discovery), Email provider
- LLM: Provider-agnostic adapter (local via Ollama preferred; supports Qwen/Llama family; pluggable hosted models if needed)
- Default schedule: daily 09:00 local per user

