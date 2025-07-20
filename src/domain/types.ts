// Core domain types - the heart of our game logic

export type TeamColor = 'RED' | 'BLUE';
export type CardType = TeamColor | 'NEUTRAL' | 'ASSASSIN';
export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';

export interface GridPosition {
  row: number;
  col: number;
}

export interface Word {
  text: string;
  position: GridPosition;
  revealed: boolean;
  belongsTo: CardType;
}

export interface Team {
  color: TeamColor;
  remainingCards: number;
  spymasterKey?: string; // Only populated for spymaster views
}

export interface Clue {
  word: string;
  count: number;
  team: TeamColor;
  timestamp: Date;
}

export interface Game {
  id: string;
  status: GameStatus;
  words: Word[][];
  currentTeam: TeamColor;
  teams: {
    RED: Team;
    BLUE: Team;
  };
  clueHistory: Clue[];
  winner?: TeamColor;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicGameView {
  id: string;
  status: GameStatus;
  words: Omit<Word, 'belongsTo'>[][]; // Hide belongsTo until revealed
  currentTeam: TeamColor;
  score: {
    RED: number;
    BLUE: number;
  };
  lastClue?: Clue;
  winner?: TeamColor;
}

export interface SpymasterGameView extends PublicGameView {
  words: Word[][]; // Full word info including belongsTo
  teamColor: TeamColor;
}