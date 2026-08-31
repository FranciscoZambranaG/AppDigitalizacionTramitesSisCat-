import * as FileSystem from 'expo-file-system/legacy';

// Reemplaza a react-native-fs. Trabaja sobre el sandbox de la app:
// FileSystem.documentDirectory (equivalente a DocumentDirectoryPath).
const DIR = FileSystem.documentDirectory;

// Devuelve una lista de "entradas" con una forma compatible con la que
// entregaba readDir() de react-native-fs: { name, path, uri, size, isFile() }.
const getAll = async () => {
  try {
    const names = await FileSystem.readDirectoryAsync(DIR);
    const entries = await Promise.all(
      names.map(async (name) => {
        const uri = DIR + name;
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
    console.log(`Apuntando a: ${DIR}`);
    return entries;
  } catch (err) {
    console.error('[fileServices] Error al obtener todos los archivos:', err);
    return [];
  }
};

const getItem = async (file) => {
  try {
    return await FileSystem.readDirectoryAsync(DIR + file);
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
    const destinationPath = `${DIR}documento_${Date.now()}.pdf`;
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
    const extension = fileName.split('.').pop().toLowerCase();
    const destinationPath = `${DIR}archivo_${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: filePath, to: destinationPath });
    const fileSize = await getSizeInMB(destinationPath);
    console.log(`Archivo guardado en: ${destinationPath} (${fileSize.toFixed(2)} MB)`);
    return destinationPath;
  } catch (err) {
    console.error('[fileServices] Error al copiar archivo original:', err);
    throw err;
  }
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
  getAll,
  getItem,
  exists,
  createPDF,
  eliminateFile,
  copyOriginalFile,
};
