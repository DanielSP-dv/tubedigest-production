# Observability
- Logs: structured JSON (request id, job id, user id)
- Metrics (Prometheus-ready):
  - digests_sent_total, digest_build_seconds
  - captions_coverage_ratio, asr_usage_ratio
  - summarize_job_seconds, email_send_seconds
  - provider_error_total{provider,operation}
- Tracing: optional OpenTelemetry (NestJS plugin)

