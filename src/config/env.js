import Constants from 'expo-constants';

// Reemplaza a react-native-config.
// Prioridad: variable EXPO_PUBLIC_* (build/CI) -> app.json "extra" -> valor por defecto.
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const FALLBACK_URL = 'https://bkdgd.catastrocbba.com';
const FALLBACK_OCR_URL = 'https://ocr.catastrocbba.com/ocr/';
// Servidor de Ollama corriendo localmente en la red del desarrollador
// (OLLAMA_HOST=0.0.0.0). Cambiar via EXPO_PUBLIC_OLLAMA_URL cuando la IP cambie.
const FALLBACK_OLLAMA_URL = 'http://10.0.0.113:11434';

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

// URL del modelo de vision / OCR (PaddleOCR). Termina con "/".
export const PADDLE_OCR_URL = (
  process.env.EXPO_PUBLIC_PADDLE_OCR_URL ||
  extra.PADDLE_OCR_URL ||
  FALLBACK_OCR_URL
).replace(/\/*$/, '/');

// URL base del servidor de Ollama. Sin "/" al final.
export const OLLAMA_URL = (
  process.env.EXPO_PUBLIC_OLLAMA_URL ||
  extra.OLLAMA_URL ||
  FALLBACK_OLLAMA_URL
).replace(/\/+$/, '');

// Nombre exacto del modelo cargado en Ollama.
const FALLBACK_OLLAMA_MODEL = 'qwen3-vl:4b';

export const OLLAMA_MODEL =
  process.env.EXPO_PUBLIC_OLLAMA_MODEL ||
  extra.OLLAMA_MODEL ||
  FALLBACK_OLLAMA_MODEL;

export default { URL_BASE, ALLOWED_FILE_TYPES, PADDLE_OCR_URL, OLLAMA_URL, OLLAMA_MODEL };
