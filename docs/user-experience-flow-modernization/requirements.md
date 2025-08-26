# Requirements

## Functional Requirements (FR)

**FR1**: Users land on a welcoming landing page that clearly explains TubeDigest value proposition
**FR2**: Landing page has prominent "Create Digest" or "Get Started" button that initiates authentication flow
**FR3**: Authentication flow uses existing OAuth system but provides clear login/account creation options
**FR4**: After successful authentication, new users are automatically redirected to one-time channel selection onboarding
**FR5**: Channel selection onboarding is a beautiful, centered interface similar to Twitter/X account creation
**FR6**: Channel selection shows user's YouTube subscriptions with simple selection interface (up to 10 channels)
**FR7**: "Next" button triggers background loading animation while retrieving video summaries
**FR8**: After onboarding, users land on dashboard with feed of latest videos from selected channels
**FR9**: Dashboard shows video feed with: title, channel, length, reading time, timestamps, summaries
**FR10**: Users can create digest/newsletter from dashboard with "Send Now" or "Schedule" options
**FR11**: Scheduling allows daily, every few days, or custom cadence selection
**FR12**: Channel management page allows users to select/deselect channels (accessible after onboarding)
**FR13**: Channel changes trigger automatic feed refresh to show updated video content
**FR14**: Session persistence maintains user authentication state across browser sessions
**FR15**: Returning users with valid session go directly to dashboard (skip onboarding)

## Non-Functional Requirements (NFR)

**NFR1**: Landing page loads in under 2 seconds with clear value proposition
**NFR2**: Authentication flow completes in under 30 seconds for returning users
**NFR3**: Channel selection onboarding is intuitive and visually appealing (Twitter/X style)
**NFR4**: Background loading animation provides clear feedback during video retrieval
**NFR5**: Dashboard feed loads within 3 seconds and shows real-time video updates
**NFR6**: Video feed updates dynamically when channels post new content (real-time or near real-time)
**NFR7**: All existing functionality (digest generation, email delivery, search) remains intact
**NFR8**: Mobile-responsive design maintains usability across all device sizes
**NFR9**: Channel management interface is simple and intuitive for ongoing channel adjustments

## Compatibility Requirements (CR)

**CR1**: Existing OAuth flow and token management system must remain compatible
**CR2**: Current API endpoints and data models must continue to function
**CR3**: Existing email digest functionality must remain unchanged
**CR4**: Current user data and channel selections must be preserved during transition
