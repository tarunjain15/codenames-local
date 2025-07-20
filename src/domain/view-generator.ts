import type { Game, PublicGameView, SpymasterGameView, TeamColor, Word } from './types.js';

export class ViewGenerator {
  static generatePublicView(game: Game): PublicGameView {
    // Create a deep copy of words but hide belongsTo for unrevealed words
    const publicWords = game.words.map(row => 
      row.map(word => {
        if (word.revealed) {
          return word;
        }
        // Omit belongsTo for unrevealed words
        const { belongsTo, ...publicWord } = word;
        return publicWord as Omit<Word, 'belongsTo'>;
      })
    );

    return {
      id: game.id,
      status: game.status,
      words: publicWords,
      currentTeam: game.currentTeam,
      score: {
        RED: 9 - game.teams.RED.remainingCards,
        BLUE: 8 - game.teams.BLUE.remainingCards
      },
      lastClue: game.clueHistory[game.clueHistory.length - 1],
      winner: game.winner
    };
  }

  static generateSpymasterView(game: Game, teamColor: TeamColor): SpymasterGameView {
    const publicView = this.generatePublicView(game);
    
    return {
      ...publicView,
      words: game.words, // Full word data including belongsTo
      teamColor
    };
  }

  static validateSpymasterAccess(game: Game, teamColor: TeamColor, key: string): boolean {
    return game.teams[teamColor].spymasterKey === key;
  }
}