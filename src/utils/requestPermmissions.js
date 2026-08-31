// En Expo la app trabaja sobre su propio sandbox (FileSystem.documentDirectory),
// por lo que NO se necesita permiso de almacenamiento para listar/leer los
// archivos propios de la app. Los permisos de camara y de galeria los solicitan
// directamente expo-image-picker / expo-camera cuando hacen falta.
//
// Se mantiene la firma async y el valor true para no romper a los llamadores.
const requestStoragePermission = async () => {
  return true;
};

export default requestStoragePermission;
