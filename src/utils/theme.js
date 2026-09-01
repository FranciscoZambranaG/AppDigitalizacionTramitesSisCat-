// ============================================================================
// SISTEMA DE DISEÑO — GAMC (Alcaldía de Cochabamba)
// Tokens centrales de tema. SOLO estilos visuales.
// Import: `import { palette, typography, spacing, radius, shadow, components } from '../utils/theme';`
// (colors.js sigue funcionando: re-exporta desde aquí para no romper imports viejos.)
// ============================================================================

// --- 1. Paleta institucional --------------------------------------------------
export const palette = {
  primary: '#47B4D8',        // celeste principal
  primaryLight: '#A8DAED',   // celeste claro
  primaryDeep: '#009ED0',    // cian profundo
  secondary: '#341A67',      // púrpura oscuro
  secondaryLight: '#584291', // púrpura medio

  background: '#F0F1F3',     // fondo general de pantallas
  surface: '#FFFFFF',        // tarjetas / elementos elevados
  surfaceDark: '#000000',    // tarjetas "hero" y botón primario

  textPrimary: '#111111',
  textSecondary: '#6B6B6F',  // subtítulos y texto de apoyo
  textOnDark: '#FFFFFF',
  border: '#E4E4E7',         // bordes sutiles

  error: '#AE1857',          // se conserva para usos existentes
  danger: '#E74C3C',         // acciones destructivas (Eliminar)
};

// --- 2. Tipografía ----------------------------------------------------------
// Poppins (redondeada, geométrica, bold en títulos) vía @expo-google-fonts/poppins.
// Se carga en App.js con useFonts. Fallback: fuente del sistema.
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: palette.textPrimary },
  h2: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 27, color: palette.textPrimary },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: palette.textPrimary },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: palette.textPrimary },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: palette.textSecondary },
  button: { fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.3 },
};

// --- 3. Espaciado ---------------------------------------------------------
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// --- 4. Radios ----------------------------------------------------------
export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  card: 24,
  cardHero: 32,
  pill: 999,
};

// --- 5. Sombras (sutiles, sin bordes duros) -------------------------------
export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
};

// --- 6. Recetas de componentes reutilizables ----------------------------
export const components = {
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    padding: spacing.xxl,
    ...shadow.soft,
  },
  cardHero: {
    backgroundColor: palette.surfaceDark,
    borderRadius: radius.cardHero,
    padding: spacing.xxl,
  },
  // Botón primario del sistema: pill en celeste institucional (primaryDeep), texto blanco.
  buttonPrimary: {
    backgroundColor: palette.primaryDeep,
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  buttonPrimaryText: {
    ...typography.button,
    color: palette.textOnDark,
  },
  // Botón secundario / inactivo: fondo claro, texto oscuro, borde sutil.
  buttonSecondary: {
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  buttonSecondaryText: {
    ...typography.button,
    color: palette.textPrimary,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.textPrimary,
  },
  // Acento institucional (secondary) bajo los títulos H1 de cada pantalla.
  titleAccent: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.secondary,
    marginBottom: spacing.sm,
  },
  // Overlay de modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.card,
  },
};

export default { palette, fonts, typography, spacing, radius, shadow, components };
