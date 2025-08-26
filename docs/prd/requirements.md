# Requirements

## Functional (FR)
- FR1: User can authenticate with Google/YouTube OAuth and connect their account
- FR2: User can select up to 10 channels for digest inclusion
- FR3: System ingests new uploads for selected channels within the time window
- FR4: System fetches transcripts from captions when available; otherwise records skip reason
- FR5: System generates a paragraph summary for each video
- FR6: System generates chaptered timestamps across the video timeline
- FR7: System assembles and sends an HTML email digest on schedule (daily/weekly)
- FR8: User can save a video to a personal Watch Later list via email and dashboard
- FR9: User can search saved/summarized items (title/summary/chapters)
- FR10: Admin/ops logging for failures and retry states (ingest, LLM, email)
- FR11: Prefer creator-provided YouTube chapters when available; otherwise generate chapters programmatically
- FR12: Provide a web view of each digest (in addition to email)

## Non‑Functional (NFR)
- NFR1: English‑only; videos up to 4 hours
- NFR2: “As fast as possible” UX; digest build completes within practical limits for daily runs
- NFR3: Reliable scheduling with retries and dead‑letter handling for failed jobs
- NFR4: Secure storage of OAuth tokens; least privilege OAuth scopes
- NFR5: Observability for pipeline steps (metrics/logs)
- NFR6: Pluggable providers (LLM, email) behind stable interfaces
- NFR7: Per‑user daily processing time budget with prioritized queueing to ensure on‑time sends
- NFR8: Hybrid LLM fallback policy for long/urgent items (e.g., switch to hosted model when local model exceeds time budget)
