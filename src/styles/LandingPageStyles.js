/**
 * LandingPageStyles - Styles for the landing page, including container, logo, progress bar, and buttons.
 * Used to style the app's landing and loading screens.
 *
 * @module styles/LandingPageStyles
 * @author Sabata79
 * @since 2025-08-29
 */
import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width, height } = Dimensions.get("window");
const isSmallScreen = height < 650;

const styles = StyleSheet.create({
  versionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: SPACING.sm,
    zIndex: 10,
  },
  versionText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.montserratLight,
    opacity: 0.9,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.accent, 
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: -140,
    flexShrink: 0,
    zIndex: 20,
    elevation: 20, 
  },
  logo: {
    width: width * 0.8,
    height: width * 0.8,
    // opacity: 0.5,
    maxWidth: 600,
    maxHeight: 600,
    marginBottom: SPACING.xs,

  },
  progressBar: {
    width: width * 0.8,
    height: 20,
    marginHorizontal: SPACING.lg,
    borderRadius: 5,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },
  progressText: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    textAlign: "center",
  },
  button: {
    backgroundColor: "gold",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 5,
    marginVertical: SPACING.xs,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    textAlign: "center",
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default styles;
