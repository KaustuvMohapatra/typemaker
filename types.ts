export interface TestStats {
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  errors: number;
  time: number;
  characters: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
  history: { wpm: number; raw: number; second: number }[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  date: string;
}

export enum GameState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED'
}

export enum GameMode {
  CASUAL = 'casual',
  COMPETITION = 'competition'
}

export type TimeOption = 15 | 30 | 60 | 120;

export interface Theme {
  name: string;
  colors: {
    bg: string;
    main: string;
    sub: string;
    text: string;
    error: string;
  }
}
