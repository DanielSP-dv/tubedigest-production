# Testing Strategy
- Unit: services (summaries, transcripts, digests), adapters (mock providers)
- Integration: end-to-end job chains in local env with test Redis/Postgres
- API: supertest for endpoint contracts and auth flows
- Fixtures: sample transcripts and videos metadata; golden files for email HTML

