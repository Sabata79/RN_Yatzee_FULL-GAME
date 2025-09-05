/**
 * headerStyles - Styles for the Header component, including layout, sections, and avatar images.
 * Used to style the app's header bar and related UI elements.
 *
 * @module styles/headerStyles
 * @author Sabata79
 * @since 2025-08-29
 */
// NOTICE: These styles are made whit section flex and flexDirection row. The styles are used in the Header.js component

import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { height, width } = Dimensions.get('window');
const isSmallScreen = height < 650;
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    height: isSmallScreen ? 50 : height * 0.1,
    backgroundColor: COLORS.black,
    marginTop: statusBarHeight,
    overflow: 'hidden',
    marginTop: 0,
    position: 'relative',
  },
  section3: {
    width: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  section2: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    left: -95,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 2,
  },
  section3: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section4: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : width * 0.05,
    alignSelf: 'center',
    fontFamily: 'AntonRegular',
    color: COLORS.textLight,
  },
  headerImage: {
    alignSelf: 'flex-start',
    height: 50,
    width: undefined,
    aspectRatio: 3,
    marginLeft: -36,
    resizeMode: 'contain',
  },
  userName: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    position: 'absolute',
    left: '50%',
    top: 33,
    textAlign: 'center',
    width: 85, 
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
  },
  headerAvatarImage: {
    width: isSmallScreen ? 50 : 60,
    height: isSmallScreen ? 50 : 60,
    borderRadius: isSmallScreen ? 25 : 30,
    marginLeft: SPACING.sm,
    marginTop: SPACING.sm,
    resizeMode: 'cover',
  },
  beginnerAvatar: {
    borderRadius: 0,
    width: 50,
    height: 35,
    resizeMode: 'cover',
    margin: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#4f4c4c36',
  },
  defaultUserIcon: {
    fontSize: isSmallScreen ? 20 : 26,
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
