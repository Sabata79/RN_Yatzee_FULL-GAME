/**
 * GameRulesStyles.js - Styles for the GameRules view
 *
 * Contains all style definitions for the GameRules view.
 *
 * @module styles/GameRulesStyles
 * @author Sabata79
 * @since 2025-09-06
 */
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';

const gameRulesStyles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: -20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  paragraph: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Roboto',
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 10,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 30,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  combination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  combinationText: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  smallText: {
    color: 'gold',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'AntonRegular',
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  scoreItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  scoreTitle: {
    color: 'gold',
    fontSize: 16,
    fontFamily: 'AntonRegular',
    marginBottom: 5,
  },
  scoreDescription: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Roboto',
    lineHeight: 20,
  },
});

export default gameRulesStyles;
