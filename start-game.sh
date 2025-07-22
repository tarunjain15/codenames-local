#!/bin/bash

# Codenames Local Game Starter
# This script starts a new game and generates QR codes for easy access

set -e

# Default values
PORT=3000
THEME="family"
QR_CODES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      PORT="$2"
      shift 2
      ;;
    --theme)
      THEME="$2"
      shift 2
      ;;
    --qr-codes)
      QR_CODES=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --port PORT        Server port (default: 3000)"
      echo "  --theme THEME      Game theme (default: 'family')"
      echo "                     Options: family, python-typescript, domain-driven, shell-cli, macbook-workflow"
      echo "  --qr-codes         Generate QR codes for easy access"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if server is already running and kill it
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Found existing server on port $PORT"
    # Get all PIDs of processes using the port (including parent npm process)
    EXISTING_PIDS=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    for PID in $EXISTING_PIDS; do
        echo "🛑 Stopping process (PID: $PID)..."
        kill $PID 2>/dev/null || true
    done
    # Give it a moment to shut down gracefully
    sleep 2
    # Force kill any remaining processes
    for PID in $EXISTING_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "⚠️  Force killing process $PID..."
            kill -9 $PID 2>/dev/null || true
        fi
    done
    echo "✅ Old server stopped"
fi

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

# Start the server in background
echo "🚀 Starting Codenames server on port $PORT..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Failed to start server. Check server.log for details."
    exit 1
fi

# Create a new game
echo "🎮 Creating new game..."
RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/games \
  -H "Content-Type: application/json" \
  -d "{\"themeId\": \"$THEME\"}")

if [ -z "$RESPONSE" ]; then
    echo "❌ Failed to create game. Server might not be ready yet."
    kill $SERVER_PID
    exit 1
fi

# Extract URLs
GAME_ID=$(echo $RESPONSE | grep -o '"gameId":"[^"]*' | cut -d'"' -f4)
BOARD_URL="http://$LOCAL_IP:$PORT/board/$GAME_ID"
RED_URL="http://$LOCAL_IP:$PORT$(echo $RESPONSE | grep -o '"redSpymasterUrl":"[^"]*' | cut -d'"' -f4)"
BLUE_URL="http://$LOCAL_IP:$PORT$(echo $RESPONSE | grep -o '"blueSpymasterUrl":"[^"]*' | cut -d'"' -f4)"

echo ""
echo "✅ Game created successfully!"
echo ""
echo "📺 Board URL (for TV):"
echo "   $BOARD_URL"
echo ""
echo "🩷 Pink Spymaster URL:"
echo "   $RED_URL"
echo ""
echo "🧡 Orange Spymaster URL:"
echo "   $BLUE_URL"
echo ""

# Generate QR codes if requested
if [ "$QR_CODES" = true ]; then
    if command -v qrencode &> /dev/null; then
        echo "📱 QR Codes:"
        echo ""
        echo "Board (TV):"
        qrencode -t ANSIUTF8 -s 1 "$BOARD_URL"
        echo ""
        echo "Pink Spymaster:"
        qrencode -t ANSIUTF8 -s 1 "$RED_URL"
        echo ""
        echo "Orange Spymaster:"
        qrencode -t ANSIUTF8 -s 1 "$BLUE_URL"
    else
        echo "ℹ️  Install qrencode to generate QR codes: brew install qrencode"
    fi
fi

echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Keep script running and handle shutdown
trap "echo '\n⏹️  Stopping server...'; kill $SERVER_PID; exit" INT TERM
wait $SERVER_PID