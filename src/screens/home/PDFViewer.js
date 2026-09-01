import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { palette, typography, spacing, radius, shadow } from '../../utils/theme';

// Reemplaza a react-native-pdf.
// Expo Go no trae un visor de PDF embebido para Android. En iOS el WebView
// muestra el PDF nativamente; en Android se abre con una app externa
// (Drive, visor de PDF, etc.) mediante IntentLauncher / Sharing.
const PDFViewer = ({ route }) => {
  const { filePath } = route.params || {};
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState(null);

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
          type: 'application/pdf',
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (e) {
      console.log('[PDFViewer] error abriendo', e);
      setError('No se encontro una app para abrir el PDF. Instale un visor de PDF.');
    } finally {
      setAbriendo(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      abrirExterno();
    }
  }, [filePath]);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <WebView source={{ uri: filePath }} style={styles.pdf} />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered]}>
      {abriendo ? (
        <ActivityIndicator size="large" color={palette.primaryDeep} />
      ) : (
        <>
          <Text style={styles.info}>
            {error || 'El documento se abre con tu visor de PDF.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={abrirExterno}>
            <Text style={styles.buttonText}>Abrir documento</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  pdf: { flex: 1, width: '100%', height: '100%' },
  info: { ...typography.body, color: palette.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  button: {
    backgroundColor: palette.surfaceDark,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  buttonText: { ...typography.button, color: palette.textOnDark },
});

export default PDFViewer;
