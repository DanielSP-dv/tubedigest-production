#!/bin/bash

# Script to start TubeDigest development environment
# Kills any existing processes and starts fresh instances

echo "🛑 Stopping any existing TubeDigest processes..."

# Kill existing processes
pkill -f "ts-node-dev" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait a moment for processes to terminate
sleep 2

echo "🚀 Starting TubeDigest backend on port 3001..."
cd /Users/D/TubeDigest
PORT=3001 npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

echo "🚀 Starting TubeDigest frontend on port 3000..."
cd /Users/D/TubeDigest/frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"

echo "📋 Checking if services are running..."
BACKEND_CHECK=$(lsof -i :3001 -P -t 2>/dev/null)
FRONTEND_CHECK=$(lsof -i :3000 -P -t 2>/dev/null)

if [ ! -z "$BACKEND_CHECK" ]; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend failed to start"
    tail -n 10 /Users/D/TubeDigest/backend.log
fi

if [ ! -z "$FRONTEND_CHECK" ]; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend failed to start"
    tail -n 10 /Users/D/TubeDigest/frontend/frontend.log
fi

echo ""
echo "🎉 TubeDigest development environment is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🌐 Backend: http://localhost:3001"
echo "📖 To stop: Run 'pkill -f \"ts-node-dev\"' and 'pkill -f \"vite\"'"
echo "📝 Changes made to fix authentication redirect:"
echo "   - Backend now uses FRONTEND_URL environment variable"
echo "   - Frontend detects OAuth completion and refreshes auth state"
echo "   - Added timing adjustments for cookie synchronization"