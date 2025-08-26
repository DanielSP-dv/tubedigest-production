#!/bin/bash

# TubeDigest Unified Development Startup Script
# Architect: Winston (BMAD Architect Agent)
# Date: August 21, 2025

set -e

echo "🏗️  TubeDigest Development Environment Startup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend (NestJS)...${NC}"
    if check_port 3001; then
        echo -e "${YELLOW}⚠️  Backend already running on port 3001${NC}"
    else
        cd src
        npm run dev &
        BACKEND_PID=$!
        echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
        cd ..
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend (React + Vite)...${NC}"
    if check_port 3000; then
        echo -e "${YELLOW}⚠️  Frontend already running on port 3000${NC}"
    else
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
        cd ..
    fi
}

# Function to wait for services to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Function to run health checks
health_check() {
    echo -e "${BLUE}🏥 Running Health Checks...${NC}"
    
    # Backend health check
    if curl -s "http://localhost:3001/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
    
    # Frontend health check
    if curl -s "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend health check passed${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
    fi
}

# Function to display service URLs
show_urls() {
    echo -e "${BLUE}🌐 Service URLs:${NC}"
    echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}   Backend:  http://localhost:3001${NC}"
    echo -e "${GREEN}   Health:   http://localhost:3001/health${NC}"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}🛑 Shutting down development environment...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting TubeDigest Development Environment${NC}"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "src" ]; then
        echo -e "${RED}❌ Error: Please run this script from the TubeDigest project root${NC}"
        exit 1
    fi
    
    # Start services
    start_backend
    start_frontend
    
    # Wait for services to be ready
    wait_for_service "http://localhost:3001/health" "Backend"
    wait_for_service "http://localhost:3000" "Frontend"
    
    # Run health checks
    health_check
    
    # Show URLs
    show_urls
    
    echo -e "${GREEN}🎉 Development environment is ready!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
