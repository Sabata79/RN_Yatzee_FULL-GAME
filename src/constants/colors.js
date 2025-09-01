
/**
 * colors.js - Global color palette for BubbleApp
 *
 * Centralizes all main color definitions, including dark and light shades, for easy theme management and consistency.
 * Import COLORS to use e.g. COLORS.primary, COLORS.secondary, etc. throughout the app.
 * shadow usage ...Colors.shadow in styleSheets
 * @author Sabata79
 * @since 2025-08-29
 */

/**
 * @typedef {Object} COLORS
 * @property {string} primary   - Main brand color (#3498db)
 * @property {string} secondary - Secondary accent color (#2ecc71)
 * @property {string} accent    - Highlight/accent color (#e67e22)
 * @property {string} background - Default background color (#f5f6fa)
 * @property {string} text      - Main text color (#222f3e)
 * @property {string} white     - White color (#ffffff)
 * @property {string} black     - Black color (#000000)
 * @property {string} error     - Error color (#e74c3c)
 * @property {string} warning   - Warning color (#f1c40f)
 * @property {string} success   - Success color (#27ae60)
 */
export const COLORS = {
  primary: '#3498db',
  secondary: '#2ecc71',
  accent: '#e67e22',
  background: '#f5f6fa',
  text: '#222f3e',
  white: '#ffffff',
  black: '#000000',
  error: '#e74c3c',
  warning: '#f1c40f',
  success: '#27ae60',
  // shadow
  shadow: '#000000',
  shadowStyle: {
    shadowColor: '#00000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  }
};

export default COLORS;
