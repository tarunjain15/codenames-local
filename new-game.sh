#!/bin/bash

# Codenames New Game Creator
# Creates a new game without restarting the server

set -e

# Default values
PORT=3000
THEME="family"
SERVER="localhost"

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
    --server)
      SERVER="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --port PORT        Server port (default: 3000)"
      echo "  --theme THEME      Game theme (default: 'python-typescript')"
      echo "  --server HOST      Server host (default: localhost)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get local IP for display
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
else
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

# Create a new game
echo "🎮 Creating new game..."
RESPONSE=$(curl -s -X POST http://$SERVER:$PORT/api/games \
  -H "Content-Type: application/json" \
  -d "{\"themeId\": \"$THEME\"}")

if [ -z "$RESPONSE" ]; then
    echo "❌ Failed to create game. Is the server running?"
    echo "   Start it with: ./start-game.sh"
    exit 1
fi

# Check for error in response
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error creating game:"
    echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Extract game info
GAME_ID=$(echo $RESPONSE | grep -o '"gameId":"[^"]*' | cut -d'"' -f4)
STARTING_TEAM=$(echo $RESPONSE | grep -o '"startingTeam":"[^"]*' | cut -d'"' -f4)

# Build full URLs
BOARD_URL="http://$LOCAL_IP:$PORT/board/$GAME_ID"
RED_KEY=$(echo $RESPONSE | grep -o '"redSpymasterUrl":"[^"]*' | cut -d'/' -f6)
BLUE_KEY=$(echo $RESPONSE | grep -o '"blueSpymasterUrl":"[^"]*' | cut -d'/' -f6)
RED_URL="http://$LOCAL_IP:$PORT/spymaster/$GAME_ID/RED/$RED_KEY"
BLUE_URL="http://$LOCAL_IP:$PORT/spymaster/$GAME_ID/BLUE/$BLUE_KEY"

echo ""
echo "✅ New game created successfully!"
echo ""
echo "🎯 Game ID: $GAME_ID"
echo "🏁 Starting Team: $STARTING_TEAM"
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

# Optionally open in browser
if command -v open &> /dev/null; then
    echo "💡 Tip: Open board in browser with:"
    echo "   open \"$BOARD_URL\""
fi
