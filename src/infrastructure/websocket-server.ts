import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { Game, PublicGameView } from '../domain/types.js';
import { ViewGenerator } from '../domain/view-generator.js';

interface WSMessage {
  type: 'GAME_UPDATE' | 'ERROR';
  payload: any;
}

export class GameWebSocketServer {
  private wss: WebSocketServer;
  private gameConnections: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    this.wss.on('connection', (ws, req) => {
      const gameId = this.extractGameId(req.url || '');
      if (!gameId) {
        ws.close(1002, 'Invalid game ID');
        return;
      }

      // Add connection to game room
      if (!this.gameConnections.has(gameId)) {
        this.gameConnections.set(gameId, new Set());
      }
      this.gameConnections.get(gameId)!.add(ws);

      // Handle disconnection
      ws.on('close', () => {
        const connections = this.gameConnections.get(gameId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            this.gameConnections.delete(gameId);
          }
        }
      });

      // Keep connection alive
      ws.on('pong', () => {
        // Connection is alive
      });
    });

    // Ping all connections every 30 seconds
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000);
  }

  broadcastGameUpdate(game: Game): void {
    const connections = this.gameConnections.get(game.id);
    if (!connections) return;

    const publicView = ViewGenerator.generatePublicView(game);
    const message: WSMessage = {
      type: 'GAME_UPDATE',
      payload: publicView
    };

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private extractGameId(url: string): string | null {
    const match = url.match(/\/ws\/game\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}