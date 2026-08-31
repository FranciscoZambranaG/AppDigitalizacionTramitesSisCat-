import * as DocumentPicker from 'expo-document-picker';

// Reemplaza a @react-native-documents/picker.
export const abrirSelectorArchivo = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      console.log('[archivo] Seleccion cancelada por el usuario');
      return null;
    }

    const file = result.assets?.[0];
    if (!file || !file.uri || !file.name) {
      console.warn('[archivo] Archivo invalido o sin URI');
      return null;
    }

    // Validar extension manualmente
    const extension = file.name.split('.').pop()?.toLowerCase();
    const extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'dwx'];

    if (!extensionesPermitidas.includes(extension)) {
      console.warn(`[archivo] Tipo no permitido: .${extension}`);
      return null;
    }

    console.log(`[archivo] Seleccionado: ${file.name}`);
    return { uri: file.uri, name: file.name, type: file.mimeType, size: file.size };
  } catch (err) {
    console.error('[archivo] Error en selector:', err);
    return null;
  }
};
