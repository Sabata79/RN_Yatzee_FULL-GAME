/**
 * BadgePaths - Constants for badge image paths and levels
 * This file defines the paths and levels for various badges used in the game.
 * JSDoc comments and inline code comments must always be in English.
 * @author Sabata79
 * @since 2025-10-03
 * @updated 2025-11-14
 */
// Badge image paths and levels
export const levelBadgePaths = [
{path: '../../assets/badges/beginner.webp', display: require('../../assets/badges/beginner.webp'), level: 'beginner' },
{path: '../../assets/badges/basic.webp', display: require('../../assets/badges/basic.webp'), level: 'basic' },
{path: '../../assets/badges/advanced.webp', display: require('../../assets/badges/advanced.webp'), level: 'advanced' },
{path: '../../assets/badges/elite.webp', display: require('../../assets/badges/elite.webp'), level: 'elite' },
{path: '../../assets/badges/legendary.webp', display: require('../../assets/badges/legendary.webp'), level: 'legendary' },
];

// Yearly achievement badges (champion, runner-up, third place)
export const yearlyBadgePaths = {
  champion2025: require('../../assets/badges/yearlyBadges/ChampionBadge2025.webp'),
  runnerUp2025: require('../../assets/badges/yearlyBadges/RunnerUpBadge2025.webp'),
  third2025: require('../../assets/badges/yearlyBadges/ThirdBadge2025.webp'),
};