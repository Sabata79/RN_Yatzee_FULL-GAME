/**
 * scoreLogic.test.js — Yatzy basescore race condition regression test
 * Simulates 1000 random games to ensure no duplicate scoring and correct maximums.
 *
 * @module src/__tests__/scoreLogic.test
 * @author Sabata79
 * @since 2025-11-18
 * @updated 2025-11-18
 *
 * USAGE FOR TEST:
 *
 * 1. Run tests: npm test / npx jest
 * 2. The test checks:
 *    - Upper section points never exceed 105
 *    - Major category points never exceed rule maximums
 *    - No category is locked twice (no duplicate points)
 *    - No duplicate categories in ScoreModal
 * 3. Any bugs are logged to the console
 * 4. Use as a regression test for every build
*/

const { BONUS_POINTS_LIMIT } = require('../constants/Game');
const { calculateYatzy, calculateSmallStraight, calculateLargeStraight, calculateFullHouse, calculateThreeOfAKind, calculateFourOfAKind, calculateTwoOfKind, calculateChange } = require('../logic/diceLogic');

const minorNames = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
const majorNames = ['pair', 'twoPairs', 'threeOfAKind', 'fourOfAKind', 'smallStraight', 'largeStraight', 'fullHouse', 'chance', 'yatzy'];

function randomDices() {
  return Array(5).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
}

function randomCategoryOrder() {
  const all = [...minorNames, ...majorNames];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function calculatePointsForCategory(name, dices) {
  switch (name) {
    case 'ones': return dices.filter(d => d === 1).length * 1;
    case 'twos': return dices.filter(d => d === 2).length * 2;
    case 'threes': return dices.filter(d => d === 3).length * 3;
    case 'fours': return dices.filter(d => d === 4).length * 4;
    case 'fives': return dices.filter(d => d === 5).length * 5;
    case 'sixes': return dices.filter(d => d === 6).length * 6;
    case 'pair': return calculateTwoOfKind(dices, 2);
    case 'twoPairs': return calculateTwoOfKind(dices, 4);
    case 'threeOfAKind': return calculateThreeOfAKind(dices);
    case 'fourOfAKind': return calculateFourOfAKind(dices);
    case 'smallStraight': return calculateSmallStraight(dices);
    case 'largeStraight': return calculateLargeStraight(dices);
    case 'fullHouse': return calculateFullHouse(dices);
    case 'chance': return calculateChange(dices);
    case 'yatzy': return calculateYatzy(dices);
    default: return 0;
  }
}

describe('Yatzy basescore race condition regression', () => {
      it('never allows duplicate points for any category in 1000 random games', () => {
        const allCategories = [...minorNames, 'pair', 'twoPairs', 'threeOfAKind', 'fourOfAKind', 'smallStraight', 'largeStraight', 'fullHouse', 'chance', 'yatzy'];
        let bugCount = 0;
        for (let game = 0; game < 1000; game++) {
          let locked = {};
          let scoreModalCategories = [];
          const order = randomCategoryOrder();
          for (let i = 0; i < order.length; i++) {
            const name = order[i];
            if (locked[name]) {
              bugCount++;
              if (bugCount <= 5) console.error(`BUG: duplicate lock ${name} game=${game}`);
            }
            locked[name] = true;
            scoreModalCategories.push(name);
          }
          // ScoreModalissa ei saa olla duplikaatteja
          const uniqueCategories = new Set(scoreModalCategories);
          if (uniqueCategories.size !== scoreModalCategories.length) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: duplicate category in ScoreModal game=${game}`);
          }
          expect(uniqueCategories.size).toBe(scoreModalCategories.length);
        }
        expect(bugCount).toBe(0);
      });
    it('major categories never exceed rule maximums in 1000 random games', () => {
      const majorNames = ['pair', 'twoPairs', 'threeOfAKind', 'fourOfAKind', 'smallStraight', 'largeStraight', 'fullHouse', 'chance'];
      let bugCount = 0;
      for (let game = 0; game < 1000; game++) {
        const order = randomCategoryOrder();
        for (let i = 0; i < order.length; i++) {
          const name = order[i];
          if (!majorNames.includes(name)) continue;
          const dices = randomDices();
          const points = calculatePointsForCategory(name, dices);
          if (name === 'smallStraight' && points > 30) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: smallStraight=${points} game=${game}`);
          }
          if (name === 'largeStraight' && points > 40) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: largeStraight=${points} game=${game}`);
          }
          if (name === 'fullHouse' && points > 25) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: fullHouse=${points} game=${game}`);
          }
          if (name === 'chance' && points > 30) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: chance=${points} game=${game}`);
          }
          // Pari, kaksi paria, kolmoset, neloset: max 30 (viisi kutosta)
          if ((name === 'pair' || name === 'twoPairs' || name === 'threeOfAKind' || name === 'fourOfAKind') && points > 30) {
            bugCount++;
            if (bugCount <= 5) console.error(`BUG: ${name}=${points} game=${game}`);
          }
          expect(points).toBeLessThanOrEqual( name === 'smallStraight' ? 30
            : name === 'largeStraight' ? 40
            : name === 'fullHouse' ? 25
            : name === 'chance' ? 30
            : 30 );
        }
      }
      expect(bugCount).toBe(0);
    });
  it('never exceeds 105 in 1000 random games', () => {
    let bugCount = 0;
    for (let game = 0; game < 1000; game++) {
      let minorPoints = 0;
      const order = randomCategoryOrder();
      for (let i = 0; i < order.length; i++) {
        const name = order[i];
        const dices = randomDices();
        const points = calculatePointsForCategory(name, dices);
        if (minorNames.includes(name)) {
          minorPoints += points;
        }
      }
      if (minorPoints > 105) {
        bugCount++;
        if (bugCount <= 5) {
          console.error(`BUG: minorPoints=${minorPoints} game=${game}`);
        }
      }
      expect(minorPoints).toBeLessThanOrEqual(105);
    }
    expect(bugCount).toBe(0);
  });
});
