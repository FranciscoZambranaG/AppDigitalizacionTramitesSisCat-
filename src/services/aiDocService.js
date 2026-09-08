import * as FileSystem from 'expo-file-system/legacy';
import { AI_BACKEND_URL } from '../config/env';
import { redimensionarImagen } from '../utils/redimensionarImagen';

// scanService.js no redimensiona las fotos (quedan a resolucion completa de
// camara, miles de px de ancho). Mandarlas asi de pesadas al modelo de IA es
// lento y, con mas de una imagen junta, hace que Ollama se quede sin memoria
// a mitad de camino (probado: 3 fotos completas tumbaron el proceso). 1600px
// de ancho alcanza de sobra para que la IA lea texto/sellos/tablas.
const MAX_IMAGE_WIDTH = 1600;

// Cliente del backend de IA (server/ en la raiz del repo). Ese backend es el
// unico lugar que habla con la API de Anthropic -- la app solo le manda las
// paginas escaneadas (base64) y una pregunta/tipo.

// Con AI_PROVIDER=ollama (qwen3-vl:2b) clasificar/responder tarda ~12-35s con
// el modelo caliente, pero el PRIMER pedido despues de arrancar (o si Ollama
// descargo el modelo) puede pasar del minuto. El server ahora hace warmup +
// keep_alive, pero se deja margen igual. Si el celular corta antes que esto,
// el error nativo es "network connection lost" / "fetch canceled".
const TIMEOUT_MS = 180000;

async function postJson(path, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${AI_BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    // AbortError (timeout nuestro) vs error de red real: mensajes distintos
    // para que el usuario sepa si reintentar o revisar la conexion.
    if (err.name === 'AbortError') {
      throw new Error(
        'El modelo está tardando demasiado en responder. Suele pasar en el primer intento; ' +
          'probá de nuevo en unos segundos.',
      );
    }
    throw new Error(
      `No me pude conectar al backend de IA (${AI_BACKEND_URL}). Revisá que el server esté ` +
        'corriendo y que el celular esté en la misma red.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const mensaje = data.error || `El servidor respondió con estado ${res.status}`;
    // data.detalle trae la razon tecnica real (ver server/src/routes/*.js).
    throw new Error(data.detalle ? `${mensaje} (${data.detalle})` : mensaje);
  }
  return data;
}

// Redimensiona (si hace falta) y convierte URIs de archivo (file://...) a
// strings base64 sin el prefijo "data:image/...;base64,", que es lo que
// espera el backend.
async function imagesToBase64(imageUris) {
  return Promise.all(
    imageUris.map(async (uri) => {
      const { uri: uriChica } = await redimensionarImagen(uri, { maxSize: MAX_IMAGE_WIDTH });
      return FileSystem.readAsStringAsync(uriChica, { encoding: FileSystem.EncodingType.Base64 });
    }),
  );
}

// GET /api/catalog -- catalogo de tipos de documento + preguntas preescritas.
async function getCatalog() {
  const res = await fetch(`${AI_BACKEND_URL}/api/catalog`);
  if (!res.ok) throw new Error(`El servidor respondio con estado ${res.status}`);
  const data = await res.json();
  return data.tipos;
}

// Clasifica el tipo de documento a partir de las paginas escaneadas.
async function classifyDocument(imageUris) {
  const images = await imagesToBase64(imageUris);
  return postJson('/api/classify', { images });
}

// Responde una pregunta preescrita sobre el documento ya clasificado.
async function askQuestion(imageUris, tipo, pregunta) {
  const images = await imagesToBase64(imageUris);
  const { respuesta } = await postJson('/api/answer', { images, tipo, pregunta });
  return respuesta;
}

// NOTA: la extraccion de la tabla "RELACION DE SUPERFICIE" y el Excel de Hoja2
// se movieron al modulo "Resoluciones" (apartado propio en la app -> subir; y
// la web para el OCR/Excel). Ya no se hacen desde aca. Las rutas
// /api/hoja2/* del server de Node quedan sin uso y se van a quitar.

export default { getCatalog, classifyDocument, askQuestion };
