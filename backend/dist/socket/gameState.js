const gameStates = new Map();
// Persistent physical deck across rounds for each active match/room
const matchDecks = new Map();
export const getPlayerByUserId = (roomId, userId) => {
    const gameState = getGameState(roomId);
    const player = gameState.players.find(player => player.userId === userId);
    if (!player) {
        throw new Error("Player not found");
    }
    return player;
};
export const createGameState = (roomId, deck, dealerUserId, dealerSeat, players, roundNumber = 1) => {
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
export const getGameState = (roomId) => {
    const gameState = gameStates.get(roomId);
    if (!gameState) {
        throw new Error("Game state not found");
    }
    return gameState;
};
export const deleteGameState = (roomId) => {
    gameStates.delete(roomId);
};
export const hasGameState = (roomId) => {
    return gameStates.has(roomId);
};
export const setPlayerHand = (roomId, userId, hand) => {
    const gameState = getGameState(roomId);
    gameState.hands.set(userId, hand);
};
export const getNextSeat = (seat) => {
    return seat === 4 ? 1 : seat + 1;
};
export const getRaangiSeat = (dealerSeat) => {
    return getNextSeat(dealerSeat);
};
// ==========================================
// Persistent Match Deck Management
// ==========================================
export const getMatchDeck = (roomId) => {
    return matchDecks.get(roomId);
};
export const setMatchDeck = (roomId, deck) => {
    matchDecks.set(roomId, [...deck]);
};
export const deleteMatchDeck = (roomId) => {
    matchDecks.delete(roomId);
};
//# sourceMappingURL=gameState.js.map