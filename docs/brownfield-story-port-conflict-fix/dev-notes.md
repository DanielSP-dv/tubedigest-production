# **Dev Notes**

## **Previous Story Insights**
From Story 4.3 (Channel Management Integration):
- Backend running on port 3001, frontend on port 3000 with proxy configuration
- CORS properly configured for frontend-backend communication
- Authentication flow working between frontend and backend
- API proxy configured in Vite with `/api` prefix rewriting to backend endpoints

## **Current System Context**
- **Backend**: NestJS API with authentication and channel endpoints implemented
  - `GET /me` - User authentication status
  - `GET /health` - Health check endpoint
  - `GET /channels` - List user's YouTube subscriptions
  - `POST /channels/select` - Save channel selection
- **Frontend**: React + Vite with authentication service and landing page
- **Integration Issue**: Backend serving frontend HTML instead of API responses

## **Technology Stack**
[Source: docs/tech-stack.md]
- **Backend**: NestJS, TypeScript, Prisma ORM, Google OAuth
- **Frontend**: React, TypeScript, Vite, Ant Design, React Query
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth with session cookies

## **Data Models**
[Source: prisma/schema.prisma]
- `user(id, email, timezone, created_at)`
- `channel_subscription(user_id, channel_id, title, selected_at)`
- `digest(id, user_id, title, content, created_at)`

## **API Specifications**
[Source: src/modules/]
- **Authentication Endpoints**:
  - `GET /me` - Returns user authentication status (JSON)
  - `GET /auth/google` - Initiates Google OAuth flow
  - `GET /auth/google/callback` - OAuth callback handler
- **Health Endpoint**:
  - `GET /health` - Returns health status (JSON)
- **Channel Endpoints**:
  - `GET /channels` - List user subscriptions (JSON)
  - `POST /channels/select` - Save channel selection (JSON)

## **Component Specifications**
[Source: frontend/src/]
- **AuthService**: Handles authentication state and API calls
- **LandingPage**: Main landing page with authentication flow
- **App.tsx**: Main routing with ProtectedRoute and PublicRoute components
- **useAuth Hook**: React hook for authentication state management

## **File Locations**
- **Backend API**: `src/modules/auth/`, `src/modules/channels/`, `src/modules/health/`
- **Frontend Components**: `frontend/src/pages/LandingPage.tsx`, `frontend/src/App.tsx`
- **Frontend Services**: `frontend/src/services/auth.ts`
- **Frontend Hooks**: `frontend/src/hooks/useAuth.ts`
- **API Configuration**: `frontend/vite.config.ts` (proxy settings)
- **Backend Configuration**: `src/main.ts`, `.env` (port configuration)

## **Integration Points**
- **Authentication**: Uses existing OAuth flow for Google API access
- **API Proxy**: Vite proxy forwards `/api/*` to `http://localhost:3001`
- **Session Management**: Cookie-based session handling
- **Error Handling**: Graceful fallbacks and user feedback

## **Testing Standards**
[Source: docs/coding-standards.md]
- **Test Framework**: Jest for unit tests, React Testing Library for component tests
- **Test Location**: `frontend/src/pages/__tests__/` for page tests
- **Backend Tests**: `src/modules/*/*.spec.ts` for service tests
- **Integration Tests**: Use Supertest for API endpoint testing
- **Test Patterns**: Follow AAA pattern (Arrange, Act, Assert)
- **Coverage**: Aim for 80%+ test coverage

## **Technical Constraints**
- **Port Configuration**: Backend must run on 3001, frontend on 3000
- **CORS**: Must maintain existing CORS configuration
- **Authentication**: Must preserve existing OAuth flow
- **API Contract**: No breaking changes to existing API endpoints
- **Performance**: Maintain existing response times

## **Security Considerations**
- **Session Management**: Preserve existing cookie-based authentication
- **CORS Policy**: Maintain existing CORS configuration
- **API Security**: Ensure API endpoints are properly protected
- **Data Validation**: Maintain existing input validation patterns

## **Performance Considerations**
- **Response Times**: API endpoints should respond within 200ms
- **Caching**: Maintain existing React Query caching strategy
- **Bundle Size**: No significant increase in frontend bundle size
- **Database Queries**: Optimize any new database queries
