export const NBR_OF_DICES = 5;
export const NBR_OF_THROWS = 3;
export const MIN_SPOTS = 1;
export const MAX_SPOTS = 14;
export const BONUS_POINTS_LIMIT = 63;
export const BONUS_POINTS = 35;
export const NBR_OF_SCOREBOARD_ROWS = 20;
export const SCOREBOARD_KEY = '@scoreboard';
export const YATZY_POINTS = 50;
export const FULLHOUSE_PONITS = 25;
export const SMALL_STRAIGHT_POINTS = 30;
export const LARGE_STRAIGHT_POINTS = 40;

//  Base description for the rules
export const rulesTextContent = `
      Score as many points as possible
      by rolling dice to reach the ${MAX_SPOTS} combinations
      predefined in the game.

      Dice can be rolled up to ${NBR_OF_THROWS}
      times in a turn to make one of the
      possible scoring combinations.

      A game consists ${MAX_SPOTS} rounds during which
      the player chooses which scoring
      combination is to be used in that round.
      Once a combination has been used in the
      game, it cannot be used again.

      You can select dice after your first or
      second roll, and you must score after
      your third roll. After the first and
      second roll you can save the dice by
      clicking on them or throw them in the
      spots. Dice that are set aside from the
      previous rolls can be taken out
      and re-rolled.

      When you want to record a
      combination in the scoreboard, click
      on the cell next to the combination
      and then press the Set Points button.

      When you reach at least ${BONUS_POINTS_LIMIT} in
      minor sector of the scoreboard,
      you unlock as ${BONUS_POINTS} bonus points.

      You have a Yatzy when you get ${NBR_OF_DICES} dice with
      the same side and it is worth ${YATZY_POINTS} points.

      The game ends when all categories have
      been scored.
`;

//  Specific Rules and combinations
export const combinationsData = [
  {
    icon: 'dice-multiple',
    description: 'Get the maximum of same side dices. it will score the sum of all the same dice.',
    smallText: ''
  },
  {
    icon: 'numeric-3-box-multiple-outline',
    description: 'Three of a kind & Four of a kind. Sums same side dices.',
    smallText: '3 & 4 same'
  },
  {
    icon: 'home',
    description: 'Fullhouse. Three of a kind & pair | 25 points.',
    smallText: 'Fullhouse'
  },
  {
    icon: 'cards-outline',
    description: 'Small straight. 4 consecutive dice | 30 points.',
    smallText: 'Small'
  },
  {
    icon: 'cards-outline',
    description: 'Large straight. 1-2-3-4-5 or 2-3-4-5-6 | 40 points.',
    smallText: 'Large'
  },
  {
    icon: 'star-outline',
    description: 'Yatzy. All dice with the same side | 50 points.',
    smallText: 'Yatzy'
  },
  {
    icon: 'cards-outline',
    description: 'Change. Scores the sum of all dice.',
    smallText: 'change'
  },
];

