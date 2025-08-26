# Rate Limiting & Caching
- Respect YouTube quotas with request budgeting and staggering across users
- Cache channel uploads lists and last-processed timestamps to reduce API calls
- Retry with backoff on quota/rate-limit errors; spillover jobs scheduled for next cadence

