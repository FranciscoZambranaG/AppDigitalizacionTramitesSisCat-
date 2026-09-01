import { StyleSheet } from 'react-native';
import { palette, typography, spacing, radius, shadow, fonts } from '../../../utils/theme';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: palette.background,
  },

  logo: {
    width: 160,
    height: 70,
    borderRadius: 65,
  },
  logoWrapper: {
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    padding: spacing.md,
    ...shadow.soft,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.h1,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    ...shadow.soft,
  },

  icon: {
    marginRight: spacing.md,
    color: palette.textSecondary,
  },

  input: {
    flex: 1,
    height: 52,
    color: palette.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
  },

  eyeButton: {
    padding: spacing.sm,
  },

  loginButton: {
    alignSelf: 'stretch',
    maxWidth: 400,
    width: '100%',
    backgroundColor: palette.primaryDeep,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    paddingHorizontal: 32,
    paddingVertical: 17,
    ...shadow.soft,
  },

  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    ...typography.button,
    color: palette.textOnDark,
  },

  errorText: {
    ...typography.caption,
    color: palette.error,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },

  generalError: {
    ...typography.caption,
    color: palette.error,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  footerContainer: {
    marginTop: spacing.xxl + spacing.lg,
    alignItems: 'center',
  },

  footerNote: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
