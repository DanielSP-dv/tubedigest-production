# Provider Adapters
- LLMAdapter
  - summarizeTranscript(videoId, transcript, options) → {summaryText}
  - generateChapters(videoId, transcript, options) → {chapters: [{start_s,end_s,title}]}
  - Health: ping() and latency metrics
- EmailAdapter
  - sendDigestEmail(user, items, webUrl) → {messageId,status}
  - supports: Listmonk/Mautic via SMTP/API; Postmark/SendGrid fallback
- CaptionsProvider
  - fetchCaptions(videoId) → {has_captions, text}
  - Optional: runASR(videoUrl) → {text} (feature-flagged)

