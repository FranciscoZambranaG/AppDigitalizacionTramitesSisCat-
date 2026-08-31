// services/scanService.js
// Reemplaza a react-native-document-scanner-plugin.
//
// Expo Go no incluye un escaner nativo con deteccion de bordes. Aqui se usa la
// camara del sistema (expo-image-picker) para capturar una o varias paginas.
// El recorte automatico de bordes NO esta disponible en este modo; el usuario
// encuadra manualmente cada foto.
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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
        allowsEditing: true, // permite recorte manual basico
        exif: false,
      });

      if (result.canceled || !result.assets?.length) {
        continuar = false;
        break;
      }

      paginas.push(result.assets[0].uri);
      continuar = await preguntarOtraPagina();
    }

    console.log('Imagenes escaneadas:', paginas);
    return paginas;
  } catch (error) {
    console.log('[scanService] error', error);
    return [];
  }
};

export default { getScan };
