import { StyleSheet } from 'react-native';
import { colors } from '../../../utils/colors';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background, // celeste suave
  },

  logo: {
    width: 160,
    height: 70,
    borderRadius: 65,
  },
  logoWrapper: {
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
    
  

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F', // Gris azulado profesional
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary, // Puedes personalizar desde tu archivo colors.js
    paddingBottom: 6,
    lineHeight: 26,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  icon: {
    marginRight: 10,
    color: colors.lightText,
  },

  input: {
    flex: 1,
    height: 50,
    color: colors.darkText,
    fontSize: 15,
  },

  eyeButton: {
    padding: 8,
  },

  loginButton: {
    alignSelf: 'stretch',
    maxWidth: 400,
    width: '100%',
    height: 50,
    backgroundColor: colors.button,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },

  loginContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },

  generalError: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },

  footerNote: {
    fontSize: 11,
    color: colors.lightText,
    textAlign: 'center',
  },
});
