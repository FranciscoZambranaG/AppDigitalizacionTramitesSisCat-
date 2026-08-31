import Constants from 'expo-constants';

// Reemplaza a react-native-config.
// Prioridad: variable EXPO_PUBLIC_* (build/CI) -> app.json "extra" -> valor por defecto.
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const FALLBACK_URL = 'https://bkdgd.catastrocbba.com';

const DEFAULT_ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed',
  'application/octet-stream',
].join(',');

export const URL_BASE = (
  process.env.EXPO_PUBLIC_URL_BASE ||
  extra.URL_BASE ||
  FALLBACK_URL
).replace(/\/+$/, '');

export const ALLOWED_FILE_TYPES =
  process.env.EXPO_PUBLIC_ALLOWED_FILE_TYPES ||
  extra.ALLOWED_FILE_TYPES ||
  DEFAULT_ALLOWED_FILE_TYPES;

export default { URL_BASE, ALLOWED_FILE_TYPES };
