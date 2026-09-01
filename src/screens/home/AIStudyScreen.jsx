import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather as Icon } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { palette, typography, spacing, radius, shadow } from '../../utils/theme';
import { OLLAMA_URL, OLLAMA_MODEL } from '../../config/env';
import fileServices from '../../services/fileServices';

// El modelo local (Ollama) tiene que generar la respuesta completa antes de
// devolver nada (stream: false), asi que se le da un margen generoso antes
// de considerar que la conexion esta caida en vez de solo lenta.
const TIMEOUT_MS = 120000;

// Pantalla "Estudiar con la IA": manda las paginas escaneadas del documento
// (guardadas por fileServices.savePages) junto con la pregunta del usuario
// al modelo de vision de Ollama que corre localmente (ver src/config/env.js
// -> OLLAMA_URL / OLLAMA_MODEL) y muestra la respuesta.
const AIStudyScreen = ({ route }) => {
  const navigation = useNavigation();
  const { fileName } = route?.params || {};

  const [pageImages, setPageImages] = useState([]);
  const [cargandoPaginas, setCargandoPaginas] = useState(true);

  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!fileName) {
        setCargandoPaginas(false);
        return;
      }
      try {
        const paginas = await fileServices.getPages(fileName);
        if (!cancelado) setPageImages(paginas);
      } catch (e) {
        console.log('[AIStudyScreen] error obteniendo paginas escaneadas', e);
      } finally {
        if (!cancelado) setCargandoPaginas(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [fileName]);

  const enviarMensaje = async () => {
    if (!mensaje.trim() || cargando) return;

    setCargando(true);
    setError(null);
    setRespuesta('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // El modelo de vision espera cada imagen como string base64 (sin el
      // prefijo "data:image/...;base64,").
      const images = await Promise.all(
        pageImages.map((uri) =>
          FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
        ),
      );

      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: mensaje,
          stream: false,
          ...(images.length ? { images } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`El servidor respondio con estado ${res.status}`);
      }

      const data = await res.json();
      setRespuesta(data.response ?? '');
    } catch (e) {
      console.log('[AIStudyScreen] error consultando Ollama', e);
      if (e.name === 'AbortError') {
        setError(
          'El modelo esta tardando demasiado en responder (mas de 2 minutos) y se cancelo la ' +
            'consulta. Puede que el servidor este sobrecargado o inaccesible.',
        );
      } else {
        setError(
          'No se pudo conectar con el modelo de IA. Verifica que el servidor de Ollama este ' +
            'corriendo y que el celular este en la misma red.',
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Estudiar con la IA
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {fileName ? (
            <Text style={styles.contextLabel} numberOfLines={1}>
              Documento: {fileName}
            </Text>
          ) : null}

          {cargandoPaginas ? (
            <View style={styles.pagesRow}>
              <ActivityIndicator size="small" color={palette.primaryDeep} />
              <Text style={styles.pagesHint}>Cargando paginas escaneadas...</Text>
            </View>
          ) : pageImages.length > 0 ? (
            <View style={styles.pagesSection}>
              <Text style={styles.pagesHint}>
                La IA va a analizar estas {pageImages.length}{' '}
                {pageImages.length === 1 ? 'pagina' : 'paginas'}:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pagesRowContent}>
                {pageImages.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.pageThumb} />
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.pagesHint}>
              No se encontraron imagenes escaneadas para este documento; la IA solo va a responder
              en base a tu pregunta.
            </Text>
          )}

          <View style={styles.responseBox}>
            {cargando ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={palette.primaryDeep} />
                <Text style={styles.loadingText}>Consultando al modelo...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : respuesta ? (
              <Text style={styles.responseText}>{respuesta}</Text>
            ) : (
              <Text style={styles.placeholderText}>
                Escribi una pregunta y presiona enviar para consultar al modelo de IA.
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribi tu mensaje..."
            placeholderTextColor={palette.textSecondary}
            value={mensaje}
            onChangeText={setMensaje}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!mensaje.trim() || cargando) && styles.sendButtonDisabled]}
            onPress={enviarMensaje}
            disabled={!mensaje.trim() || cargando}>
            <Icon name="send" size={20} color={palette.textOnDark} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    ...typography.bodyMedium,
    flex: 1,
    marginHorizontal: spacing.md,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  scrollContent: { padding: spacing.xl, flexGrow: 1 },
  contextLabel: { ...typography.caption, marginBottom: spacing.md },
  pagesSection: { marginBottom: spacing.lg },
  pagesHint: { ...typography.caption, marginBottom: spacing.sm },
  pagesRow: { flexDirection: 'row', alignItems: 'center' },
  pagesRowContent: { flexDirection: 'row', alignItems: 'center' },
  pageThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    backgroundColor: palette.surface,
  },
  responseBox: {
    flex: 1,
    minHeight: 200,
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadow.soft,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.caption, marginTop: spacing.md },
  placeholderText: { ...typography.body, color: palette.textSecondary },
  responseText: { ...typography.body },
  errorText: { ...typography.body, color: palette.danger },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    backgroundColor: palette.surface,
    ...shadow.nav,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: palette.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginRight: spacing.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: palette.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  sendButtonDisabled: { opacity: 0.45 },
});

export default AIStudyScreen;
