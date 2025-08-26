# Executive Summary

This architecture integrates the existing NestJS backend with a React frontend using Ant Design, optimizing for the **email-first, dashboard-supporting** user experience defined in the Front End Specification.

**Key Architectural Decisions:**
- **Frontend Stack**: React + Ant Design + TypeScript
- **Backend Stack**: NestJS + Postgres + Redis (unchanged)
- **Integration Pattern**: REST APIs with JWT authentication
- **Deployment**: Separate frontend/backend deployments with shared domain
- **Email Strategy**: Custom HTML/CSS templates with Ant Design visual language
