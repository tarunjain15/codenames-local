import { Router } from 'express';
import type { Request, Response } from 'express';
import { GameEngine } from '../domain/game.js';
import { ViewGenerator } from '../domain/view-generator.js';
import { GameStore } from '../infrastructure/game-store.js';
import { GameWebSocketServer } from '../infrastructure/websocket-server.js';
import { loadWordList } from '../utils/word-loader.js';
import type { TeamColor, GridPosition } from '../domain/types.js';
import { getTheme, THEMES } from '../domain/themes.js';
import { ClaudeWordGenerator, StaticWordGenerator } from '../services/word-generator.js';
import QRCode from 'qrcode';

export function createGameRoutes(gameStore: GameStore, wsServer: GameWebSocketServer): Router {
  const router = Router();
  const wordGenerator = process.env.ANTHROPIC_API_KEY 
    ? new ClaudeWordGenerator() 
    : new StaticWordGenerator();

  // Create new game
  router.post('/games', async (req: Request, res: Response) => {
    try {
      const { wordListName, customWords, themeId } = req.body;
      
      let words: string[];
      
      // Priority: themeId > customWords > wordListName
      if (themeId) {
        const theme = getTheme(themeId);
        if (!theme) {
          return res.status(400).json({ error: `Invalid theme: ${themeId}` });
        }
        
        // Get existing words to avoid repetition
        const recentGames = gameStore.getAllActive().slice(0, 3);
        const existingWords = recentGames.flatMap(game => 
          game.words.flatMap(row => row.map(word => word.text))
        );
        
        // Generate words using AI or static generator
        words = await wordGenerator.generateWords(theme, existingWords, 25);
        
        // If we didn't get enough words, fall back to base words
        if (words.length < 25 && theme.baseWords) {
          const needed = 25 - words.length;
          const available = theme.baseWords.filter(w => !words.includes(w));
          words = [...words, ...available.slice(0, needed)];
        }
        
        if (words.length < 25) {
          return res.status(500).json({ 
            error: 'Failed to generate enough words for this theme' 
          });
        }
      } else if (customWords && Array.isArray(customWords)) {
        words = customWords;
      } else {
        words = await loadWordList(wordListName || 'default');
      }

      const game = GameEngine.createGame(words);
      gameStore.save(game);

      res.json({
        gameId: game.id,
        boardUrl: `/board/${game.id}`,
        redSpymasterUrl: `/spymaster/${game.id}/RED/${game.teams.RED.spymasterKey}`,
        blueSpymasterUrl: `/spymaster/${game.id}/BLUE/${game.teams.BLUE.spymasterKey}`,
        startingTeam: game.currentTeam,
        theme: themeId ? getTheme(themeId)?.name : undefined
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Get available themes
  router.get('/themes', (req: Request, res: Response) => {
    res.json(THEMES.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description
    })));
  });

  // Get game info (including spymaster URLs if you have the game ID)
  router.get('/games/:id/info', (req: Request, res: Response) => {
    const game = gameStore.get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      gameId: game.id,
      boardUrl: `/board/${game.id}`,
      redSpymasterUrl: `/spymaster/${game.id}/RED/${game.teams.RED.spymasterKey}`,
      blueSpymasterUrl: `/spymaster/${game.id}/BLUE/${game.teams.BLUE.spymasterKey}`,
      startingTeam: game.currentTeam,
      status: game.status,
      winner: game.winner
    });
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

  // Add new theme
  router.post('/themes', (req: Request, res: Response) => {
    try {
      const { id, name, description, aiPrompt, baseWords } = req.body;
      
      // Validate required fields
      if (!id || !name || !description || !aiPrompt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if theme already exists
      if (getTheme(id)) {
        return res.status(400).json({ error: 'Theme with this ID already exists' });
      }
      
      // For now, we'll just return success
      // In a real app, you'd save this to a database or file
      res.json({ 
        success: true, 
        message: 'Theme would be added in a production system',
        theme: { id, name, description }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add theme' });
    }
  });

  // Generate QR code for a URL
  router.get('/qrcode', async (req: Request, res: Response) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({ qrCode: qrCodeDataUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  return router;
}