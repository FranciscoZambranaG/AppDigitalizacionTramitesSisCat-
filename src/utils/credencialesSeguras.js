import * as SecureStore from 'expo-secure-store';

// Reemplaza a react-native-keychain.
// Guarda usuario/clave cifrados en el almacen seguro del sistema
// (Keystore en Android / Keychain en iOS).
const KEY = 'digid_credenciales';

export const guardarCredenciales = async (username, password) => {
  const payload = JSON.stringify({ username, password });
  await SecureStore.setItemAsync(KEY, payload, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

// Devuelve { username, password } o null si no hay nada guardado.
export const obtenerCredenciales = async () => {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.log('[credenciales] error leyendo SecureStore', err);
    return null;
  }
};

export const borrarCredenciales = async () => {
  await SecureStore.deleteItemAsync(KEY);
};

export default { guardarCredenciales, obtenerCredenciales, borrarCredenciales };
