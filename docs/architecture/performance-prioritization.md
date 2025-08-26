# Performance & Prioritization
- Per-user processing time budget enforced for daily runs; long videos may be truncated, deferred, or skipped with reason
- Job priorities: recent uploads and shorter videos first to meet send window; exponential backoff and DLQ on repeated failures
- Hybrid LLM fallback: if local model exceeds time budget or quality threshold for long/urgent items, temporarily switch to a hosted model

