# Source Tree

```
src/
  main.ts
  app.module.ts
  config/
    app.config.ts
  modules/
    auth/
    channels/
    videos/
    transcripts/
    summaries/
    digests/
    watchlist/
    search/
    jobs/
  infra/
    db/  # Prisma or TypeORM setup
    email/
  common/
    dto/
    entities/
    utils/
```

Notes
- Keep modules small and focused; background work in `jobs` with BullMQ workers
- Provider adapters (LLM, email) live under `infra/`
