// diceLogic.js
// Yatzy-pelin noppalaskujen logiikka eriytettynä

export function calculateDiceSum(rolledDices, diceValue) {
    return rolledDices.reduce((sum, dice) => (dice === diceValue ? sum + dice : sum), 0);
}

export function calculateTwoOfKind(rolledDices) {
    const counts = {};
    rolledDices.forEach(dice => {
        counts[dice] = (counts[dice] || 0) + 1;
    });
    let maxPairValue = 0;
    for (let dice in counts) {
        if (counts[dice] >= 2) {
            maxPairValue = Math.max(maxPairValue, parseInt(dice));
        }
    }
    return maxPairValue * 2;
}

export function calculateThreeOfAKind(rolledDices) {
    const counts = {};
    rolledDices.forEach(dice => {
        counts[dice] = (counts[dice] || 0) + 1;
    });
    for (let dice in counts) {
        if (counts[dice] >= 3) {
            return dice * 3;
        }
    }
    return 0;
}

export function calculateFourOfAKind(rolledDices) {
    const counts = {};
    rolledDices.forEach(dice => {
        counts[dice] = (counts[dice] || 0) + 1;
    });
    for (let dice in counts) {
        if (counts[dice] >= 4) {
            return dice * 4;
        }
    }
    return 0;
}

export function calculateYatzy(rolledDices) {
    return rolledDices.reduce((sum, dice) => {
        if (dice === 0) return sum;
        if (rolledDices.filter(item => item === dice).length === 5) return 50;
        return sum;
    }, 0);
}

export function calculateFullHouse(rolledDices) {
    const counts = {};
    for (const dice of rolledDices) {
        counts[dice] = (counts[dice] || 0) + 1;
    }
    const values = Object.values(counts);
    return values.includes(3) && values.includes(2);
}

export function calculateSmallStraight(rolledDices) {
    const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
    const smallStraights = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ];
    for (const smallStraight of smallStraights) {
        if (smallStraight.every(val => sortedDiceValues.includes(val))) {
            return 30;
        }
    }
    return 0;
}

export function calculateLargeStraight(rolledDices) {
    const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
    const largeStraights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
    ];
    for (const largeStraight of largeStraights) {
        if (largeStraight.every(val => sortedDiceValues.includes(val))) {
            return 40;
        }
    }
    return 0;
}

export function calculateChange(rolledDices) {
    return rolledDices.reduce((sum, dice) => {
        if (dice === 0) return sum;
        return sum + dice;
    }, 0);
}
