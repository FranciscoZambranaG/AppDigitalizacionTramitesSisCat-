import Constants from 'expo-constants';

// Reemplaza a react-native-config.
// Prioridad: variable EXPO_PUBLIC_* (build/CI) -> app.json "extra" -> valor por defecto.
const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const FALLBACK_URL = 'https://bkdgd.catastrocbba.com';
const FALLBACK_OCR_URL = 'https://ocr.catastrocbba.com/ocr/';

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

// Backend propio (server/) que guarda la API key de Anthropic y expone
// clasificacion/preguntas/extraccion de documentos. La app nunca habla
// directo con la API de Anthropic. Sin "/" al final. En un celular fisico
// tiene que ser la IP de la maquina que corre `npm run dev` en server/, no
// "localhost". Esta IP cambia con la red (DHCP) -- la forma correcta de
// actualizarla es EXPO_PUBLIC_AI_BACKEND_URL en .env.local (no aca), asi no
// hace falta editar codigo cada vez. Este fallback es solo por si ese archivo
// no esta.
const FALLBACK_AI_BACKEND_URL = 'http://10.0.0.214:4000';

export const AI_BACKEND_URL = (
  process.env.EXPO_PUBLIC_AI_BACKEND_URL ||
  extra.AI_BACKEND_URL ||
  FALLBACK_AI_BACKEND_URL
).replace(/\/+$/, '');

// Backend del modulo "Resoluciones" (resoluciones/backend/, FastAPI). El movil
// solo sube ahi las paginas escaneadas + N de resolucion; el OCR y el Excel se
// hacen desde la web. Sin "/" al final. En un celular fisico = IP de la maquina
// que corre `python -m app.main` (puerto 8080), no "localhost". Se configura en
// .env.local con EXPO_PUBLIC_ERP_BACKEND_URL (cambia con la red / DHCP).
const FALLBACK_ERP_BACKEND_URL = 'http://10.0.0.214:8080';

export const ERP_BACKEND_URL = (
  process.env.EXPO_PUBLIC_ERP_BACKEND_URL ||
  extra.ERP_BACKEND_URL ||
  FALLBACK_ERP_BACKEND_URL
).replace(/\/+$/, '');

export default { URL_BASE, ALLOWED_FILE_TYPES, PADDLE_OCR_URL, AI_BACKEND_URL, ERP_BACKEND_URL };
