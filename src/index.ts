import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GameStore } from './infrastructure/game-store.js';
import { GameWebSocketServer } from './infrastructure/websocket-server.js';
import { createGameRoutes } from './api/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Initialize infrastructure
const gameStore = new GameStore();
const server = createServer(app);
const wsServer = new GameWebSocketServer(server);

// API routes
app.use('/api', createGameRoutes(gameStore, wsServer));

// Serve game views
app.get('/board/:gameId', (req, res) => {
  res.sendFile(join(__dirname, '../public/board.html'));
});

app.get('/spymaster/:gameId/:team/:key', (req, res) => {
  res.sendFile(join(__dirname, '../public/spymaster.html'));
});

app.get('/add-theme', (req, res) => {
  res.sendFile(join(__dirname, '../public/add-theme.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(port, () => {
  console.log(`\n🎮 Codenames Local Server Started!`);
  console.log(`\n📡 Server running at http://localhost:${port}`);
  console.log(`\n📝 To create a new game, POST to http://localhost:${port}/api/games`);
  console.log(`\n💡 Tip: Use the start-game.sh script for easy setup with QR codes\n`);
});

// Cleanup old games every hour
setInterval(() => {
  gameStore.cleanup();
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});