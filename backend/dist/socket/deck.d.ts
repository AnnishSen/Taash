/**
 * Realistic Physical Deck Simulation for Mindi Coat (Taash)
 *
 * Simulates real-world physical card handling:
 * - Exact chronological discard pile collection (trick 1 card 1 through trick 13 card 4)
 * - Imperfect human physical shuffles (Riffle interleaving with clumps, Overhand running, Strip/Chunk transposition)
 * - Table cut by another player (20% - 80%)
 * - Lifetime physical deck preservation across all rounds of a match
 */
/**
 * Creates a brand-new fresh ordered 52-card deck.
 * Used ONLY once at the very start of a brand-new match.
 */
export declare const createFreshDeck: () => string[];
/**
 * Validates that a deck contains all 52 unique physical cards.
 */
export declare const validateDeck: (deck: string[]) => boolean;
/**
 * Simulates a physical human Riffle Shuffle.
 * 1. Deck is split approximately in half (23-29 cards in left hand).
 * 2. Cards are released from thumbs with realistic imperfect clumps (1-3 cards).
 * 3. Interleaves with physical probability biased by packet sizes.
 */
export declare const riffleShuffle: (deck: string[]) => string[];
/**
 * Simulates a physical Overhand Shuffle.
 * The shuffler lifts the deck and uses the other thumb to pull off
 * small random packets (2 to 6 cards) from top/back, reversing packet order.
 */
export declare const overhandShuffle: (deck: string[]) => string[];
/**
 * Simulates a Strip / Chunk Transposition shuffle.
 * Moves small packets from middle to bottom or top to middle.
 */
export declare const chunkTransposition: (deck: string[]) => string[];
/**
 * Simulates a complete, realistic human multi-pass shuffle on a physical deck.
 * Does NOT generate a fresh deck or use uniform Fisher-Yates shuffle.
 * Executes realistic multi-pass physical mechanics.
 */
export declare const humanShuffle: (deck: string[]) => string[];
/**
 * Simulates a table cut performed by another player.
 * Chooses a cut point between 20% and 80% of the deck.
 * Moves the top portion to the bottom.
 */
export declare const cutDeck: (deck: string[]) => string[];
//# sourceMappingURL=deck.d.ts.map