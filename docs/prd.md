# TubeDigest MVP Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals

- To create a simple, functional MVP of the TubeDigest application.
- To provide a seamless user experience for the core user flow.
- To create a solid foundation for future development.

### Background Context

The TubeDigest application is designed to help users create and receive email digests of the latest videos from their favorite YouTube channels. This PRD focuses on the core functionality required for an MVP.

## 2. Requirements

### Functional Requirements

- **FR1**: Users must be able to log in to the application using their Google account.
- **FR2**: Users must be able to view a list of their YouTube channel subscriptions.
- **FR3**: Users must be able to select which channels to include in their digest.
- **FR4**: Users must be able to trigger the generation and sending of a digest email.
- **FR5**: Users must be able to log out of the application.

### Non-Functional Requirements

- **NFR1**: The application must be deployable to a public server.
- **NFR2**: The application should be reasonably performant.
- **NFR3**: The codebase should be clean, simple, and easy to understand.

## 3. User Interface Design Goals

- The UI should be clean, simple, and intuitive.
- The UI should be responsive and work well on both desktop and mobile devices.

## 4. Technical Assumptions

- The backend will be a NestJS application.
- The database will be PostgreSQL.
- Authentication will be handled via Google OAuth2.
- The YouTube Data API will be used to fetch channel and video data.
- An SMTP service will be used to send emails.

## 5. Epic and Story Structure

### Epic 1: Core User Flow

**Epic Goal**: To implement the core user flow of the application, from login to receiving a digest email.

- **Story 1.1**: As a user, I want to be able to log in with my Google account so that I can access the application.
- **Story 1.2**: As a user, I want to be able to see a list of my YouTube subscriptions so that I can choose which channels to include in my digest.
- **Story 1.3**: As a user, I want to be able to select or deselect channels to be included in my digest.
- **Story 1.4**: As a user, I want to be able to click a button to generate and send a digest email so that I can receive the latest videos from my selected channels.
- **Story 1.5**: As a user, I want to be able to log out of the application.