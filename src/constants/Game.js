/**
 * Game - Game constants and rules definitions.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file defines the main constants and rules for the Yatzy game.
 * @author Sabata79
 * @since 2025-08-29
 */
// Game constants
// Description: These constants define the rules and limits for the game.

export const NBR_OF_DICES = 5;
export const NBR_OF_THROWS = 3;
export const MIN_SPOTS = 1;
export const MAX_SPOTS = 14;
export const BONUS_POINTS_LIMIT = 63;
export const BONUS_POINTS = 35;
export const NBR_OF_SCOREBOARD_ROWS = 1000;
export const SCOREBOARD_KEY = '@scoreboard';
export const YATZY_POINTS = 50;
export const FULLHOUSE_PONITS = 25;
export const SMALL_STRAIGHT_POINTS = 30;
export const LARGE_STRAIGHT_POINTS = 40;

// Energy token system
export const MAX_TOKENS = 10; // Max energy tokens
export const VIDEO_TOKEN_LIMIT = 10; // Max tokens from ads per day
export const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

// Data handling
export const TOPSCORELIMIT = 3000;

//  Base description for the rules
export const rulesTextContent = `
Score as many points as possible by rolling dice to reach the ${MAX_SPOTS} combinations predefined in the game.

Dice can be rolled up to ${NBR_OF_THROWS} times in a turn to make one of the possible scoring combinations.

A game consists ${MAX_SPOTS} rounds during which the player chooses which scoring combination is to be used in that round. Once a combination has been used in the game, it cannot be used again, except for the Yatzy combination, which can be stacked multiple times.

You can select dice after your first or second roll, and you must score after your third roll. After the first and second roll you can save the dice by clicking on them or throw them in the spots. Dice that are set aside from the previous rolls can be taken out and re-rolled.

When you want to record a combination in the scoreboard, click on the cell next to the combination and then press the Set Points button.

When you reach at least ${BONUS_POINTS_LIMIT} in minor sector of the scoreboard, you unlock as ${BONUS_POINTS} bonus points.

You have a Yatzy when you get ${NBR_OF_DICES} dice with the same side and it is worth ${YATZY_POINTS} points. If you achieve multiple Yatzys, each additional Yatzy will add points to your score and increase the number of rounds by 1.

The game ends when all categories have been scored.
`;

//  Specific Rules and combinations
export const combinationsData = [
  {
    icon: 'dice-multiple',
    description: 'Get the maximum of same side dice. Scores the sum of all same dice on the Minor side.',
    smallText: 'Minor Side (Sum of same dice)'
  },
  {
    icon: 'numeric-3-box-multiple-outline',
    description: 'Two, Three, & Four of a kind. Sums same side dice.',
    smallText: '2-4 Same (Sum dice)'
  },
  {
    icon: 'home',
    description: 'Three of a kind & pair | 25 points.',
    smallText: 'Fullhouse'
  },
  {
    icon: 'cards-outline',
    description: '4 consecutive dice | 30 points.',
    smallText: 'Small straight'
  },
  {
    icon: 'cards-outline',
    description: '1-2-3-4-5 or 2-3-4-5-6 | 40 points.',
    smallText: 'Large straight'
  },
  {
    icon: 'star-outline',
    description: 'All dice with the same side | 50 points.',
    smallText: 'Yatzy'
  },
  {
    icon: 'cards-outline',
    description: 'Scores the sum of all dice.',
    smallText: 'Change'
  },
];
export const SCORE_COMPARSION_TEXT = {
  title: 'SCORES COMPARISON',
  points: '1. **Points**: Higher points are ranked first.',
  duration: '2. **Duration**: If points are equal, the score with the shorter duration comes first.',
  dateTime: '3. **Date/Time**: If both points and duration are equal, the score that was achieved earlier is ranked higher.'
};

