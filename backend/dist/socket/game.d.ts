import { WebSocket } from "ws";
interface PlaycardMessage {
    type: "play_card";
    card: string;
    traatVolume?: number;
}
interface ChooseTrumpMessage {
    type: "choose_trump";
    card: string;
}
export interface PlayedCard {
    userid: string;
    card: string;
}
/**
 * Deal cards for Round 1 of a new match.
 * Uses fresh deck on very first round, shuffles like a real person, cuts deck, and deals.
 */
export declare const dealCards: (roomId: string) => Promise<void>;
export declare const chooseTrump: (ws: WebSocket, data: ChooseTrumpMessage) => Promise<void>;
export declare const decideTrump: (roomId: string) => Promise<void>;
export declare const playCard: (ws: WebSocket, data: PlaycardMessage) => Promise<void>;
export declare const nextTurn: (roomId: string, lastPlayedUserId: string) => Promise<void>;
export declare const finishTrick: (roomId: string) => Promise<void>;
export declare const calculateTrickWinner: (roomId: string) => Promise<string>;
export declare const updateScore: (roomId: string, winnerSeat: number) => Promise<void>;
export declare const endGame: (roomId: string) => Promise<void>;
export declare const openTrump: (ws: WebSocket) => Promise<void>;
export declare const returnToLobby: (ws: WebSocket, data: {
    roomCode: string;
}) => Promise<void>;
/**
 * Starts next round of the match reusing the physical deck from previous round.
 */
export declare const startNextRound: (ws: WebSocket, data: {
    roomCode: string;
}) => Promise<void>;
export {};
//# sourceMappingURL=game.d.ts.map