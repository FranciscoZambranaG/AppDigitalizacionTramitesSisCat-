import * as FileSystem from 'expo-file-system/legacy';

// Reemplaza a react-native-fs. Trabaja sobre el sandbox de la app:
// FileSystem.documentDirectory (equivalente a DocumentDirectoryPath).
//
// Los documentos/paginas escaneadas se guardan en una subcarpeta POR USUARIO
// (id de Keycloak) dentro del sandbox -- si no, en un telefono compartido
// entre varias personas (visto en la practica: alguien probo la app con las
// credenciales de un companero) todos ven los archivos de todos, porque el
// sandbox del dispositivo no sabe nada de sesiones de Keycloak por si solo.
// AuthProvider llama a `setCurrentUser` al iniciar/cerrar sesion.
let currentUserId = null;
const setCurrentUser = (id) => {
  currentUserId = id ? String(id).replace(/[^a-zA-Z0-9_-]/g, '_') : null;
};

// Sin usuario logueado (arranque de la app, o justo despues de un logout) no
// deberia haber pantallas leyendo/escribiendo archivos -- si igual pasa, se
// cae a una carpeta separada en vez de a la raiz del sandbox, para no
// mezclarla por accidente con la de un usuario real.
const ROOT = FileSystem.documentDirectory;
const getDir = () => `${ROOT}usuarios/${currentUserId || '_sin_sesion'}/`;

const ensureDir = async (dir) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

// Devuelve una lista de "entradas" con una forma compatible con la que
// entregaba readDir() de react-native-fs: { name, path, uri, size, isFile() }.
const getAll = async () => {
  try {
    const dir = getDir();
    await ensureDir(dir);
    const names = await FileSystem.readDirectoryAsync(dir);
    const entries = await Promise.all(
      names.map(async (name) => {
        const uri = dir + name;
        let info = {};
        try {
          info = await FileSystem.getInfoAsync(uri, { size: true });
        } catch (e) {
          info = {};
        }
        const isDirectory = Boolean(info.isDirectory);
        return {
          name,
          path: uri,
          uri,
          size: info.size ?? 0,
          mtime: info.modificationTime ?? 0,
          isFile: () => !isDirectory,
          isDirectory: () => isDirectory,
        };
      }),
    );
    console.log(`Apuntando a: ${dir}`);
    return entries;
  } catch (err) {
    console.error('[fileServices] Error al obtener todos los archivos:', err);
    return [];
  }
};

const getItem = async (file) => {
  try {
    return await FileSystem.readDirectoryAsync(getDir() + file);
  } catch (err) {
    console.error('[fileServices] Error al obtener el archivo:', err);
    return [];
  }
};

const exists = async (filePath) => {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists;
  } catch (err) {
    return false;
  }
};

const getSizeInMB = async (filePath) => {
  try {
    const stats = await FileSystem.getInfoAsync(filePath, { size: true });
    return (stats.size ?? 0) / (1024 * 1024);
  } catch (error) {
    console.error('[fileServices] Error al obtener tamano del archivo:', error);
    return 0;
  }
};

// Copia un PDF ya generado al documentDirectory con nombre unico.
const createPDF = async (filePath) => {
  try {
    const dir = getDir();
    await ensureDir(dir);
    const destinationPath = `${dir}documento_${Date.now()}.pdf`;
    await FileSystem.copyAsync({ from: filePath, to: destinationPath });
    const pdfSize = await getSizeInMB(destinationPath);
    console.log(`PDF guardado en: ${destinationPath} (${pdfSize.toFixed(2)} MB)`);
    return destinationPath;
  } catch (err) {
    console.error('[fileServices] Error al crear PDF:', err);
    throw err;
  }
};

// Copia un archivo cualquiera manteniendo su extension original.
const copyOriginalFile = async (filePath, fileName) => {
  try {
    const dir = getDir();
    await ensureDir(dir);
    const extension = fileName.split('.').pop().toLowerCase();
    const destinationPath = `${dir}archivo_${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: filePath, to: destinationPath });
    const fileSize = await getSizeInMB(destinationPath);
    console.log(`Archivo guardado en: ${destinationPath} (${fileSize.toFixed(2)} MB)`);
    return destinationPath;
  } catch (err) {
    console.error('[fileServices] Error al copiar archivo original:', err);
    throw err;
  }
};

// Carpeta (dentro de la carpeta del usuario) donde se guardan las imagenes
// JPEG de cada pagina escaneada. Va en subcarpeta para que no aparezcan en la
// lista de documentos (getAll -> getFiles filtra solo archivos del nivel raiz).
const getPagesDir = () => `${getDir()}paginas/`;

// Prefijo de las paginas de un PDF: "documento_123.pdf" -> "documento_123__"
const pagePrefix = (pdfFileName) => `${pdfFileName.replace(/\.pdf$/i, '')}__p`;

// Copia las imagenes JPEG de las paginas escaneadas al sandbox y devuelve sus rutas.
// Estas imagenes quedan disponibles para el modelo de IA que se integrara mas adelante.
const savePages = async (imageUris = [], pdfFileName) => {
  if (!Array.isArray(imageUris) || imageUris.length === 0) return [];
  const pagesDir = getPagesDir();
  await ensureDir(pagesDir);
  const saved = [];
  for (let i = 0; i < imageUris.length; i++) {
    const dest = `${pagesDir}${pagePrefix(pdfFileName)}${i + 1}.jpg`;
    try {
      await FileSystem.copyAsync({ from: imageUris[i], to: dest });
      saved.push(dest);
    } catch (err) {
      console.error('[fileServices] Error al guardar pagina:', err);
    }
  }
  return saved;
};

// Devuelve las rutas de las imagenes JPEG asociadas a un PDF.
const getPages = async (pdfFileName) => {
  try {
    const pagesDir = getPagesDir();
    const info = await FileSystem.getInfoAsync(pagesDir);
    if (!info.exists) return [];
    const names = await FileSystem.readDirectoryAsync(pagesDir);
    const prefix = pagePrefix(pdfFileName);
    return names
      .filter((n) => n.startsWith(prefix))
      .sort()
      .map((n) => pagesDir + n);
  } catch (err) {
    console.error('[fileServices] Error al listar paginas:', err);
    return [];
  }
};

// Elimina las imagenes JPEG asociadas a un PDF.
const deletePages = async (pdfFileName) => {
  const pages = await getPages(pdfFileName);
  await Promise.all(
    pages.map((p) => FileSystem.deleteAsync(p, { idempotent: true })),
  );
};

const eliminateFile = async (filePath) => {
  try {
    const fileExists = await exists(filePath);
    if (!fileExists) {
      throw new Error('El archivo no existe en la ruta especificada');
    }
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    return { success: true };
  } catch (error) {
    console.error('[fileServices] Error al eliminar archivo:', error);
    throw error;
  }
};

export default {
  setCurrentUser,
  getAll,
  getItem,
  exists,
  createPDF,
  eliminateFile,
  copyOriginalFile,
  savePages,
  getPages,
  deletePages,
};
