/**
 * Realistic Physical Deck Simulation for Mindi Coat (Taash)
 *
 * Simulates real-world physical card handling:
 * - Exact chronological discard pile collection (trick 1 card 1 through trick 13 card 4)
 * - Imperfect human physical shuffles (Riffle interleaving with clumps, Overhand running, Strip/Chunk transposition)
 * - Table cut by another player (20% - 80%)
 * - Lifetime physical deck preservation across all rounds of a match
 */
const SUITS = ["S", "H", "D", "C"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
/**
 * Creates a brand-new fresh ordered 52-card deck.
 * Used ONLY once at the very start of a brand-new match.
 */
export const createFreshDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push(`${rank}${suit}`);
        }
    }
    return deck;
};
/**
 * Validates that a deck contains all 52 unique physical cards.
 */
export const validateDeck = (deck) => {
    if (!Array.isArray(deck) || deck.length !== 52)
        return false;
    const unique = new Set(deck);
    if (unique.size !== 52)
        return false;
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            if (!unique.has(`${rank}${suit}`))
                return false;
        }
    }
    return true;
};
/**
 * Simulates a physical human Riffle Shuffle.
 * 1. Deck is split approximately in half (23-29 cards in left hand).
 * 2. Cards are released from thumbs with realistic imperfect clumps (1-3 cards).
 * 3. Interleaves with physical probability biased by packet sizes.
 */
export const riffleShuffle = (deck) => {
    const len = deck.length;
    // Split near middle with natural hand variance (+/- 3 cards)
    const splitVariance = Math.floor(Math.random() * 7) - 3;
    const splitPoint = Math.max(10, Math.min(len - 10, Math.floor(len / 2) + splitVariance));
    const left = deck.slice(0, splitPoint);
    const right = deck.slice(splitPoint);
    const result = [];
    while (left.length > 0 || right.length > 0) {
        if (left.length === 0) {
            result.push(...right);
            break;
        }
        if (right.length === 0) {
            result.push(...left);
            break;
        }
        // Probability of dropping from left hand proportional to remaining cards
        const probLeft = left.length / (left.length + right.length);
        const dropFromLeft = Math.random() < probLeft;
        // Human thumb drops 1 to 3 cards at a time (65% single, 25% pair, 10% trio)
        const rand = Math.random();
        const dropCount = rand < 0.65 ? 1 : rand < 0.9 ? 2 : 3;
        if (dropFromLeft) {
            const count = Math.min(dropCount, left.length);
            for (let i = 0; i < count; i++) {
                result.push(left.shift());
            }
        }
        else {
            const count = Math.min(dropCount, right.length);
            for (let i = 0; i < count; i++) {
                result.push(right.shift());
            }
        }
    }
    return result;
};
/**
 * Simulates a physical Overhand Shuffle.
 * The shuffler lifts the deck and uses the other thumb to pull off
 * small random packets (2 to 6 cards) from top/back, reversing packet order.
 */
export const overhandShuffle = (deck) => {
    const result = [];
    let remaining = [...deck];
    while (remaining.length > 0) {
        // Pull small packet of 2 to 6 cards
        const chunkSize = Math.min(remaining.length, Math.floor(Math.random() * 5) + 2);
        const chunk = remaining.slice(0, chunkSize);
        remaining = remaining.slice(chunkSize);
        // Place chunk on top of the newly formed pile (reverses chunk flow)
        result.unshift(...chunk);
    }
    return result;
};
/**
 * Simulates a Strip / Chunk Transposition shuffle.
 * Moves small packets from middle to bottom or top to middle.
 */
export const chunkTransposition = (deck) => {
    if (deck.length < 10)
        return deck;
    const working = [...deck];
    // Pick a small chunk from middle (3-7 cards) and move to bottom
    const midStart = 10 + Math.floor(Math.random() * (working.length - 20));
    const chunkSize = Math.min(working.length - midStart, Math.floor(Math.random() * 5) + 3);
    const chunk = working.splice(midStart, chunkSize);
    working.push(...chunk);
    // Pick a small chunk from top (2-5 cards) and insert into random middle
    const topChunkSize = Math.floor(Math.random() * 4) + 2;
    const topChunk = working.splice(0, topChunkSize);
    const insertPos = 5 + Math.floor(Math.random() * (working.length - 10));
    working.splice(insertPos, 0, ...topChunk);
    return working;
};
/**
 * Simulates a complete, realistic human multi-pass shuffle on a physical deck.
 * Does NOT generate a fresh deck or use uniform Fisher-Yates shuffle.
 * Executes realistic multi-pass physical mechanics.
 */
export const humanShuffle = (deck) => {
    let current = [...deck];
    // Pass 1: Initial Riffle
    current = riffleShuffle(current);
    // Pass 2: Overhand Shuffle
    current = overhandShuffle(current);
    // Pass 3: Middle/Top Chunk Transposition
    current = chunkTransposition(current);
    // Pass 4: Second Riffle
    current = riffleShuffle(current);
    // Pass 5: Third Riffle
    current = riffleShuffle(current);
    // Pass 6: Second Overhand Shuffle
    current = overhandShuffle(current);
    // Pass 7: Final Riffle
    current = riffleShuffle(current);
    // Pass 8: Final overhand tap
    current = overhandShuffle(current);
    return current;
};
/**
 * Simulates a table cut performed by another player.
 * Chooses a cut point between 20% and 80% of the deck.
 * Moves the top portion to the bottom.
 */
export const cutDeck = (deck) => {
    const len = deck.length;
    const minCut = Math.floor(len * 0.2); // ~10 cards
    const maxCut = Math.floor(len * 0.8); // ~42 cards
    const cutPos = minCut + Math.floor(Math.random() * (maxCut - minCut + 1));
    // The top portion (0 to cutPos-1) is placed under the bottom portion
    const bottomPortion = deck.slice(cutPos);
    const topPortion = deck.slice(0, cutPos);
    return [...bottomPortion, ...topPortion];
};
//# sourceMappingURL=deck.js.map