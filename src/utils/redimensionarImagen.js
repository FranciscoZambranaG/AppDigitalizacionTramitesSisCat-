import * as ImageManipulator from 'expo-image-manipulator';

// Reemplaza a react-native-image-resizer (ImageResizer.createResizedImage).
// Redimensiona el lado mayor a `maxSize` y opcionalmente rota la imagen.
export const redimensionarImagen = async (
  uri,
  { maxSize = 1800, rotation = 0, compress = 0.7 } = {},
) => {
  const actions = [];
  if (rotation) {
    actions.push({ rotate: rotation });
  }
  // Solo fijamos el ancho: expo-image-manipulator mantiene la relacion de aspecto.
  actions.push({ resize: { width: maxSize } });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result; // { uri, width, height }
};

export default redimensionarImagen;
