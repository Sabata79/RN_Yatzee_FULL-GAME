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
import { getBreakpoints, makeSizes, pick } from '../utils/breakpoints';

const { height, width } = Dimensions.get('window');
const isNarrow = width < 360 || height < 650;
const S = makeSizes(getBreakpoints());
const bp = getBreakpoints();


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
    // size to content; avoid forcing a large minimum width which breaks centering
    flexShrink: 0,
    paddingRight: 6,
  },
  headerImage: {
    width: isNarrow ? 56 : 74,
    aspectRatio: 2,
    resizeMode: 'contain',
    marginRight: 8,
    marginLeft: -10,
  },
  energyWrap: {
    flexShrink: 1,
    maxWidth: isNarrow ? 140 : 200,
    transform: [{ scale: isNarrow ? 0.88 : 1 }],
    // prefer intrinsic width but cap with maxWidth
    width: undefined,
  },

  // Center slot
  sectionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 0,
  },
  userName: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
    fontSize: isNarrow ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    // let text size naturally; component sets numberOfLines and ellipsizeMode
    maxWidth: '100%',
  },
  userNamePressable: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: SPACING.sm,
  },

  headerAvatarImage: {
    width: S.AVATAR,
    height: S.AVATAR,
    borderRadius: S.AVATAR / 2,
    marginLeft: SPACING.sm,
    resizeMode: 'cover',
  },
  beginnerAvatar: {
    width: 50,
    height: 35,
    resizeMode: 'cover',
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4f4c4c36',
  },
  defaultUserIcon: {
    fontSize: S.ICON,
    color: 'white',
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  linkIconContainer: {
    position: 'absolute',
    top: 4,
    left: -6,
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
