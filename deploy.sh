#!/bin/bash

# TubeDigest Production Deployment Script
# This script helps deploy the application to Vercel (frontend) and Render (backend)

set -e

echo "🚀 TubeDigest Production Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
check_vercel() {
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    else
        echo -e "${GREEN}✅ Vercel CLI found${NC}"
    fi
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo -e "${BLUE}🎨 Deploying Frontend to Vercel...${NC}"
    
    cd frontend
    
    # Build the frontend
    echo -e "${BLUE}📦 Building frontend...${NC}"
    npm run build:prod
    
    # Deploy to Vercel
    echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
    vercel --prod --yes
    
    cd ..
}

# Instructions for backend deployment
backend_instructions() {
    echo -e "${BLUE}🔧 Backend Deployment Instructions:${NC}"
    echo ""
    echo -e "${YELLOW}1. Go to https://render.com and sign up/login${NC}"
    echo -e "${YELLOW}2. Click 'New +' and select 'Web Service'${NC}"
    echo -e "${YELLOW}3. Connect your GitHub repository${NC}"
    echo -e "${YELLOW}4. Configure the service:${NC}"
    echo -e "${YELLOW}   - Name: tubedigest-backend${NC}"
    echo -e "${YELLOW}   - Build Command: npm install && npm run build${NC}"
    echo -e "${YELLOW}   - Start Command: npm start${NC}"
    echo -e "${YELLOW}   - Plan: Free${NC}"
    echo -e "${YELLOW}5. Add environment variables from your .env file${NC}"
    echo -e "${YELLOW}6. Deploy!${NC}"
    echo ""
}

# Main deployment process
main() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    check_vercel
    
    echo -e "${BLUE}🚀 Starting deployment process...${NC}"
    
    # Deploy frontend
    deploy_frontend
    
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo ""
    
    # Show backend instructions
    backend_instructions
    
    echo -e "${GREEN}🎉 Deployment process completed!${NC}"
    echo -e "${BLUE}📱 Your app will be available at: https://tubedigest-frontend.vercel.app${NC}"
    echo -e "${YELLOW}⚠️  Remember to update the backend URL in vercel.json after backend deployment${NC}"
}

# Run main function
main "$@"
