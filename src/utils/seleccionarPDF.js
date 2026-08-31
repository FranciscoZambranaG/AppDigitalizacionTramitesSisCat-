import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { ALLOWED_FILE_TYPES } from '../config/env';

// Reemplaza a @react-native-documents/picker + react-native-config.
export const abrirSelectorPDF = async () => {
  try {
    const types = ALLOWED_FILE_TYPES.split(',').map((t) => t.trim()).filter(Boolean);

    const result = await DocumentPicker.getDocumentAsync({
      type: types.length ? types : 'application/pdf',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      console.log('No se selecciono ningun archivo');
      return null;
    }

    const file = result.assets?.[0];
    if (!file || !file.uri) {
      console.log('Archivo invalido');
      return null;
    }

    return { uri: file.uri, name: file.name, type: file.mimeType, size: file.size };
  } catch (err) {
    console.error('Error en DocumentPicker:', err);
    Alert.alert('Error', 'No se pudo seleccionar el archivo');
    return null;
  }
};
