import { StyleSheet } from 'react-native';
import { colors } from '../../../utils/colors';

export const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(77, 76, 76, 0.38)', // ← Sombra oscura encima del fondo
  },
  logoWrapper: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.primary, // Naranja institucional
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#1d5c4b',
    textShadowOffset: { width: 0.1, height: 0.1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  swipeText: {
    marginTop: 40,
    fontSize: 12,
    color: '#f8f8f8',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
