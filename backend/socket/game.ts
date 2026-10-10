import { WebSocket } from "ws";
import prisma from "../lib/prisma.js";
import {
    createGameState,
    getGameState,
    setPlayerHand,
    getRaangiSeat,
    getNextSeat,
    deleteGameState,
    hasGameState,
    getMatchDeck,
    setMatchDeck,
    deleteMatchDeck,
} from "./gameState.js";
import {
    createFreshDeck,
    humanShuffle,
    cutDeck,
    validateDeck,
} from "./deck.js";
import { getSocket, getSocketUser, sendToPlayer, broadcastToRoom } from "./socketManager.js";
import type { Player } from "./gameState.js";

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
 * Deal packet of cards from the top of the physical cut deck according to Mindi Coat rules.
 * Cards are dealt clockwise starting from the player to the left of the dealer (Raangi).
 */
const dealPacket = (
    roomId: string,
    players: Player[],
    cardsPerPlayer: number
) => {
    const gameState = getGameState(roomId);

    // Dealing begins with the player to the left of the dealer (Raangi)
    const startSeat = getRaangiSeat(gameState.dealerSeat);

    const dealOrder: Player[] = [];
    for (let i = 0; i < 4; i++) {
        const seat = ((startSeat + i - 1) % 4) + 1;
        const player = players.find((p) => p.seat === seat);
        if (!player) {
            throw new Error("Player not found for seat " + seat);
        }
        dealOrder.push(player);
    }

    // Deal cards from top of physical cut deck
    for (const player of dealOrder) {
        const hand = gameState.hands.get(player.userId)!;
        for (let i = 0; i < cardsPerPlayer; i++) {
            const card = gameState.deck.shift();
            if (!card) {
                throw new Error("Physical deck is empty during deal");
            }
            hand.push(card);
        }
    }
};

/**
 * Deal cards for Round 1 of a new match.
 * Uses fresh deck on very first round, shuffles like a real person, cuts deck, and deals.
 */
export const dealCards = async (roomId: string) => {
    console.log("dealCards called for room:", roomId);

    if (hasGameState(roomId)) {
        throw new Error("Game is already in progress");
    }

    const roomPlayers = await prisma.roomPlayer.findMany({
        where: { roomId },
        orderBy: { seat: "asc" },
    });

    if (roomPlayers.length !== 4) {
        throw new Error("Exactly 4 players are required");
    }

    const players: Player[] = roomPlayers.map((player) => ({
        userId: player.userId,
        seat: player.seat,
    }));

    // 1. Physical Deck handling:
    // Only create a fresh deck if no match deck exists (brand new match)
    let physicalDeck = getMatchDeck(roomId);
    if (!physicalDeck || !validateDeck(physicalDeck)) {
        physicalDeck = createFreshDeck();
    }

    // 2. Realistic human multi-pass shuffle (Riffle, Overhand, Strip/Chunk transposition)
    const shuffledDeck = humanShuffle(physicalDeck);

    // 3. Simulated Table Cut by another player (20% - 80%)
    const cutDeckResult = cutDeck(shuffledDeck);

    // Initial dealer for round 1
    const dealer = players[0]!;
    const dealerUserId = dealer.userId;
    const dealerSeat = dealer.seat;

    createGameState(
        roomId,
        cutDeckResult,
        dealerUserId,
        dealerSeat,
        players,
        1 // round 1
    );

    for (const player of players) {
        setPlayerHand(roomId, player.userId, []);
    }

    // Deal first packet: 5 cards to each player starting clockwise from Raangi
    dealPacket(roomId, players, 5);

    const gameState = getGameState(roomId);
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");

    const raangiSeat = getRaangiSeat(dealerSeat);
    const raangi = players.find((p) => p.seat === raangiSeat);
    if (raangi) {
        gameState.raangiUserId = raangi.userId;
    }

    // Broadcast game_started with full seat map, dealer, and raangi info
    broadcastToRoom(room.roomCode, {
        type: "game_started",
        seats: players.map((p) => ({ seat: p.seat, userId: p.userId })),
        dealerUserId,
        dealerSeat,
        raangiSeat,
        raangiUserId: raangi ? raangi.userId : null,
        roundNumber: 1,
    });

    // Send initial 5 cards to each player
    for (const player of players) {
        sendToPlayer(player.userId, {
            type: "cards_dealt",
            hand: gameState.hands.get(player.userId),
        });
    }

    // Prompt raangi to choose & hide trump
    await decideTrump(roomId);
};

export const chooseTrump = async (
    ws: WebSocket,
    data: ChooseTrumpMessage
) => {
    const userId = getSocketUser(ws);

    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }
    const roomPlayer = await prisma.roomPlayer.findFirst({
        where: { userId },
    });

    if (!roomPlayer) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You are not in any room",
        }));
        return;
    }

    const gameState = getGameState(roomPlayer.roomId);

    // Guard: trump already chosen
    if (gameState.hiddenTrumpCard) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Trump has already been chosen",
        }));
        return;
    }

    if (gameState.raangiUserId !== userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Only raangi can choose trump",
        }));
        return;
    }
    const hand = gameState.hands.get(userId);

    if (!hand) {
        throw new Error("Hand not found");
    }
    if (!hand.includes(data.card)) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Card not found in your hand",
        }));
        return;
    }

    gameState.hiddenTrumpCard = data.card;
    gameState.trumpSuit = data.card.slice(-1);
    gameState.trumpOpened = false;

    // Remove the hidden trump card from Raangi's hand
    const chosenCardIndex = hand.indexOf(data.card);
    if (chosenCardIndex !== -1) {
        hand.splice(chosenCardIndex, 1);
    }

    // Deal Packet 2: 4 cards to each player clockwise starting from Raangi
    dealPacket(
        roomPlayer.roomId,
        gameState.players,
        4
    );

    // Deal Packet 3: 4 cards to each player clockwise starting from Raangi
    dealPacket(
        roomPlayer.roomId,
        gameState.players,
        4
    );

    for (const player of gameState.players) {
        sendToPlayer(player.userId, {
            type: "cards_dealt",
            hand: gameState.hands.get(player.userId),
        });
    }

    const firstSeat = getRaangiSeat(gameState.dealerSeat);
    const firstPlayer = gameState.players.find(
        (player) => player.seat === firstSeat
    );

    if (!firstPlayer) {
        throw new Error("First player not found");
    }

    gameState.currentTurnUserId = firstPlayer.userId;
    gameState.phase = "PLAYING";

    const room = await prisma.room.findUnique({ where: { id: roomPlayer.roomId } });
    if (!room) throw new Error("Room not found");

    broadcastToRoom(room.roomCode, {
        type: "trump_chosen",
        raangiUserId: userId,
        message: "Trump has been chosen and hidden by Raangi",
    });

    broadcastToRoom(room.roomCode, {
        type: "turn_changed",
        currentTurnUserId: firstPlayer.userId,
        leadSuit: null,
        currentTrick: [],
        trickNumber: 1,
    });
};

export const decideTrump = async (roomId: string) => {
    const gameState = getGameState(roomId);
    const raangiSeat = getRaangiSeat(gameState.dealerSeat);

    const raangi = gameState.players.find(
        (player) => player.seat === raangiSeat
    );

    if (!raangi) {
        throw new Error("Raangi not found");
    }

    gameState.raangiUserId = raangi.userId;
    const socket = getSocket(raangi.userId);
    if (!socket) {
        throw new Error("Raangi is offline");
    }

    socket.send(JSON.stringify({
        type: "choose_trump_request",
        hand: gameState.hands.get(raangi.userId),
        message: "Choose one card as trump",
    }));
};

export const playCard = async (
    ws: WebSocket,
    data: PlaycardMessage
) => {
    const userId = getSocketUser(ws);

    if (!userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }

    const roomPlayer = await prisma.roomPlayer.findFirst({
        where: { userId },
    });

    if (!roomPlayer) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You are not in any room",
        }));
        return;
    }

    const gameState = getGameState(roomPlayer.roomId);

    if (gameState.currentTurnUserId !== userId) {
        ws.send(JSON.stringify({
            type: "error",
            message: "It is not your turn",
        }));
        return;
    }

    const hand = gameState.hands.get(userId);

    if (!hand) {
        throw new Error("Hand not found");
    }

    if (!hand.includes(data.card)) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Card not found in your hand",
        }));
        return;
    }

    // Suit-following enforcement
    if (gameState.currentTrick.length > 0 && gameState.leadSuit) {
        const cardSuit = data.card.slice(-1);
        const hasLeadSuit = hand.some((c) => c.slice(-1) === gameState.leadSuit);
        if (hasLeadSuit && cardSuit !== gameState.leadSuit) {
            ws.send(JSON.stringify({
                type: "error",
                message: "You must follow the lead suit",
            }));
            return;
        }

        // Trump opener rule: If this player asked for / opened trump on this turn,
        // they MUST play a card of the trump suit if they have any in hand!
        if (gameState.trumpOpenerUserId === userId && gameState.trumpSuit) {
            const hasTrumpSuit = hand.some((c) => c.slice(-1) === gameState.trumpSuit);
            if (hasTrumpSuit && cardSuit !== gameState.trumpSuit) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "You asked for trump and must play the trump suit",
                }));
                return;
            }
        }
    }

    const cardIndex = hand.indexOf(data.card);
    hand.splice(cardIndex, 1);

    if (gameState.trumpOpenerUserId === userId) {
        gameState.trumpOpenerUserId = null;
    }

    if (gameState.currentTrick.length === 0) {
        gameState.leadSuit = data.card.slice(-1);
    }

    gameState.currentTrick.push({
        userId,
        card: data.card,
    });

    // Exact chronological discard pile: record every single card played in round order
    gameState.discardPile.push(data.card);

    const room = await prisma.room.findUnique({
        where: { id: roomPlayer.roomId },
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const traatVolume = typeof data.traatVolume === "number" ? Math.max(0, Math.min(100, data.traatVolume)) : 50;

    broadcastToRoom(room.roomCode, {
        type: "card_played",
        userId,
        card: data.card,
        traatVolume,
        leadSuit: gameState.leadSuit,
        currentTrick: gameState.currentTrick,
        trickNumber: gameState.trickNumber,
    });

    if (gameState.currentTrick.length === 4) {
        await finishTrick(roomPlayer.roomId);
    } else {
        await nextTurn(roomPlayer.roomId, userId);
    }
};

export const nextTurn = async (
    roomId: string,
    lastPlayedUserId: string
) => {
    const gameState = getGameState(roomId);

    const currentPlayer = gameState.players.find(
        (player) => player.userId === lastPlayedUserId
    );

    if (!currentPlayer) {
        throw new Error("Player not found");
    }

    const nextSeat =
        currentPlayer.seat === 4
            ? 1
            : currentPlayer.seat + 1;

    const nextPlayer = gameState.players.find(
        (player) => player.seat === nextSeat
    );

    if (!nextPlayer) {
        throw new Error("Next player not found");
    }

    gameState.currentTurnUserId = nextPlayer.userId;

    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        throw new Error("Room not found");
    }

    broadcastToRoom(room.roomCode, {
        type: "turn_changed",
        currentTurnUserId: nextPlayer.userId,
        leadSuit: gameState.leadSuit,
        currentTrick: gameState.currentTrick,
        trickNumber: gameState.trickNumber,
    });
};

export const finishTrick = async (roomId: string) => {
    const gameState = getGameState(roomId);

    // 1. Determine the winner
    const winnerUserId = await calculateTrickWinner(roomId);
    const winnerPlayer = gameState.players.find(
        (player) => player.userId === winnerUserId
    );

    if (!winnerPlayer) {
        throw new Error("Winner not found");
    }

    const completedTrick = [...gameState.currentTrick];

    // 2. Winner starts the next trick
    gameState.currentTurnUserId = winnerUserId;

    // 3. Update score
    await updateScore(roomId, winnerPlayer.seat);

    // 4. Broadcast completed trick
    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        throw new Error("Room not found");
    }

    broadcastToRoom(room.roomCode, {
        type: "trick_finished",
        winnerUserId,
        winnerSeat: winnerPlayer.seat,
        playedCards: completedTrick,
        trickNumber: gameState.trickNumber,
    });

    // 5. Prepare next trick
    gameState.currentTrick = [];
    gameState.leadSuit = null;
    gameState.trickNumber++;

    // 6. Check if round has finished:
    // User rule: Do NOT end the game until every player throws all their cards (all 13 tricks completed)
    const gameFinished = gameState.trickNumber > 13;

    if (gameFinished) {
        setTimeout(async () => {
            try {
                await endGame(roomId);
            } catch (err) {
                console.error("Error ending game:", err);
            }
        }, 2000);
        return;
    }

    // 7. Broadcast next turn after 2.0s delay so all players see who won the trick and cards stay on table
    setTimeout(() => {
        broadcastToRoom(room.roomCode, {
            type: "turn_changed",
            currentTurnUserId: winnerUserId,
            leadSuit: null,
            currentTrick: [],
            trickNumber: gameState.trickNumber,
        });
    }, 2000);
};

const CARD_RANK: Record<string, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
};

const getRank = (card: string): number => {
    const rank = card.slice(0, -1);
    return CARD_RANK[rank]!;
};

const getSuit = (card: string): string => {
    return card.slice(-1);
};

export const calculateTrickWinner = async (roomId: string): Promise<string> => {
    const gameState = getGameState(roomId);
    const trick = gameState.currentTrick;

    if (trick.length !== 4) {
        throw new Error("Trick is incomplete");
    }

    const leadSuit = gameState.leadSuit;

    if (!leadSuit) {
        throw new Error("Lead suit not found");
    }

    // Start with cards of the lead suit
    let candidates = trick.filter(
        (played) => getSuit(played.card) === leadSuit
    );

    // Trump cards take priority if trump is open
    if (gameState.trumpOpened && gameState.trumpSuit) {
        const trumpCards = trick.filter(
            (played) => getSuit(played.card) === gameState.trumpSuit
        );

        if (trumpCards.length > 0) {
            candidates = trumpCards;
        }
    }

    // Find the highest-ranked card
    let winner = candidates[0]!;

    for (const played of candidates) {
        if (getRank(played.card) > getRank(winner.card)) {
            winner = played;
        }
    }

    return winner.userId;
};

export const updateScore = async (
    roomId: string,
    winnerSeat: number
) => {
    const gameState = getGameState(roomId);

    const isTeamA = winnerSeat === 1 || winnerSeat === 3;

    if (isTeamA) {
        gameState.teamATricks++;
    } else {
        gameState.teamBTricks++;
    }

    for (const playedCard of gameState.currentTrick) {
        const rank = playedCard.card.slice(0, -1);
        if (rank === "10") {
            if (isTeamA) {
                gameState.teamAMindis++;
            } else {
                gameState.teamBMindis++;
            }
        }
    }

    gameState.teamAScore = gameState.teamATricks;
    gameState.teamBScore = gameState.teamBTricks;

    const room = await prisma.room.findUnique({
        where: { id: roomId },
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const isCoatAchieved = gameState.teamAMindis === 4 || gameState.teamBMindis === 4;
    const coatTeam = gameState.teamAMindis === 4 ? "A" : gameState.teamBMindis === 4 ? "B" : null;

    broadcastToRoom(room.roomCode, {
        type: "score_updated",
        teamAScore: gameState.teamAScore,
        teamBScore: gameState.teamBScore,
        teamATricks: gameState.teamATricks,
        teamBTricks: gameState.teamBTricks,
        teamAMindis: gameState.teamAMindis,
        teamBMindis: gameState.teamBMindis,
        isCoat: isCoatAchieved,
        coatTeam,
    });

    if (isCoatAchieved && coatTeam) {
        broadcastToRoom(room.roomCode, {
            type: "coat_alert",
            coatTeam,
            message: `🔥 COAT! Team ${coatTeam} has captured ALL 4 TENS (Mindis)!`,
        });
    }
};

export const endGame = async (roomId: string) => {
    const gameState = getGameState(roomId);

    // Ensure all 52 physical cards are in discardPile
    if (gameState.discardPile.length < 52) {
        // If hidden trump card was somehow never opened/played, add it
        if (gameState.hiddenTrumpCard && !gameState.discardPile.includes(gameState.hiddenTrumpCard)) {
            gameState.discardPile.push(gameState.hiddenTrumpCard);
        }
        // Account for any remaining cards in hands (edge case fallback)
        for (const player of gameState.players) {
            const pHand = gameState.hands.get(player.userId) || [];
            for (const c of pHand) {
                if (!gameState.discardPile.includes(c)) {
                    gameState.discardPile.push(c);
                }
            }
        }
    }

    // 1. Preserve the physical deck:
    // Reconstruct the physical deck from the cards exactly in the chronological order
    // they were played during the previous round (trick 1 card 1 to trick 13 card 4).
    // Do NOT sort cards. Do NOT recreate a fresh deck.
    const reconstructedPhysicalDeck = [...gameState.discardPile];
    setMatchDeck(roomId, reconstructedPhysicalDeck);

    // Determine winner based on Mindis (10s) collected
    let winnerTeam: "A" | "B" | "draw";
    if (gameState.teamAMindis > gameState.teamBMindis) {
        winnerTeam = "A";
    } else if (gameState.teamBMindis > gameState.teamAMindis) {
        winnerTeam = "B";
    } else {
        if (gameState.teamATricks > gameState.teamBTricks) {
            winnerTeam = "A";
        } else if (gameState.teamBTricks > gameState.teamATricks) {
            winnerTeam = "B";
        } else {
            winnerTeam = "draw";
        }
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");

    await prisma.room.update({
        where: { id: roomId },
        data: { status: "FINISHED" },
    });

    gameState.phase = "FINISHED";

    const isCoat = gameState.teamAMindis === 4 || gameState.teamBMindis === 4;
    const coatTeam = gameState.teamAMindis === 4 ? "A" : gameState.teamBMindis === 4 ? "B" : null;

    const isTariya = gameState.teamATricks === 13 || gameState.teamBTricks === 13;
    const tariyaTeam = gameState.teamATricks === 13 ? "A" : gameState.teamBTricks === 13 ? "B" : null;
    const tariyaVictimTeam = tariyaTeam === "A" ? "B" : tariyaTeam === "B" ? "A" : null;

    broadcastToRoom(room.roomCode, {
        type: "game_over",
        winnerTeam,
        teamAMindis: gameState.teamAMindis,
        teamBMindis: gameState.teamBMindis,
        teamATricks: gameState.teamATricks,
        teamBTricks: gameState.teamBTricks,
        isCoat,
        coatTeam,
        isTariya,
        tariyaTeam,
        tariyaVictimTeam,
        seats: gameState.players.map((p) => ({
            seat: p.seat,
            userId: p.userId,
        })),
        dealerSeat: gameState.dealerSeat,
        roundNumber: gameState.roundNumber || 1,
    });
};

export const openTrump = async (ws: WebSocket) => {
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
        return;
    }

    const roomPlayer = await prisma.roomPlayer.findFirst({ where: { userId } });
    if (!roomPlayer) {
        ws.send(JSON.stringify({ type: "error", message: "You are not in any room" }));
        return;
    }

    const gameState = getGameState(roomPlayer.roomId);

    if (gameState.trumpOpened) {
        ws.send(JSON.stringify({ type: "error", message: "Trump is already opened" }));
        return;
    }

    if (!gameState.trumpSuit) {
        ws.send(JSON.stringify({ type: "error", message: "Trump has not been chosen yet" }));
        return;
    }

    if (gameState.currentTurnUserId !== userId) {
        ws.send(JSON.stringify({ type: "error", message: "It is not your turn" }));
        return;
    }

    // Must be in active trick
    if (gameState.currentTrick.length === 0 || !gameState.leadSuit) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Cannot ask for trump before a card has been led in the trick",
        }));
        return;
    }

    // Rule: Player can only ask for trump if they do NOT have the matching lead suit in hand
    const hand = gameState.hands.get(userId);
    if (hand && hand.some((c) => c.slice(-1) === gameState.leadSuit)) {
        ws.send(JSON.stringify({
            type: "error",
            message: "You have matching lead suit cards, cannot ask for trump",
        }));
        return;
    }

    gameState.trumpOpened = true;
    gameState.trumpOpenerUserId = userId;

    // Return the hidden trump card back to Raangi's hand now that it is revealed
    const raangiId = gameState.raangiUserId;
    if (raangiId && gameState.hiddenTrumpCard) {
        const raangiHand = gameState.hands.get(raangiId);
        if (raangiHand && !raangiHand.includes(gameState.hiddenTrumpCard)) {
            raangiHand.push(gameState.hiddenTrumpCard);
            sendToPlayer(raangiId, {
                type: "cards_dealt",
                hand: raangiHand,
            });
        }
    }

    const room = await prisma.room.findUnique({ where: { id: roomPlayer.roomId } });
    if (!room) throw new Error("Room not found");

    broadcastToRoom(room.roomCode, {
        type: "trump_opened",
        trumpSuit: gameState.trumpSuit,
        hiddenTrumpCard: gameState.hiddenTrumpCard,
        openedByUserId: userId,
    });
};

export const returnToLobby = async (
    ws: WebSocket,
    data: { roomCode: string }
) => {
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
        return;
    }

    const room = await prisma.room.findUnique({
        where: { roomCode: data.roomCode },
        include: { players: true },
    });

    if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
    }

    const isMember = room.players.some((p) => p.userId === userId);
    if (!isMember) {
        ws.send(JSON.stringify({ type: "error", message: "You are not in this room" }));
        return;
    }

    // Reset room status to WAITING
    await prisma.room.update({
        where: { id: room.id },
        data: { status: "WAITING" },
    });

    // Reset player ready states
    await prisma.roomPlayer.updateMany({
        where: { roomId: room.id },
        data: { isReady: false },
    });

    // Clean up in-memory game state and match deck
    deleteGameState(room.id);
    deleteMatchDeck(room.id);

    broadcastToRoom(room.roomCode, {
        type: "returned_to_lobby",
        roomCode: room.roomCode,
        status: "WAITING",
    });
};

/**
 * Starts next round of the match reusing the physical deck from previous round.
 */
export const startNextRound = async (
    ws: WebSocket,
    data: { roomCode: string }
) => {
    const userId = getSocketUser(ws);
    if (!userId) {
        ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
        return;
    }

    const room = await prisma.room.findUnique({
        where: { roomCode: data.roomCode },
        include: {
            players: {
                orderBy: { seat: "asc" },
            },
        },
    });

    if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
    }

    const isMember = room.players.some((p) => p.userId === userId);
    if (!isMember) {
        ws.send(JSON.stringify({ type: "error", message: "You are not in this room" }));
        return;
    }

    if (room.players.length !== 4) {
        ws.send(JSON.stringify({ type: "error", message: "Exactly 4 players required for next round" }));
        return;
    }

    // Determine previous dealer and next round number
    let prevDealerSeat = 1;
    let nextRoundNumber = 2;
    if (hasGameState(room.id)) {
        const oldState = getGameState(room.id);
        prevDealerSeat = oldState.dealerSeat || 1;
        nextRoundNumber = (oldState.roundNumber || 1) + 1;
    }

    // 4. Dealer rotation: Rotate dealer clockwise to the next seat (1->2->3->4->1)
    const newDealerSeat = getNextSeat(prevDealerSeat);
    const newDealer = room.players.find((p) => p.seat === newDealerSeat) || room.players[0]!;
    const newRaangiSeat = getRaangiSeat(newDealerSeat);
    const newRaangi = room.players.find((p) => p.seat === newRaangiSeat) || room.players[1]!;

    const players: Player[] = room.players.map((p) => ({
        userId: p.userId,
        seat: p.seat,
    }));

    // 1. Preserve the physical deck:
    // Take the preserved used pile reconstructed from the previous round
    let preservedDeck = getMatchDeck(room.id);
    if (!preservedDeck || !validateDeck(preservedDeck)) {
        console.warn("[startNextRound] No preserved deck found, creating fresh fallback");
        preservedDeck = createFreshDeck();
    }

    // 2. Shuffle like a real person:
    // Multi-pass realistic human shuffle (Riffle, Overhand, Chunk transposition)
    const shuffledDeck = humanShuffle(preservedDeck);

    // 3. Random Table Cut:
    // Cut position between 20% and 80%, moving top portion to the bottom
    const cutDeckResult = cutDeck(shuffledDeck);

    // 5. Deal order & deterministic state:
    createGameState(
        room.id,
        cutDeckResult,
        newDealer.userId,
        newDealerSeat,
        players,
        nextRoundNumber
    );

    const gameState = getGameState(room.id);
    gameState.raangiUserId = newRaangi.userId;

    for (const player of players) {
        setPlayerHand(room.id, player.userId, []);
    }

    // Deal first packet: 5 cards to each player clockwise starting from Raangi
    dealPacket(room.id, players, 5);

    await prisma.room.update({
        where: { id: room.id },
        data: { status: "PLAYING" },
    });

    broadcastToRoom(room.roomCode, {
        type: "game_started",
        seats: players.map((p) => ({ seat: p.seat, userId: p.userId })),
        dealerUserId: newDealer.userId,
        dealerSeat: newDealerSeat,
        raangiSeat: newRaangiSeat,
        raangiUserId: newRaangi.userId,
        roundNumber: nextRoundNumber,
    });

    for (const player of players) {
        sendToPlayer(player.userId, {
            type: "cards_dealt",
            hand: gameState.hands.get(player.userId),
        });
    }

    // Prompt new Raangi to choose & hide trump
    await decideTrump(room.id);
};

