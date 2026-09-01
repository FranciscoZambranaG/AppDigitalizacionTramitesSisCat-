// Paleta institucional GAMC. Los tokens del sistema de diseño viven en theme.js;
// este archivo se mantiene por compatibilidad con imports existentes y mapea las
// claves antiguas a la nueva paleta.
import { palette } from './theme';

export const colors = {
  background: palette.background,       // #F0F1F3 gris muy claro
  primary: palette.primary,             // #47B4D8 celeste principal
  primaryDeep: palette.primaryDeep,     // #009ED0
  darkText: palette.textPrimary,        // #111111
  lightText: palette.textSecondary,     // #6B6B6F
  button: palette.surfaceDark,          // #000000 (botón primario pill negro)
  error: palette.error,                 // #AE1857
  white: palette.surface,               // #FFFFFF
  inputBackground: palette.surface,     // #FFFFFF
  border: palette.border,               // #E4E4E7
  secondary: palette.secondary,         // #341A67
  secondaryLight: palette.secondaryLight,
  textOnDark: palette.textOnDark,
};

export default colors;
