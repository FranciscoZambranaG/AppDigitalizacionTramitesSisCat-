import { URL_BASE } from '../config/env';

// Antes leia de react-native-config; ahora sale de src/config/env.js (expo-constants).
const baseUrl = URL_BASE;

console.log('URL base del backend:', baseUrl);

export default baseUrl;
