import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Modal, View, Image, Text, TouchableOpacity, PanResponder, StyleSheet, Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius } from '../utils/theme';

const HANDLE_SIZE = 30;
const MIN_BOX = 60; // tamaño minimo del recorte, en pixeles de la vista previa

function getImageSize(uri) {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

// Las fotos de camara traen la orientacion "correcta" solo como metadato EXIF
// (el sensor graba siempre en el mismo sentido; el celular marca "rotar 90"
// para mostrarla derecha). Image.getSize() SI respeta ese EXIF -> devuelve el
// tamaño ya derecho, pero el crop de expo-image-manipulator opera sobre el
// buffer crudo SIN rotar -> si se recorta usando las coordenadas de la
// vista previa (basadas en el tamaño ya derecho), el recorte sale desfasado y
// el contenido termina rotado 90°. Se normaliza una vez acá (un resize fuerza
// a decodificar + re-codificar ya derecha, sin EXIF) y de ahi en mas se
// muestra y se recorta siempre esa misma copia normalizada.
async function normalizarOrientacion(uri) {
  const { width } = await getImageSize(uri);
  if (!width) return uri;
  const normalizada = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return normalizada.uri;
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Modal de recorte manual: reemplaza el "allowsEditing" de expo-image-picker,
// que en iOS SIEMPRE recorta a un cuadrado (y en Android es poco confiable
// segun el fabricante) y termina cortando datos de la tabla escaneada. Aca el
// recuadro arranca cubriendo toda la foto (no se pierde nada por defecto) y
// el usuario puede arrastrar cada una de las 4 esquinas para ajustarlo.
//
// Nota: esto NO hace correccion de perspectiva (no endereza una foto tomada
// en angulo) porque expo-image-manipulator solo recorta rectangulos rectos y,
// al estar en Expo Go, no hay modulo nativo de vision por computadora
// disponible para eso.
const PhotoCropModal = forwardRef((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [uri, setUri] = useState(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

  const resolveRef = useRef(null);
  const boxRef = useRef(box);
  const previewSizeRef = useRef(previewSize);
  const boxStartRef = useRef(box);

  useEffect(() => {
    boxRef.current = box;
  }, [box]);
  useEffect(() => {
    previewSizeRef.current = previewSize;
  }, [previewSize]);

  const cerrar = (resultUri) => {
    setVisible(false);
    setUri(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    if (resolve) resolve(resultUri);
  };

  useImperativeHandle(ref, () => ({
    open: (imageUri) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        normalizarOrientacion(imageUri).then(async (uriDerecha) => {
          const size = await getImageSize(uriDerecha);
          const win = Dimensions.get('window');
          const availW = win.width - spacing.xl * 2;
          const availH = win.height * 0.6;
          const ratio = size.height > 0 ? size.width / size.height : 1;
          let pw = availW;
          let ph = pw / ratio;
          if (ph > availH) {
            ph = availH;
            pw = ph * ratio;
          }
          const initialBox = { left: 0, top: 0, right: pw, bottom: ph };
          setImgSize(size);
          setPreviewSize({ width: pw, height: ph });
          setBox(initialBox);
          setUri(uriDerecha);
          setVisible(true);
        });
      }),
  }));

  // Un PanResponder por esquina: cada uno mueve solo los dos bordes que le
  // corresponden, manteniendo siempre un rectangulo (no un cuadrilatero
  // libre, porque el recorte final es un rectangulo recto).
  const useCornerPanResponder = (corner) =>
    useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          boxStartRef.current = boxRef.current;
        },
        onPanResponderMove: (_evt, gesture) => {
          const start = boxStartRef.current;
          const pw = previewSizeRef.current.width;
          const ph = previewSizeRef.current.height;
          const next = { ...start };
          if (corner === 'tl' || corner === 'bl') {
            next.left = clamp(start.left + gesture.dx, 0, start.right - MIN_BOX);
          }
          if (corner === 'tr' || corner === 'br') {
            next.right = clamp(start.right + gesture.dx, start.left + MIN_BOX, pw);
          }
          if (corner === 'tl' || corner === 'tr') {
            next.top = clamp(start.top + gesture.dy, 0, start.bottom - MIN_BOX);
          }
          if (corner === 'bl' || corner === 'br') {
            next.bottom = clamp(start.bottom + gesture.dy, start.top + MIN_BOX, ph);
          }
          setBox(next);
        },
      }),
    ).current;

  const tlResponder = useCornerPanResponder('tl');
  const trResponder = useCornerPanResponder('tr');
  const blResponder = useCornerPanResponder('bl');
  const brResponder = useCornerPanResponder('br');

  const restablecer = () => {
    setBox({ left: 0, top: 0, right: previewSize.width, bottom: previewSize.height });
  };

  const confirmar = async () => {
    const esFotoCompleta =
      box.left <= 1 && box.top <= 1 && box.right >= previewSize.width - 1 && box.bottom >= previewSize.height - 1;

    if (esFotoCompleta) {
      cerrar(uri);
      return;
    }

    const scaleX = imgSize.width / previewSize.width;
    const scaleY = imgSize.height / previewSize.height;
    const rect = {
      originX: clamp(Math.round(box.left * scaleX), 0, imgSize.width - 1),
      originY: clamp(Math.round(box.top * scaleY), 0, imgSize.height - 1),
      width: Math.max(1, Math.round((box.right - box.left) * scaleX)),
      height: Math.max(1, Math.round((box.bottom - box.top) * scaleY)),
    };

    try {
      const result = await ImageManipulator.manipulateAsync(uri, [{ crop: rect }], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      cerrar(result.uri);
    } catch (e) {
      console.log('[PhotoCropModal] error al recortar', e);
      cerrar(uri); // si falla el recorte, se usa la foto sin recortar
    }
  };

  const cancelar = () => cerrar(null);

  if (!visible) return null;

  const handles = [
    { key: 'tl', x: box.left, y: box.top, responder: tlResponder },
    { key: 'tr', x: box.right, y: box.top, responder: trResponder },
    { key: 'bl', x: box.left, y: box.bottom, responder: blResponder },
    { key: 'br', x: box.right, y: box.bottom, responder: brResponder },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancelar}>
      <View style={styles.backdrop}>
        <Text style={styles.titulo}>Ajustá el recorte</Text>
        <Text style={styles.hint}>Arrastrá cada esquina para encuadrar la tabla. Por defecto se usa la foto entera.</Text>

        <View style={[styles.previewWrap, { width: previewSize.width, height: previewSize.height }]}>
          <Image
            source={{ uri }}
            style={{ width: previewSize.width, height: previewSize.height }}
            resizeMode="contain"
          />
          <View
            pointerEvents="none"
            style={[
              styles.cropBox,
              {
                left: box.left,
                top: box.top,
                width: box.right - box.left,
                height: box.bottom - box.top,
              },
            ]}
          />
          {handles.map((h) => (
            <View
              key={h.key}
              {...h.responder.panHandlers}
              style={[styles.handle, { left: h.x - HANDLE_SIZE / 2, top: h.y - HANDLE_SIZE / 2 }]}>
              <View style={styles.handleDot} />
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={cancelar}>
            <Icon name="x" size={18} color={palette.textOnDark} />
            <Text style={styles.secondaryBtnText}>Descartar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={restablecer}>
            <Icon name="maximize" size={18} color={palette.textOnDark} />
            <Text style={styles.secondaryBtnText}>Foto entera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={confirmar}>
            <Icon name="check" size={18} color={palette.textOnDark} />
            <Text style={styles.primaryBtnText}>Usar foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  titulo: { ...typography.h2, color: palette.textOnDark, marginBottom: spacing.xs, textAlign: 'center' },
  hint: {
    ...typography.caption,
    color: palette.primaryLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  previewWrap: { backgroundColor: '#000' },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: palette.primary,
    backgroundColor: 'rgba(71, 180, 216, 0.12)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleDot: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.textOnDark,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.textOnDark,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: { ...typography.caption, color: palette.textOnDark, fontFamily: typography.button.fontFamily },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryDeep,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  primaryBtnText: { ...typography.button, color: palette.textOnDark, fontSize: 15 },
});

export default PhotoCropModal;
