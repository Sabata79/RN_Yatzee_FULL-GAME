import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accentLight,
    borderWidth: 3,
    borderRadius: 5,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '80%',
    alignSelf: 'center',
    zIndex: 1,
    height: 68,
  },
  shadowLayer: {
    position: 'absolute',
    top: SPACING.xxs,
    left: '11%',
    width: '80%',
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.635)',
    borderRadius: 7,
    zIndex: 1,
  },
  iconContainer: {
    marginRight: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    color: '#222',
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xl,
  },
});

export default styles;
