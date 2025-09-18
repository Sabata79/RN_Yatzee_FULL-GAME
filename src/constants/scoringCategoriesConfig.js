
/**
 * scoringCategoriesConfig – configuration for Yatzy scoring categories.
 * Defines the available scoring categories and their indices for the game logic and UI.
 *
 * Exports:
 *  - scoringCategoriesConfig: Array<{ name: string, index?: number }>
 *
 * @module scoringCategoriesConfig
 * @author Sabata79
 * @since 2025-09-18
 */
export const scoringCategoriesConfig = [
    { name: 'ones', index: 1 },
    { name: 'twos', index: 5 },
    { name: 'threes', index: 9 },
    { name: 'fours', index: 13 },
    { name: 'fives', index: 17 },
    { name: 'sixes', index: 21 },
    { name: 'twoOfKind', index: 3 },
    { name: 'threeOfAKind', index: 7 },
    { name: 'fourOfAKind', index: 11 },
    { name: 'yatzy', index: 27 },
    { name: 'fullHouse', index: 15 },
    { name: 'smallStraight', index: 19 },
    { name: 'largeStraight', index: 23 },
    { name: 'chance', index: 31 },
    { name: 'sectionMinor' },
];
