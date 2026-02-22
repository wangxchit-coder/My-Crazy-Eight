export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
  isWild?: boolean;
}

export type GameStatus = 'waiting_to_start' | 'dealing' | 'player_turn' | 'ai_turn' | 'suit_selection' | 'game_over';

export interface GameState {
  deck: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  discardPile: CardData[];
  currentSuit: Suit;
  currentRank: Rank | null;
  status: GameStatus;
  winner: 'player' | 'ai' | null;
  message: string;
}
