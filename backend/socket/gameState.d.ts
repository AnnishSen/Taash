export interface Player {
    userId: string;
    seat: number;
}
export interface PlayedCard {
    userId: string;
    card: string;
}
export interface GameState {
    deck: string[];
    physicalDeck: string[];
    discardPile: string[];
    hands: Map<string, string[]>;
    currentTrick: PlayedCard[];
    currentTurnUserId: string | null;
    raangiUserId: string | null;
    hiddenTrumpCard: string | null;
    trumpSuit: string | null;
    trumpOpened: boolean;
    trumpOpenerUserId: string | null;
    trickNumber: number;
    dealerUserId: string | null;
    dealerSeat: number;
    leadSuit: string | null;
    players: Player[];
    teamAScore: number;
    teamBScore: number;
    teamATricks: number;
    teamBTricks: number;
    teamAMindis: number;
    teamBMindis: number;
    phase: "CHOOSING_TRUMP" | "PLAYING" | "FINISHED";
    roundNumber: number;
}
export declare const getPlayerByUserId: (roomId: string, userId: string) => Player;
export declare const createGameState: (roomId: string, deck: string[], dealerUserId: string, dealerSeat: number, players: Player[], roundNumber?: number) => void;
export declare const getGameState: (roomId: string) => GameState;
export declare const deleteGameState: (roomId: string) => void;
export declare const hasGameState: (roomId: string) => boolean;
export declare const setPlayerHand: (roomId: string, userId: string, hand: string[]) => void;
export declare const getNextSeat: (seat: number) => number;
export declare const getRaangiSeat: (dealerSeat: number) => number;
export declare const getMatchDeck: (roomId: string) => string[] | undefined;
export declare const setMatchDeck: (roomId: string, deck: string[]) => void;
export declare const deleteMatchDeck: (roomId: string) => void;
//# sourceMappingURL=gameState.d.ts.map