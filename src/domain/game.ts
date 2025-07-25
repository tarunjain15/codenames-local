import { nanoid } from 'nanoid';
import type { Game, TeamColor, CardType, Word, GridPosition } from './types.js';

export class GameEngine {
  private static readonly GRID_SIZE = 5;
  private static readonly TEAM_CARDS = { first: 9, second: 8 };
  private static readonly NEUTRAL_CARDS = 7;
  private static readonly ASSASSIN_CARDS = 1;
  private static recentWords: Set<string> = new Set();
  private static readonly MAX_RECENT_WORDS = 75; // 3 games worth

  static createGame(wordList: string[]): Game {
    // Sanitize word list: trim whitespace and convert to uppercase
    const sanitizedWordList = wordList.map(word => word.trim().toUpperCase());
    
    // Remove duplicates
    const uniqueWords = [...new Set(sanitizedWordList)];
    
    if (uniqueWords.length < 25) {
      throw new Error(`Need at least 25 unique words to create a game. Found only ${uniqueWords.length} unique words.`);
    }

    const gameId = nanoid(10);
    const selectedWords = this.selectRandomWords(uniqueWords, 25);
    const startingTeam = Math.random() < 0.5 ? 'RED' : 'BLUE';
    const cardAssignments = this.generateCardAssignments(startingTeam);
    const words = this.createWordGrid(selectedWords, cardAssignments);

    return {
      id: gameId,
      status: 'WAITING',
      words,
      currentTeam: startingTeam,
      teams: {
        RED: {
          color: 'RED',
          remainingCards: startingTeam === 'RED' ? this.TEAM_CARDS.first : this.TEAM_CARDS.second,
          spymasterKey: nanoid(20)
        },
        BLUE: {
          color: 'BLUE',
          remainingCards: startingTeam === 'BLUE' ? this.TEAM_CARDS.first : this.TEAM_CARDS.second,
          spymasterKey: nanoid(20)
        }
      },
      clueHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static revealWord(game: Game, position: GridPosition): Game {
    const word = game.words[position.row][position.col];
    
    if (word.revealed) {
      throw new Error('Word already revealed');
    }

    word.revealed = true;
    game.updatedAt = new Date();

    // Update team scores
    if (word.belongsTo === 'RED' || word.belongsTo === 'BLUE') {
      game.teams[word.belongsTo].remainingCards--;
      
      // Check for winner
      if (game.teams[word.belongsTo].remainingCards === 0) {
        game.winner = word.belongsTo;
        game.status = 'FINISHED';
        return game;
      }

      // Switch teams if wrong guess
      if (word.belongsTo !== game.currentTeam) {
        game.currentTeam = game.currentTeam === 'RED' ? 'BLUE' : 'RED';
      }
    } else if (word.belongsTo === 'NEUTRAL') {
      // End turn on neutral
      game.currentTeam = game.currentTeam === 'RED' ? 'BLUE' : 'RED';
    } else if (word.belongsTo === 'ASSASSIN') {
      // Instant loss
      game.winner = game.currentTeam === 'RED' ? 'BLUE' : 'RED';
      game.status = 'FINISHED';
    }

    return game;
  }

  private static selectRandomWords(wordList: string[], count: number): string[] {
    // Filter out recently used words
    const availableWords = wordList.filter(word => !this.recentWords.has(word.toUpperCase()));
    
    // If we don't have enough unique words, warn and use some recent ones
    if (availableWords.length < count) {
      console.warn(`Only ${availableWords.length} unique words available. Consider adding more words to your list.`);
      // Clear some old words if needed
      if (availableWords.length < count) {
        this.recentWords.clear();
        return this.selectRandomWords(wordList, count);
      }
    }
    
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    
    // Add selected words to recent history
    selected.forEach(word => {
      this.recentWords.add(word);
      // Keep recent words list from growing too large
      if (this.recentWords.size > this.MAX_RECENT_WORDS) {
        const firstWord = this.recentWords.values().next().value;
        this.recentWords.delete(firstWord);
      }
    });
    
    return selected;
  }

  private static generateCardAssignments(startingTeam: TeamColor): CardType[] {
    const assignments: CardType[] = [];
    
    // Add team cards
    const firstTeamCards = startingTeam === 'RED' ? 'RED' : 'BLUE';
    const secondTeamCards = startingTeam === 'RED' ? 'BLUE' : 'RED';
    
    for (let i = 0; i < this.TEAM_CARDS.first; i++) assignments.push(firstTeamCards as CardType);
    for (let i = 0; i < this.TEAM_CARDS.second; i++) assignments.push(secondTeamCards as CardType);
    for (let i = 0; i < this.NEUTRAL_CARDS; i++) assignments.push('NEUTRAL');
    for (let i = 0; i < this.ASSASSIN_CARDS; i++) assignments.push('ASSASSIN');
    
    // Shuffle
    return assignments.sort(() => Math.random() - 0.5);
  }

  private static createWordGrid(words: string[], assignments: CardType[]): Word[][] {
    const grid: Word[][] = [];
    let wordIndex = 0;

    for (let row = 0; row < this.GRID_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < this.GRID_SIZE; col++) {
        grid[row][col] = {
          text: words[wordIndex],
          position: { row, col },
          revealed: false,
          belongsTo: assignments[wordIndex]
        };
        wordIndex++;
      }
    }

    return grid;
  }
}