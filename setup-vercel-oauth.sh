#!/bin/bash

# TubeDigest Vercel OAuth Setup Script
echo "🔧 Setting up Google OAuth for Vercel Deployment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Your TubeDigest App URL:${NC}"
echo -e "${GREEN}https://frontend-rho-topaz-86.vercel.app${NC}"
echo ""

echo -e "${YELLOW}🚀 Follow these steps to configure Google OAuth:${NC}"
echo ""
echo "1. Go to Google Cloud Console:"
echo "   https://console.cloud.google.com/"
echo ""
echo "2. Navigate to: APIs & Services → Credentials"
echo ""
echo "3. Edit your OAuth 2.0 Client ID"
echo ""
echo "4. Add these Authorized JavaScript Origins:"
echo -e "${GREEN}   http://localhost:3000${NC}"
echo -e "${GREEN}   http://localhost:3001${NC}"
echo -e "${GREEN}   https://frontend-rho-topaz-86.vercel.app${NC}"
echo -e "${GREEN}   https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app${NC}"
echo ""
echo "5. Add these Authorized Redirect URIs:"
echo -e "${GREEN}   http://localhost:3000/auth/google/callback${NC}"
echo -e "${GREEN}   http://localhost:3001/auth/google/callback${NC}"
echo -e "${GREEN}   https://frontend-rho-topaz-86.vercel.app/auth/google/callback${NC}"
echo -e "${GREEN}   https://frontend-k74mvkve8-daniels-projects-8eaaf3eb.vercel.app/auth/google/callback${NC}"
echo ""
echo "6. Save the changes"
echo ""
echo -e "${BLUE}📝 Your current Google OAuth credentials:${NC}"
echo "Client ID: your-google-client-id-here"
echo "Client Secret: your-google-client-secret-here"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Keep your Client Secret secure"
echo "- Never commit it to version control"
echo "- Use these credentials in your backend deployment"
echo ""
echo -e "${GREEN}✅ Once configured, your friends can authenticate at:${NC}"
echo "https://frontend-rho-topaz-86.vercel.app"
echo ""
echo -e "${BLUE}📚 For detailed instructions, see: GOOGLE_OAUTH_VERCEL_SETUP.md${NC}"
