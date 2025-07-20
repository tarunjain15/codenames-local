import { Router } from 'express';
import type { Request, Response } from 'express';
import { GameEngine } from '../domain/game.js';
import { ViewGenerator } from '../domain/view-generator.js';
import { GameStore } from '../infrastructure/game-store.js';
import { GameWebSocketServer } from '../infrastructure/websocket-server.js';
import { loadWordList } from '../utils/word-loader.js';
import type { TeamColor, GridPosition } from '../domain/types.js';

export function createGameRoutes(gameStore: GameStore, wsServer: GameWebSocketServer): Router {
  const router = Router();

  // Create new game
  router.post('/games', async (req: Request, res: Response) => {
    try {
      const { wordListName = 'default', customWords } = req.body;
      
      let words: string[];
      if (customWords && Array.isArray(customWords)) {
        words = customWords;
      } else {
        words = await loadWordList(wordListName);
      }

      const game = GameEngine.createGame(words);
      gameStore.save(game);

      res.json({
        gameId: game.id,
        boardUrl: `/board/${game.id}`,
        redSpymasterUrl: `/spymaster/${game.id}/RED/${game.teams.RED.spymasterKey}`,
        blueSpymasterUrl: `/spymaster/${game.id}/BLUE/${game.teams.BLUE.spymasterKey}`,
        startingTeam: game.currentTeam
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Get public game view
  router.get('/games/:id/public', (req: Request, res: Response) => {
    const game = gameStore.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const publicView = ViewGenerator.generatePublicView(game);
    res.json(publicView);
  });

  // Get spymaster view
  router.get('/games/:id/spymaster/:team/:key', (req: Request, res: Response) => {
    const { id, team, key } = req.params;
    const game = gameStore.get(id);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const teamColor = team as TeamColor;
    if (!ViewGenerator.validateSpymasterAccess(game, teamColor, key)) {
      return res.status(403).json({ error: 'Invalid spymaster key' });
    }

    const spymasterView = ViewGenerator.generateSpymasterView(game, teamColor);
    res.json(spymasterView);
  });

  // Reveal a word
  router.post('/games/:id/reveal', (req: Request, res: Response) => {
    const game = gameStore.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const position: GridPosition = req.body;
    try {
      GameEngine.revealWord(game, position);
      gameStore.save(game);
      wsServer.broadcastGameUpdate(game);
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Add a clue
  router.post('/games/:id/clue', (req: Request, res: Response) => {
    const game = gameStore.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const { word, count, team } = req.body;
    game.clueHistory.push({
      word,
      count,
      team,
      timestamp: new Date()
    });
    
    game.updatedAt = new Date();
    gameStore.save(game);
    wsServer.broadcastGameUpdate(game);
    
    res.json({ success: true });
  });

  return router;
}