import * as LocalAuthentication from 'expo-local-authentication';

// Reemplaza a react-native-biometrics.
export const biometriaDisponible = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return {
      available: hasHardware && enrolled,
      hasHardware,
      enrolled,
      error: !hasHardware
        ? 'BIOMETRIC_ERROR_NO_HARDWARE'
        : !enrolled
        ? 'BIOMETRIC_ERROR_NONE_ENROLLED'
        : null,
    };
  } catch (err) {
    return { available: false, hasHardware: false, enrolled: false, error: String(err) };
  }
};

// promptMessage: texto que se muestra en el dialogo del sistema.
// Con disableDeviceFallback=false el usuario puede usar PIN/Patron del dispositivo.
export const autenticarBiometrico = async (
  promptMessage = 'Identifiquese para ingresar',
) => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar codigo del dispositivo',
    disableDeviceFallback: false,
  });
  return result; // { success: boolean, error?: string, warning?: string }
};

export default { biometriaDisponible, autenticarBiometrico };
