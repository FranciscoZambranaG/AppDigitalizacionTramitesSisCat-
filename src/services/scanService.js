// services/scanService.js
// Reemplaza a react-native-document-scanner-plugin.
//
// Expo Go no incluye un escaner nativo con deteccion de bordes. Aqui se usa la
// camara del sistema (expo-image-picker) para capturar una o varias paginas.
// El recorte NO se deja en manos del "allowsEditing" de expo-image-picker: en
// iOS ese recorte SIEMPRE es un cuadrado (limitacion documentada de
// UIImagePickerController) y en Android varia segun el fabricante, y en
// ambos casos termina cortando parte de la tabla escaneada. En su lugar se
// captura la foto completa y se abre <PhotoCropModal /> (montado en App.js),
// donde el usuario ajusta el recorte arrastrando las 4 esquinas.
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { openPhotoCrop } from '../utils/photoCropController';

const preguntarOtraPagina = () =>
  new Promise((resolve) => {
    Alert.alert(
      'Escaneo de documento',
      'Pagina agregada. Desea escanear otra pagina?',
      [
        { text: 'No, finalizar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Si, otra pagina', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });

const getScan = async () => {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la camara para escanear.');
      return [];
    }

    const paginas = [];
    let continuar = true;

    while (continuar) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false, // el recorte se hace en la app (ver PhotoCropModal)
        exif: false,
      });

      if (result.canceled || !result.assets?.length) {
        continuar = false;
        break;
      }

      const recortada = await openPhotoCrop(result.assets[0].uri);
      if (recortada) {
        paginas.push(recortada);
        continuar = await preguntarOtraPagina();
      } else {
        continuar = true; // el usuario descarto el recorte: se vuelve a tomar la foto
      }
    }

    console.log('Imagenes escaneadas:', paginas);
    return paginas;
  } catch (error) {
    console.log('[scanService] error', error);
    return [];
  }
};

export default { getScan };
