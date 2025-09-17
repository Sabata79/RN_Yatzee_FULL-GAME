/**
 * headerStyles - Styles for the Header component, including layout, sections, and avatar images.
 * Used to style the app's header bar and related UI elements.
 *
 * @module styles/headerStyles
 * @author Sabata79
 * @since 2025-08-29
 */
// NOTICE: These styles are made whit section flex and flexDirection row. The styles are used in the Header.js component

import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { height, width } = Dimensions.get('window');
const isNarrow = width < 360 || height < 650;

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    height: isNarrow ? 60 : 70,
    backgroundColor: COLORS.black,
    width: '100%',
  },

  // Left slot
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,   // ennen oli 0
  },
  headerImage: {
    width: isNarrow ? 56 : 74, // fixed width for predictable size
    aspectRatio: 2,
    resizeMode: 'contain',
    marginRight: 8,
    marginLeft: -10,
  },
  energyWrap: {
    flexShrink: 1,
    maxWidth: isNarrow ? 160 : 220,
    transform: [{ scale: isNarrow ? 0.88 : 1 }],
  },

  // Center slot
  sectionCenter: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginLeft: 10,
  },
  userName: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    width: '100%',
  },
  userNamePressable: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  // Right slot (width set from JS)
  sectionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  headerAvatarImage: {
    width: isNarrow ? 46 : 60,
    height: isNarrow ? 46 : 60,
    borderRadius: isNarrow ? 23 : 30,
    marginLeft: SPACING.sm,
    resizeMode: 'cover',
  },
  beginnerAvatar: {
    width: 50,
    height: 35,
    resizeMode: 'cover',
    margin: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#4f4c4c36',
  },
  defaultUserIcon: {
    fontSize: isNarrow ? 20 : 26,
    color: 'white',
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  linkIconContainer: {
    position: 'absolute',
    top: 5,
    left: SPACING.sm,
    padding: 2,
    borderRadius: 40,
    borderColor: '#4c4949',
    borderWidth: 1,
    backgroundColor: '#000000ba',
  },
  beginnerLinkIconContainer: {
    position: 'absolute',
    top: -5,
    left: -5,
    padding: 2,
    borderRadius: 40,
    borderColor: '#4c4949',
    borderWidth: 1,
    backgroundColor: '#000000ba',
  },
});

export default headerStyles;
