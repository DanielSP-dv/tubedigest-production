# TubeDigest Final MVP Roadmap

## 🎯 **MVP Vision: Complete User Flow**

### **User Journey (Your Vision):**
1. **Landing Page** → Anonymous user sees "Create Your First Digest"
2. **Authentication** → Google OAuth login
3. **Channel Selection** → New onboarding page showing subscribed YouTube channels
4. **Dashboard** → Video feed with selected channels + channel management sidebar
5. **Email Digest** → "Send Digest" button sends email with summaries

## 📊 **Current Status**

### ✅ **What's Working:**
- Landing page with "Create Your First Digest" button
- Google OAuth authentication flow
- Basic dashboard with video feed
- Backend API with CORS configured
- React frontend with Ant Design

### 🔄 **What Needs to be Built:**

#### **Feature 1: Channel Selection Onboarding**
- New page after authentication
- Fetch user's subscribed YouTube channels
- Toggle selection interface
- "Next" button to proceed to dashboard

#### **Feature 2: Enhanced Dashboard with Channel Management**
- Sidebar with collapsible channel list
- Toggle channels on/off
- Refresh button to update video feed
- "Edit Channels" option

#### **Feature 3: Email Digest System**
- "Send Digest" button on dashboard
- Email service integration
- Digest email templates with video summaries

## 🚀 **Implementation Plan**

### **Phase 1: Channel Selection Onboarding**
**Priority**: High
**Timeline**: 1 week

**Tasks:**
- [ ] Create channel selection page component
- [ ] Integrate YouTube API to fetch subscribed channels
- [ ] Build channel toggle interface
- [ ] Add navigation flow: Auth → Channel Selection → Dashboard
- [ ] Store selected channels in database

### **Phase 2: Enhanced Dashboard**
**Priority**: High
**Timeline**: 1 week

**Tasks:**
- [ ] Add collapsible sidebar for channel management
- [ ] Implement channel toggle functionality
- [ ] Add refresh button for video feed
- [ ] Filter video feed by selected channels
- [ ] Add "Edit Channels" navigation

### **Phase 3: Email Digest System**
**Priority**: High
**Timeline**: 1 week

**Tasks:**
- [ ] Integrate email service (Nodemailer/SendGrid)
- [ ] Create digest email templates
- [ ] Add "Send Digest" button to dashboard
- [ ] Implement email delivery logic
- [ ] Test email functionality

## 🧹 **Cleanup Strategy**

### **Files to Archive:**
```
docs/archive/
├── authentication-crisis-brownfield.story.md
├── brownfield-story-port-conflict-fix.md
├── authentication-flow-fix.md
├── user-experience-flow-modernization-prd.md
├── authentication-system-modernization-epic.md
├── encryption-fix-story.md
├── mvp-validation-story.md
├── phase-2-real-data-integration-story.md
└── stories/
    ├── 1.1.story.md
    ├── 1.2.story.md
    ├── 1.3.story.md
    ├── 2.1.story.md
    ├── 2.2.story.md
    ├── 2.3.story.md
    └── 2.4.story.md
```

### **Keep Active:**
```
docs/
├── final-mvp-roadmap.md (this file)
├── mvp-completion-roadmap.md
├── architecture.md
├── prd.md
└── stories/
    ├── 3.1.story.md (Email Digest)
    ├── 3.2.story.md (Channel Selection)
    └── 3.3.story.md (Enhanced Dashboard)
```

## 🎯 **Success Criteria**

### **MVP Definition of Done:**
- [ ] User can authenticate with Google
- [ ] User can select YouTube channels after authentication
- [ ] User can see video feed filtered by selected channels
- [ ] User can manage channels via sidebar
- [ ] User can send email digest with video summaries
- [ ] Complete onboarding flow works end-to-end

### **User Experience Goals:**
- [ ] Smooth onboarding: Auth → Channel Selection → Dashboard
- [ ] Intuitive channel management
- [ ] Real-time video feed updates
- [ ] One-click email digest sending
- [ ] Professional email templates

## 🚀 **Next Steps**

### **Immediate Actions:**
1. **Archive completed files** to clean up documentation
2. **Create focused stories** for the 3 remaining features
3. **Implement Phase 1** (Channel Selection Onboarding)
4. **Test end-to-end flow** after each phase

### **BMAD Method Commands:**
```bash
# Create focused stories
*task brownfield-create-story

# Execute story implementation
*task execute-checklist

# Document project state
*task document-project
```

## 🎉 **Goal**

**Complete MVP in 3 weeks** with a clean, focused approach that delivers exactly the user experience you've described.

**Simple. Clean. Effective.** 🚀

