export type Suit = 'S' | 'H' | 'D' | 'C';

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface User {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

export interface RoomPlayer {
  userId: string;
  username?: string;
  seat: number;
  isReady: boolean;
  isOnline?: boolean;
}

export interface Room {
  id: string;
  roomCode: string;
  hostId: string;
  hostUsername?: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  playerCount?: number;
  players?: RoomPlayer[];
}

export interface PlayedCard {
  userId: string;
  card: string; // e.g. "10H", "AS", "7D"
}

export interface SeatInfo {
  seat: number;
  userId: string;
}

export interface GameStateView {
  phase: 'WAITING' | 'CHOOSING_TRUMP' | 'PLAYING' | 'FINISHED';
  hand: string[];
  currentTurnUserId: string | null;
  trickNumber: number;
  currentTrick: PlayedCard[];
  leadSuit: string | null;
  trumpOpened: boolean;
  trumpSuit: string | null;
  hiddenTrumpCard?: string | null;
  trumpOpenerUserId?: string | null;
  dealerUserId: string | null;
  dealerSeat: number | null;
  raangiSeat: number | null;
  raangiUserId: string | null;
  teamAScore: number;
  teamBScore: number;
  teamATricks: number;
  teamBTricks: number;
  teamAMindis: number;
  teamBMindis: number;
  seats: SeatInfo[];
}

export interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  sender?: User;
}
