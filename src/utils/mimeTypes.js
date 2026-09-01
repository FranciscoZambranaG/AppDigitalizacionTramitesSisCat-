// Mapeo de extension -> mime type / tipo de documento.
// Usado por el visor de documentos y la lista para saber como mostrar/abrir cada archivo.
const MIME_BY_EXT = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
};

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic'];

const extensionOf = (fileName = '') => fileName.split('.').pop().toLowerCase();

export const getMimeType = (fileName) =>
  MIME_BY_EXT[extensionOf(fileName)] || 'application/octet-stream';

// 'pdf' | 'image' | 'other' — determina como se muestra en la lista y en el visor.
export const getFileKind = (fileName) => {
  const ext = extensionOf(fileName);
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'other';
};

export default { getMimeType, getFileKind };
