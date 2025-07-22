import type { Game } from '../domain/types.js';

// Simple in-memory store for local play
export class GameStore {
  private games: Map<string, Game> = new Map();
  private currentTheme: string = 'default';

  save(game: Game): void {
    this.games.set(game.id, game);
  }

  get(id: string): Game | undefined {
    return this.games.get(id);
  }

  delete(id: string): boolean {
    return this.games.delete(id);
  }

  setCurrentTheme(theme: string): void {
    this.currentTheme = theme;
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  // Clean up old games (older than 24 hours)
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [id, game] of this.games.entries()) {
      if (game.updatedAt < oneDayAgo) {
        this.games.delete(id);
      }
    }
  }

  getAllActive(): Game[] {
    return Array.from(this.games.values())
      .filter(game => game.status !== 'FINISHED')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}