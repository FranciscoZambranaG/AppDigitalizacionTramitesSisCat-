// Puente imperativo entre scanService (modulo plano, sin JSX) y el modal de
// recorte <PhotoCropModal /> montado una sola vez en App.js. scanService llama
// a openPhotoCrop(uri) y espera la foto recortada (o null si el usuario
// cancela); App.js registra el "opener" real cuando monta el modal.
let opener = null;

export function setPhotoCropOpener(fn) {
  opener = fn;
}

// Si el modal todavia no esta montado (no deberia pasar en uso normal),
// se devuelve la foto tal cual para no romper el flujo de escaneo.
export function openPhotoCrop(uri) {
  if (!opener) return Promise.resolve(uri);
  return opener(uri);
}
