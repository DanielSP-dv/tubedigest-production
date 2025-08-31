# TubeDigest Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the TubeDigest codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements.

### Document Scope

Comprehensive documentation of the entire system, with a focus on the core MVP flow: login -> channel selection -> dashboard -> send email -> log out.

### Change Log

| Date       | Version | Description                 | Author    |
| ---------- | ------- | --------------------------- | --------- |
| 2025-08-31 | 1.0     | Initial brownfield analysis | Gemini AI |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/main.ts`
- **App Module**: `src/modules/app.module.ts`
- **Configuration**: `.env.example`
- **Core Business Logic**:
  - `src/modules/auth/auth.service.ts`
  - `src/modules/channels/channels.service.ts`
  - `src/modules/digests/digests.service.ts`
  - `src/modules/email/email.service.ts`
- **API Definitions**:
  - `src/modules/auth/auth.controller.ts`
  - `src/modules/channels/channels.controller.ts`
  - `src/modules/digests/digests.controller.ts`
- **Database Models**: `prisma/schema.prisma`

## High Level Architecture

### Technical Summary

The TubeDigest backend is a monolithic application built with NestJS. It uses a PostgreSQL database via the Prisma ORM. The application is designed to be deployed as a single service. Authentication is handled via Google OAuth2. The core functionality revolves around fetching YouTube channel data, creating digests of recent videos, and emailing them to users.

### Actual Tech Stack

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | 20.x    | As per `package.json`      |
| Framework | NestJS     | 10.x    | As per `package.json`      |
| Database  | PostgreSQL | 13+     | Assumed from Prisma usage  |
| ORM       | Prisma     | 5.x     | As per `package.json`      |

### Repository Structure Reality Check

- Type: Monorepo (with a `frontend` directory that is currently empty)
- Package Manager: npm

## Source Tree and Module Organization

### Project Structure (Actual)

```text
project-root/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── channels/
│   │   ├── digests/
│   │   ├── email/
│   │   └── youtube/
│   ├── prisma/
│   └── main.ts
├── tests/
└── ...
```

### Key Modules and Their Purpose

- **AppModule**: The root module that imports all other core modules.
- **AuthModule**: Handles user authentication via Google OAuth2.
- **ChannelsModule**: Manages user channel subscriptions.
- **DigestsModule**: Creates and manages video digests.
- **EmailModule**: Sends emails to users.
- **YoutubeModule**: Interacts with the YouTube Data API.

## Data Models and APIs

### Data Models

- **User**: Represents a user of the application.
- **OAuthToken**: Stores OAuth2 tokens for users.
- **ChannelSubscription**: Represents a user's subscription to a YouTube channel.
- **DigestRun**: Represents a single digest generation run.
- **DigestItem**: Represents a single video in a digest.

(See `prisma/schema.prisma` for detailed schema)

### API Specifications

- **Auth API**: `src/modules/auth/auth.controller.ts`
- **Channels API**: `src/modules/channels/channels.controller.ts`
- **Digests API**: `src/modules/digests/digests.controller.ts`

## Technical Debt and Known Issues

- The `frontend` directory is empty, so the frontend is not yet implemented.
- The `digests.service.ts` has a complex dependency graph, including a circular dependency with the `jobs` module (which has been removed).
- The error handling is inconsistent across the application.
- There is a lack of unit and integration tests.

## Integration Points and External Dependencies

### External Services

| Service         | Purpose         | Integration Type | Key Files                      |
| --------------- | --------------- | ---------------- | ------------------------------ |
| Google OAuth2   | Authentication  | OAuth2           | `src/modules/auth/auth.service.ts` |
| YouTube Data API| Fetching videos | REST API         | `src/modules/youtube/youtube.service.ts` |
| SMTP Provider   | Sending emails  | SMTP             | `src/modules/email/email.service.ts` |

## Development and Deployment

### Local Development Setup

1. Install dependencies with `npm install`.
2. Set up a PostgreSQL database and configure the connection in `.env`.
3. Run database migrations with `npx prisma migrate dev`.
4. Start the application with `npm run start:dev`.

### Build and Deployment Process

- **Build Command**: `npm run build`
- **Deployment**: The `Dockerfile` and `deploy.sh` script suggest a container-based deployment.

## Testing Reality

- There is a lack of automated tests in the project.
