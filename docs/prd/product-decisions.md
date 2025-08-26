# Product Decisions
- Transcript & discovery: Use YouTube Data API (Uploads/Captions). If a video match isn’t found via primary lookups, fall back to YouTube Search API to resolve channel uploads/new videos. Gracefully skip videos without accessible captions.
- Email delivery: Prefer free/open-source first (Listmonk or Mautic). If not feasible, use managed provider (Postmark or SendGrid).
- LLM for summaries: Prefer free/local first (Ollama with Qwen/Llama family). If a hosted free tier is available (e.g., OpenAI/others), can be used; otherwise keep provider-pluggable.
- Digest cadence: Default daily at 9:00 AM user local time (configurable to weekly).
