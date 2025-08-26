# High-Level Flow
1. OAuth: User connects Google/YouTube; store refresh tokens securely
2. Channel selection: User selects up to 10 channels; persist preferences and cadence
3. Scheduler (cron): At cadence, enqueue per-user “digest-run” job
4. Ingest pipeline per channel:
   - Fetch new uploads within window via Data API
   - If lookups fail or are incomplete, use Search API to discover latest uploads
   - For each video: prefer creator-provided chapters; resolve captions/transcript; if unavailable → skip with reason or (optionally) run ASR fallback
5. Summarization pipeline per video:
   - Generate paragraph summary and chaptered timeline with timestamps
   - Chaptering: window transcript, title segments heuristically, align to caption timecodes
6. Persistence: Store Transcript (optional), Summary, Chapters; index for search
7. Digest assembly: Build HTML email from latest items; send; record results; also generate a web view URL for each digest
8. Watch Later: Signed link/endpoint from email and action in dashboard to persist item

