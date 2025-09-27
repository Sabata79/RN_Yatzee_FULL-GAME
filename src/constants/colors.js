/**
 * colors.js - Global color palette for Yatzy game application.
 *
 * Centralizes all main color definitions, including dark and light shades, for easy theme management and consistency.
 * Import COLORS to use e.g. COLORS.primary, COLORS.secondary, etc. throughout the app.
 * shadow usage ...COLORS.shadow in styleSheets
 *
 * @module constants/colors
 * @author Sabata79
 * @since 2025-08-29
 *
 * Common usage:
 *  - COLORS.primary, COLORS.primaryLight, COLORS.primaryDark
 *  - COLORS.secondary, COLORS.secondaryLight, COLORS.secondaryDark
 *  - COLORS.accent, COLORS.accentLight, COLORS.accentDark
 *  - COLORS.background, COLORS.backgroundDark
 *  - COLORS.text, COLORS.textLight
 *  - COLORS.info, COLORS.disabled, COLORS.border
 *  - COLORS.error, COLORS.warning, COLORS.success
 *  - COLORS.shadow, COLORS.whiteShadow
 */

/**
 * @typedef {Object} COLORS
 * @property {string} primary         - Main brand color (#3498db)
 * @property {string} primaryLight    - Lighter shade of primary (#5dade2)
 * @property {string} primaryDark     - Darker shade of primary (#21618c)
 * @property {string} secondary       - Secondary accent color (#2ecc71)
 * @property {string} secondaryLight  - Lighter shade of secondary (#58d68d)
 * @property {string} secondaryDark   - Darker shade of secondary (#239b56)
 * @property {string} accent          - Highlight/accent color (#e67e22)
 * @property {string} accentLight     - Lighter shade of accent (#ffb366)
 * @property {string} accentDark      - Darker shade of accent (#a04000)
 * @property {string} background      - Default background color (#f5f6fa)
 * @property {string} backgroundDark  - Slightly darker background (#d1d8e0)
 * @property {string} text            - Main text color (#222f3e)
 * @property {string} textLight       - Light text for dark backgrounds (#F5F5F5)
 * @property {string} textDark        - Dark text for light backgrounds (#000000)
 * @property {string} info            - Informational color (#2980b9)
 * @property {string} disabled        - Disabled state color (#b2bec3)
 * @property {string} border          - Border color (#dfe4ea)
 * @property {string} white           - White color (#ffffff)
 * @property {string} black           - Black color (#000000)
 * @property {string} error           - Error color (#e74c3c)
 * @property {string} warning         - Warning color (#f1c40f)
 * @property {string} success         - Success color (#27ae60)
 * @property {string} shadow          - Shadow color (#000000)
 * @property {Object} shadowStyle     - Shadow style object for dark backgrounds
 * @property {Object} whiteShadow     - Shadow style object for light backgrounds
 */
export const COLORS = {
  primary: '#3498db',
  primaryLight: '#5dade2',
  primaryDark: '#21618c',

  secondary: '#2ecc71',
  secondaryLight: '#58d68d',
  secondaryDark: '#239b56',

  accent: '#e67e22',
  accentLight: '#ffb366',
  accentDark: '#a04000',

  background: '#f5f6fa',
  backgroundDark: '#d1d8e0',
  backgroundGray: '#776c62',

  overlayDark: 'rgba(0, 0, 0, 0.7)',
  overlayExtraDark: 'rgba(0, 0, 0, 0.9)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',

  text: '#222f3e',
  textLight: '#F5F5F5',
  textDark: '#000000',

  info: '#2980b9',
  disabled: '#b2bec3',
  border: '#65696d',

  white: '#ffffff',
  black: '#000000',

  error: '#e74c3c',
  warning: '#f1c40f',
  success: '#27ae60',

  // shadow for dark backgrounds
  shadow: '#000000',
  shadowStyle: {
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  // white shadow style for light backgrounds
  whiteShadow: {
    shadowColor: '#ffffff',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  }
};

// Freeze nested style objects to prevent accidental mutation at runtime.
try {
  if (COLORS.shadowStyle && typeof Object.freeze === 'function') Object.freeze(COLORS.shadowStyle);
  if (COLORS.whiteShadow && typeof Object.freeze === 'function') Object.freeze(COLORS.whiteShadow);
  if (typeof Object.freeze === 'function') Object.freeze(COLORS);
} catch (e) {
  // If freezing fails in some environments, silently continue — this is a best-effort protection.
}

export default COLORS;