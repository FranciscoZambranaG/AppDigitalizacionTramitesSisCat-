import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Feather as Icon } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { palette, typography, spacing, radius, shadow } from '../../utils/theme';
import { getMimeType, getFileKind } from '../../utils/mimeTypes';

// Apartado de "vista de documento": cada archivo de la bandeja se abre aca y se
// muestra segun su tipo:
// - PDF: vista embebida en iOS (WebView); en Android (sin visor de PDF nativo en
//   Expo Go) se abre con una app externa.
// - Imagenes (jpg/png/heic): vista previa a pantalla completa dentro de la app.
// - Otros formatos (doc/xls/zip/...): se abren con una app externa del sistema.
const directoryOf = (uri) => uri.substring(0, uri.lastIndexOf('/') + 1);

const PDFViewer = ({ route }) => {
  const { filePath } = route.params || {};
  const navigation = useNavigation();
  const fileName = (filePath || '').split('/').pop() || 'Documento';
  const kind = getFileKind(fileName);
  const mimeType = getMimeType(fileName);

  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState(null);
  const [previewFallo, setPreviewFallo] = useState(false);

  const abrirExterno = async () => {
    try {
      setAbriendo(true);
      setError(null);

      if (Platform.OS === 'android') {
        // IntentLauncher necesita un content:// URI
        const contentUri = await FileSystem.getContentUriAsync(filePath);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: mimeType,
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, { mimeType });
      }
    } catch (e) {
      console.log('[PDFViewer] error abriendo', e);
      setError('No se encontro una app para abrir este documento.');
    } finally {
      setAbriendo(false);
    }
  };

  useEffect(() => {
    // Sin vista embebida posible: PDF en Android, o cualquier otro formato
    // (doc/xls/zip/...) en cualquier plataforma. Se intenta abrir de una vez.
    if (kind === 'other' || (kind === 'pdf' && Platform.OS === 'android')) {
      abrirExterno();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  const irAEstudiarConIA = () => {
    navigation.navigate('AIStudyScreen', { filePath, fileName });
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={20} color={palette.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{fileName}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const AIButton = () =>
    kind === 'pdf' ? (
      <TouchableOpacity style={styles.aiButton} onPress={irAEstudiarConIA}>
        <Icon name="cpu" size={18} color={palette.textOnDark} />
        <Text style={styles.aiButtonText}>Estudiar con la IA</Text>
      </TouchableOpacity>
    ) : null;

  // --- Vista de imagen (jpg/png/heic) ---
  if (kind === 'image') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <Header />
        {previewFallo ? (
          <View style={styles.centered}>
            <Icon name="image" size={40} color={palette.textSecondary} />
            <Text style={styles.info}>No se pudo cargar la vista previa de la imagen.</Text>
          </View>
        ) : (
          <Image
            source={{ uri: filePath }}
            style={styles.imagePreview}
            resizeMode="contain"
            onError={() => setPreviewFallo(true)}
          />
        )}
      </SafeAreaView>
    );
  }

  // --- Vista de PDF embebida (solo iOS) ---
  if (kind === 'pdf' && Platform.OS === 'ios') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <Header />
        <AIButton />
        {previewFallo ? (
          <View style={styles.centered}>
            <Icon name="file-text" size={40} color={palette.textSecondary} />
            <Text style={styles.info}>No se pudo mostrar la vista previa del PDF.</Text>
            <TouchableOpacity style={styles.button} onPress={abrirExterno}>
              <Text style={styles.buttonText}>Abrir con otra app</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: filePath }}
            style={styles.pdf}
            originWhitelist={['*']}
            // WKWebView (iOS) necesita permiso explicito para leer archivos
            // locales fuera de su sandbox; sin esto el visor queda en blanco.
            allowingReadAccessToURL={directoryOf(filePath)}
            onError={() => setPreviewFallo(true)}
            onHttpError={() => setPreviewFallo(true)}
          />
        )}
      </SafeAreaView>
    );
  }

  // --- PDF en Android y cualquier otro formato: se abre con una app externa ---
  return (
    <SafeAreaView style={[styles.container, styles.centered]} edges={['top', 'left', 'right', 'bottom']}>
      <Header />
      <AIButton />
      <View style={styles.centered}>
        {abriendo ? (
          <ActivityIndicator size="large" color={palette.primaryDeep} />
        ) : (
          <>
            <Icon name="external-link" size={40} color={palette.textSecondary} style={{ marginBottom: spacing.md }} />
            <Text style={styles.info}>
              {error || 'Este documento se abre con una app externa de tu dispositivo.'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={abrirExterno}>
              <Text style={styles.buttonText}>Abrir documento</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
    backgroundColor: palette.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  aiButtonText: {
    ...typography.button,
    fontSize: 14,
    color: palette.textOnDark,
    marginLeft: spacing.sm,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  pdf: { flex: 1, width: '100%', height: '100%' },
  imagePreview: { flex: 1, width: '100%', backgroundColor: palette.surfaceDark },
  info: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: palette.primaryDeep,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  buttonText: { ...typography.button, color: palette.textOnDark },
});

export default PDFViewer;
