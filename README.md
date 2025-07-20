# Codenames Local

A local network implementation of the Codenames board game, designed for in-person play with a shared TV screen and private spymaster views on mobile devices.

## Features

- 🖥️ TV-optimized board view for shared display
- 📱 Private spymaster views on mobile devices
- 🏠 Works entirely on local network (no internet required)
- 🎮 Real-time updates via WebSockets
- 📝 Support for custom word lists
- 🔒 Simple URL-based security for spymaster views

## Quick Start

```bash
# Install dependencies
npm install

# Start the game server
./start-game.sh --words custom-words.txt --port 3000 --qr-codes
```

The script will output:
- Board URL for TV display
- QR codes for spymaster URLs

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

## Custom Word Lists

Place your word lists in `data/words/` as text files with one word per line (minimum 25 words).

## License

MIT