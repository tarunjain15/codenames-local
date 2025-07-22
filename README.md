# Codenames Local

A local network implementation of the Codenames board game, designed for in-person play with a shared TV screen and private spymaster views on mobile devices.

## Features

- 🖥️ TV-optimized board view for shared display
- 📱 Private spymaster views on mobile devices
- 🏠 Works entirely on local network (no internet required)
- 🎮 Real-time updates via WebSockets
- 🎨 AI-powered theme-based word generation
- 🔒 Simple URL-based security for spymaster views
- 🔄 Session persistence for theme selection
- 🚫 Prevents word repetition across games
- 🩷 Pink and Orange teams (instead of Red/Blue)
- ➕ Custom theme creation interface

## Quick Start

```bash
# Install dependencies
npm install

# Set up AI word generation (optional but recommended)
cp .env.example .env
# Edit .env and add your Anthropic API key

# Start the game server with a theme
./start-game.sh --theme family --qr-codes
```

The script will:
- Automatically stop any existing server on port 3000
- Start a fresh server
- Create a new game with your selected theme
- Display URLs for board and spymaster views
- Generate QR codes (if qrencode is installed)

## Available Themes

1. **family** (default) - North Indian Jain Family
   - Vegetarian food, Bollywood, festivals, family culture
   - Mix of Hindi and English words suitable for all ages

2. **python-typescript** - Python & TypeScript programming
   - Language features, frameworks, development tools

3. **domain-driven** - Domain-Driven Design
   - Architecture patterns, DDD concepts, system design

4. **shell-cli** - Shell Scripts & CLI tools
   - Terminal commands, shell concepts, Unix tools

5. **macbook-workflow** - MacBook Power User
   - macOS features, productivity apps, Apple ecosystem

## AI-Powered Word Generation

With an Anthropic API key, the game:
- Generates fresh, theme-appropriate words for each game
- Ensures words work well for Codenames (multiple associations)
- Prevents repetition across recent games
- Falls back to predefined words if AI is unavailable

The system automatically adds Codenames-specific requirements to all themes, ensuring generated words have multiple meanings and enable creative clue-giving.

## Custom Themes

### Via Web Interface
Navigate to `http://192.168.1.46:3000/add-theme` to create custom themes with:
- Theme name and description
- AI prompt for word generation
- Optional base words as fallback

### Theme Creation Tips
- Focus on words with multiple associations
- Include mix of concrete and abstract concepts
- Ensure words are familiar to your target audience
- Avoid overly similar words in the same theme

## Architecture

- **Domain-First Design**: Core game logic separated from infrastructure
- **Two-View System**: Public board view + private spymaster views
- **Real-time Sync**: WebSocket-based state updates
- **No Database**: In-memory state for local play
- **TypeScript**: Full type safety across the stack

## Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Game Rules Modifications

- **Teams**: Pink and Orange (instead of Red and Blue)
- **Scoring**: Shows remaining cards to find (not cards found)
- **Turns**: Players manage turns themselves (no strict enforcement)
- **Confirmation**: Click confirmation prevents accidental reveals
- **New Game**: Easy new game creation without server restart

## Scripts

### start-game.sh
```bash
./start-game.sh [options]
  --theme THEME      Game theme (default: 'family')
  --port PORT        Server port (default: 3000)
  --qr-codes         Generate QR codes for easy access
```

### new-game.sh
```bash
./new-game.sh [options]
  --theme THEME      Game theme (default: 'family')
  --port PORT        Server port (default: 3000)
  --server HOST      Server host (default: localhost)
```

## Environment Variables

```bash
# Required for AI word generation
ANTHROPIC_API_KEY=your-api-key-here

# Optional
PORT=3000
```

## Tips for Best Experience

1. **TV Setup**: Cast or connect the board URL to your TV
2. **Spymasters**: Each spymaster opens their private URL on their phone
3. **Theme Selection**: Choose themes appropriate for your group
4. **Custom Themes**: Create themes specific to your interests/culture
5. **QR Codes**: Install `qrencode` for easy URL sharing
   ```bash
   brew install qrencode  # macOS
   ```

## License

MIT