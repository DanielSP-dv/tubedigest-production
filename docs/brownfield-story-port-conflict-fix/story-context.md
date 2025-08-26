# **Story Context**

**Existing System Integration:**
- **Integrates with**: Frontend React application, authentication service, API proxy configuration
- **Technology**: NestJS backend, React frontend, Vite dev server, proxy configuration
- **Follows pattern**: Standard frontend-backend separation with API proxy

**Current Problem:**
- Backend (port 3001) is serving frontend HTML instead of API responses
- Frontend authentication service is stuck in loading state
- API endpoints return HTML content instead of JSON
- Port configuration conflicts between frontend and backend
