// services/resolucionesService.js
// Cliente del backend del modulo Resoluciones. El movil solo CREA (sube las
// paginas escaneadas + N de resolucion + nombre) y LISTA las del usuario. El
// OCR de la tabla y la generacion del Excel se hacen desde la web.
import erpHttp from '../api/erpHttp';

// POST /api/resoluciones  (multipart)
// pageUris: string[] de file:// (JPEG ya redimensionadas por ResolucionesScreen)
async function crear({ nroResolucion, nombre, pageUris }) {
  const form = new FormData();
  form.append('nro_resolucion', nroResolucion);
  form.append('nombre', nombre);
  pageUris.forEach((uri, i) => {
    // En React Native, FormData acepta { uri, name, type } para adjuntar un archivo.
    form.append('paginas', { uri, name: `pagina_${i + 1}.jpg`, type: 'image/jpeg' });
  });

  // No fijamos Content-Type: axios/RN le pone el boundary del multipart solo.
  const { data } = await erpHttp.post('/api/resoluciones', form);
  return data; // { id_resolucion, nro_resolucion, nombre, estado, total_paginas, ... }
}

// GET /api/resoluciones -> resumen de las resoluciones del usuario autenticado
async function listar() {
  const { data } = await erpHttp.get('/api/resoluciones');
  return data; // [{ id_resolucion, nro_resolucion, nombre, estado, total_paginas, fecha_creacion, ... }]
}

export default { crear, listar };
