import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow } from '../../utils/theme';
import { OLLAMA_URL, OLLAMA_MODEL } from '../../config/env';

// Pantalla "Estudiar con la IA": envia un prompt de texto al modelo de Ollama
// que corre localmente en la red del desarrollador (ver src/config/env.js ->
// OLLAMA_URL / OLLAMA_MODEL) y muestra la respuesta.
const AIStudyScreen = ({ route }) => {
  const navigation = useNavigation();
  const { fileName } = route?.params || {};

  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState(null);

  const enviarMensaje = async () => {
    if (!mensaje.trim() || cargando) return;

    setCargando(true);
    setError(null);
    setRespuesta('');

    try {
      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL, // nombre del modelo, configurado en src/config/env.js
          prompt: mensaje,
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`El servidor respondio con estado ${res.status}`);
      }

      const data = await res.json();
      setRespuesta(data.response ?? '');
    } catch (e) {
      console.log('[AIStudyScreen] error consultando Ollama', e);
      setError(
        'No se pudo conectar con el modelo de IA. Verifica que el servidor de Ollama este ' +
          'corriendo y que el celular este en la misma red.',
      );
    } finally {
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
