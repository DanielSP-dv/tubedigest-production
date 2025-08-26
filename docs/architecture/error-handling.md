# Error Handling
- Missing/private captions: mark and skip; include note in logs
- API failures: retry with backoff; DLQ after N attempts
- Email failures: retry send; alert if persistent
- ASR failures (if enabled): mark and skip; never block digest send

