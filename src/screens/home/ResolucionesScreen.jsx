import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow, fonts } from '../../utils/theme';
import scanService from '../../services/scanService';
import { redimensionarImagen } from '../../utils/redimensionarImagen';
import resolucionesService from '../../services/resolucionesService';

const ESTADOS = {
  pendiente_ocr: { label: 'Pendiente', color: palette.warning },
  en_proceso: { label: 'En proceso', color: palette.primaryDeep },
  listo: { label: 'Listo', color: palette.success },
};

function EstadoBadge({ estado }) {
  const info = ESTADOS[estado] || { label: estado, color: palette.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: `${info.color}22` }]}>
      <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

// Pantalla "Resoluciones" (movil): SOLO captura y subida. El usuario escanea las
// paginas de una resolucion con la camara, le pone N de resolucion + nombre, y
// las sube al backend del modulo. La extraccion con OCR, la revision de la tabla
// y la generacion del Excel de Hoja2 se hacen despues DESDE LA WEB.
const ResolucionesScreen = () => {
  const navigation = useNavigation();

  const [escaneando, setEscaneando] = useState(false);
  const [pageImages, setPageImages] = useState([]);
  const [nroResolucion, setNroResolucion] = useState('');
  const [nombre, setNombre] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const [lista, setLista] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(null);

  const cargarLista = useCallback(async () => {
    setErrorLista(null);
    try {
      const data = await resolucionesService.listar();
      setLista(data);
    } catch (e) {
      console.log('[ResolucionesScreen] error listando', e);
      setErrorLista(
        'No se pudo cargar la lista. Verificá que el backend de resoluciones esté corriendo ' +
          'y que el celular esté en la misma red.',
      );
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  const escanear = async () => {
    setEscaneando(true);
    setError(null);
    setOkMsg(null);
    try {
      const nuevas = await scanService.getScan();
      if (!nuevas || nuevas.length === 0) return;

      const preparadas = [];
      for (const uri of nuevas) {
        try {
          // Sin rotacion adivinada: PhotoCropModal (dentro de scanService) ya
          // deja la foto con su orientacion correcta (normaliza el EXIF antes
          // de recortar). Forzar 90° acá según ancho/alto era un parche del
          // flujo viejo (con el crop de expo-image-picker) y hoy le pega mal a
          // cualquier foto apaisada real -- una mesa/tabla fotografiada con el
          // celular de costado terminaba girada 90° antes de subirla.
          const resized = await redimensionarImagen(uri);
          preparadas.push(resized?.uri || uri);
        } catch (e) {
          preparadas.push(uri);
        }
      }
      // Acumula: se pueden escanear paginas en varias tandas.
      setPageImages((prev) => [...prev, ...preparadas]);
    } catch (e) {
      console.log('[ResolucionesScreen] error escaneando', e);
      setError('No se pudo completar el escaneo. Intentá de nuevo.');
    } finally {
      setEscaneando(false);
    }
  };

  const quitarPagina = (idx) => {
    setPageImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const limpiarFormulario = () => {
    setPageImages([]);
    setNroResolucion('');
    setNombre('');
  };

  const puedeSubir =
    pageImages.length > 0 && nroResolucion.trim() && nombre.trim() && !subiendo;

  const subir = async () => {
    setSubiendo(true);
    setError(null);
    setOkMsg(null);
    try {
      const creada = await resolucionesService.crear({
        nroResolucion: nroResolucion.trim(),
        nombre: nombre.trim(),
        pageUris: pageImages,
      });
      limpiarFormulario();
      setOkMsg(
        `Guardada "${creada.nombre}" (${creada.total_paginas} ${
          creada.total_paginas === 1 ? 'página' : 'páginas'
        }). Continuá desde la web para extraer la tabla.`,
      );
      cargarLista();
    } catch (e) {
      console.log('[ResolucionesScreen] error subiendo', e);
      const detalle = e?.response?.data?.detail;
      setError(detalle || 'No se pudo subir la resolución. Revisá la conexión e intentá de nuevo.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Resoluciones
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={cargandoLista} onRefresh={cargarLista} tintColor={palette.primaryDeep} />
        }>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nueva resolución</Text>
          <Text style={styles.hint}>
            Escaneá las páginas que traen la tabla "RELACIÓN DE SUPERFICIE". Se guardan y después las
            trabajás desde la web (OCR + Excel).
          </Text>

          <TouchableOpacity
            style={[styles.secondaryButton, escaneando && styles.buttonDisabled]}
            onPress={escanear}
            disabled={escaneando}>
            {escaneando ? (
              <ActivityIndicator size="small" color={palette.primaryDeep} />
            ) : (
              <>
                <Icon name="camera" size={18} color={palette.primaryDeep} />
                <Text style={styles.secondaryButtonText}>
                  {pageImages.length > 0 ? 'Escanear más páginas' : 'Escanear páginas'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {pageImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsRow}>
              {pageImages.map((uri, idx) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => quitarPagina(idx)}>
                    <Icon name="x" size={13} color={palette.textOnDark} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>Número de resolución</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 291/2024"
            placeholderTextColor={palette.textSecondary}
            value={nroResolucion}
            onChangeText={setNroResolucion}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Edificio Don Juan"
            placeholderTextColor={palette.textSecondary}
            value={nombre}
            onChangeText={setNombre}
          />

          <TouchableOpacity
            style={[styles.primaryButton, !puedeSubir && styles.buttonDisabled]}
            onPress={subir}
            disabled={!puedeSubir}>
            {subiendo ? (
              <ActivityIndicator size="small" color={palette.textOnDark} />
            ) : (
              <Text style={styles.primaryButtonText}>Subir resolución</Text>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {okMsg ? <Text style={styles.okText}>{okMsg}</Text> : null}
        </View>

        <Text style={[styles.sectionTitle, styles.listTitle]}>Mis resoluciones</Text>

        {cargandoLista && lista.length === 0 ? (
          <View style={styles.centeredRow}>
            <ActivityIndicator size="small" color={palette.primaryDeep} />
            <Text style={styles.hint}>Cargando...</Text>
          </View>
        ) : errorLista ? (
          <Text style={styles.errorText}>{errorLista}</Text>
        ) : lista.length === 0 ? (
          <Text style={styles.hint}>Todavía no subiste ninguna resolución.</Text>
        ) : (
          lista.map((r) => (
            <View key={r.id_resolucion} style={styles.listItem}>
              <View style={styles.listItemMain}>
                <Text style={styles.listItemName} numberOfLines={1}>
                  {r.nombre}
                </Text>
                <Text style={styles.listItemMeta}>
                  N° {r.nro_resolucion} · {r.total_paginas}{' '}
                  {r.total_paginas === 1 ? 'página' : 'páginas'}
                </Text>
              </View>
              <EstadoBadge estado={r.estado} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    ...shadow.soft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  headerTitle: { ...typography.bodyMedium, flex: 1, marginHorizontal: spacing.md, textAlign: 'center' },
  headerSpacer: { width: 36 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadow.soft,
  },
  sectionTitle: { ...typography.h2, marginBottom: spacing.sm },
  listTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  label: { ...typography.caption, fontFamily: fonts.medium, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
  },
  thumbsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  thumbWrap: { marginRight: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: palette.background },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: palette.primaryDeep,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryButtonText: { ...typography.button, color: palette.textOnDark },
  secondaryButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: { ...typography.button, color: palette.primaryDeep },
  buttonDisabled: { opacity: 0.5 },
  centeredRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorText: { ...typography.body, color: palette.danger, marginTop: spacing.sm },
  okText: { ...typography.body, color: palette.success, marginTop: spacing.sm },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  listItemMain: { flex: 1, marginRight: spacing.md },
  listItemName: { ...typography.bodyMedium },
  listItemMeta: { ...typography.caption, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeText: { ...typography.caption, fontFamily: fonts.semibold },
});

export default ResolucionesScreen;
