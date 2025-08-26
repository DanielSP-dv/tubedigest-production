# API Design (REST, NestJS)
- Auth
  - GET /auth/google (redirect)
  - GET /auth/google/callback (handles OAuth, stores tokens)
  - GET /me (current user, tz, settings)
- Channels
  - GET /channels (list user subscriptions)
  - POST /channels/select {channelIds: string[]} (limit 10)
  - GET /channels/selected
- Digests
  - GET /digests/latest (user’s latest digest metadata)
  - GET /digests/:id (signed link web view)
  - POST /digests/run (admin/service-trigger)
- Watch Later
  - POST /watchlater {videoId}
  - GET /watchlater?q=... (list/search)
  - DELETE /watchlater/:id
- Videos
  - GET /videos/:id (summary + chapters)

