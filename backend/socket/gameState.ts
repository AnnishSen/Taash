export interface Player {
    userId: string;
    seat: number;
}

export interface PlayedCard {
    userId: string;
    card: string;
}

export interface GameState {
    deck: string[]; // Remaining cards to be dealt
    physicalDeck: string[]; // 52-card physical deck used in this round
    discardPile: string[]; // Used cards collected in exact chronological order (trick 1 card 1 ... trick 13 card 4)
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

const gameStates = new Map<string, GameState>();

// Persistent physical deck across rounds for each active match/room
const matchDecks = new Map<string, string[]>();

export const getPlayerByUserId = (
    roomId: string,
    userId: string
): Player => {
    const gameState = getGameState(roomId);
    const player = gameState.players.find(
        player => player.userId === userId
    );

    if (!player) {
        throw new Error("Player not found");
    }

    return player;
};

export const createGameState = (
    roomId: string,
    deck: string[],
    dealerUserId: string,
    dealerSeat: number,
    players: Player[],
    roundNumber: number = 1,
) => {
    gameStates.set(roomId, {
        deck: [...deck],
        physicalDeck: [...deck],
        discardPile: [],
        hands: new Map(),
        currentTrick: [],
        currentTurnUserId: null,
        raangiUserId: null,
        hiddenTrumpCard: null,
        trumpSuit: null,
        trumpOpened: false,
        trumpOpenerUserId: null,
        trickNumber: 1,
        dealerUserId,
        dealerSeat,
        players,
        leadSuit: null,
        teamAScore: 0,
        teamBScore: 0,
        teamATricks: 0,
        teamBTricks: 0,
        teamAMindis: 0,
        teamBMindis: 0,
        phase: "CHOOSING_TRUMP",
        roundNumber,
    });
};

export const getGameState = (
    roomId: string
): GameState => {
    const gameState = gameStates.get(roomId);

    if (!gameState) {
        throw new Error("Game state not found");
    }

    return gameState;
};

export const deleteGameState = (
    roomId: string
) => {
    gameStates.delete(roomId);
};

export const hasGameState = (
    roomId: string
) => {
    return gameStates.has(roomId);
};

export const setPlayerHand = (
    roomId: string,
    userId: string,
    hand: string[]
) => {
    const gameState = getGameState(roomId);
    gameState.hands.set(userId, hand);
};

export const getNextSeat = (seat: number): number => {
    return seat === 4 ? 1 : seat + 1;
};

export const getRaangiSeat = (dealerSeat: number): number => {
    return getNextSeat(dealerSeat);
};

// ==========================================
// Persistent Match Deck Management
// ==========================================
export const getMatchDeck = (roomId: string): string[] | undefined => {
    return matchDecks.get(roomId);
};

export const setMatchDeck = (roomId: string, deck: string[]) => {
    matchDecks.set(roomId, [...deck]);
};

export const deleteMatchDeck = (roomId: string) => {
    matchDecks.delete(roomId);
};