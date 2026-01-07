export interface Item {
  id: string;
  name: string;
  image: string; // URL or Base64
  hint: string;
}

export interface Collection {
  id: string;
  name: string;
  items: Item[];
}

export interface Settings {
  delayFlash: number; // Seconds until target flashes
  delayHint: number; // Seconds until audio hint
  delayGuide: number; // Seconds until gesture guide
  impulseTime: number; // Seconds for impulse control lock
  showDistractors: boolean; // Whether to show extra characters
  displayMode: 'single' | 'multi'; // Single question or Grid view
}

export const DEFAULT_SETTINGS: Settings = {
  delayFlash: 5,
  delayHint: 10,
  delayGuide: 15,
  impulseTime: 1.5,
  showDistractors: false,
  displayMode: 'single',
};

// Character card used in the game
export interface GameChar {
  id: string;
  char: string;
  belongsToItemId: string; // The item ID this character completes
  targetIndex: number; // The index position in the name string (e.g., 0 for first char)
  isDistractor: boolean;
}

export enum ScaffoldingLevel {
  NONE = 0,
  VISUAL = 1,
  AUDIO = 2,
  GUIDE = 3,
}