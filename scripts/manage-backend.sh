#!/bin/bash

# TubeDigest Backend Process Management Script
# Handles backend startup, shutdown, and monitoring

set -e

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$BACKEND_DIR/logs/backend.log"
PID_FILE="$BACKEND_DIR/backend.pid"
PORT=${PORT:-3001}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure logs directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if backend is running
is_backend_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            # PID file exists but process is dead
            rm -f "$PID_FILE"
        fi
    fi
    return 1
}

# Function to check if port is in use
is_port_in_use() {
    lsof -i :$PORT >/dev/null 2>&1
}

# Function to kill processes on the port
kill_port_processes() {
    print_warning "Killing processes on port $PORT..."
    pkill -f "ts-node-dev" || true
    pkill -f "node.*$PORT" || true
    sleep 2
}

# Function to start backend
start_backend() {
    print_status "Starting TubeDigest backend..."
    
    if is_backend_running; then
        print_warning "Backend is already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    if is_port_in_use; then
        print_warning "Port $PORT is in use. Attempting to kill existing processes..."
        kill_port_processes
    fi
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Set environment variables
    export PORT=$PORT
    export NODE_ENV=${NODE_ENV:-development}
    
    print_status "Starting backend on port $PORT..."
    print_status "Log file: $LOG_FILE"
    
    # Start backend in background
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$PID_FILE"
    
    # Wait a moment for startup
    sleep 3
    
    # Check if process is still running
    if kill -0 $pid 2>/dev/null; then
        print_success "Backend started successfully (PID: $pid)"
        print_status "Check logs: tail -f $LOG_FILE"
        return 0
    else
        print_error "Backend failed to start"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Function to stop backend
stop_backend() {
    print_status "Stopping TubeDigest backend..."
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Sending SIGTERM to PID $pid..."
            kill "$pid"
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing PID $pid..."
                kill -9 "$pid"
            fi
            
            rm -f "$PID_FILE"
            print_success "Backend stopped"
        else
            print_warning "Backend process not running (PID: $pid)"
            rm -f "$PID_FILE"
        fi
    else
        print_warning "No PID file found"
        # Try to kill any processes on the port
        if is_port_in_use; then
            kill_port_processes
        fi
    fi
}

# Function to restart backend
restart_backend() {
    print_status "Restarting TubeDigest backend..."
    stop_backend
    sleep 2
    start_backend
}

# Function to show status
show_status() {
    print_status "TubeDigest Backend Status"
    echo "================================"
    
    if is_backend_running; then
        local pid=$(cat "$PID_FILE")
        print_success "Backend is running (PID: $pid)"
        
        # Check port
        if is_port_in_use; then
            print_success "Port $PORT is active"
        else
            print_warning "Port $PORT is not responding"
        fi
        
        # Show recent logs
        echo ""
        print_status "Recent logs (last 10 lines):"
        if [ -f "$LOG_FILE" ]; then
            tail -n 10 "$LOG_FILE"
        else
            print_warning "No log file found"
        fi
    else
        print_error "Backend is not running"
        
        # Check if port is in use by other process
        if is_port_in_use; then
            print_warning "Port $PORT is in use by another process"
            lsof -i :$PORT
        fi
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Showing backend logs (Ctrl+C to exit):"
        tail -f "$LOG_FILE"
    else
        print_error "No log file found: $LOG_FILE"
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    rm -f "$PID_FILE"
    print_success "Cleanup complete"
}

# Main script logic
case "${1:-status}" in
    start)
        start_backend
        ;;
    stop)
        stop_backend
        ;;
    restart)
        restart_backend
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the backend"
        echo "  stop    - Stop the backend"
        echo "  restart - Restart the backend"
        echo "  status  - Show backend status (default)"
        echo "  logs    - Show live logs"
        echo "  cleanup - Clean up PID file"
        echo ""
        echo "Environment variables:"
        echo "  PORT     - Backend port (default: 3001)"
        echo "  NODE_ENV - Node environment (default: development)"
        exit 1
        ;;
esac
