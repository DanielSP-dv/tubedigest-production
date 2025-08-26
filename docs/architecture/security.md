# Security
- OAuth scopes: YouTube read-only where possible; store refresh tokens encrypted
- Signed links (JWT/HMAC) for web digest and watch-later actions in emails
- Rate limiting: per-IP for public routes; per-user for mutation endpoints
- Secrets: managed via environment; never log tokens or PII

