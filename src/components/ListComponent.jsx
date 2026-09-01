import React, { useState } from 'react'
import { FlatList, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow, fonts } from '../utils/theme';
import { getFileKind } from '../utils/mimeTypes';

const pdfIcon = require('../assets/pdf-icon.png');

// Miniatura de cada fila: si es una imagen se muestra la propia foto; si no,
// el icono generico de documento. Si la carga falla (asset o red), se cae a un
// icono vectorial en vez de dejar el espacio en blanco.
function Thumbnail({ item }) {
  const [failed, setFailed] = useState(false);
  const isImage = getFileKind(item.name) === 'image';

  if (failed) {
    return (
      <View style={[styles.image, styles.thumbFallback]}>
        <Icon name={isImage ? 'image' : 'file-text'} size={20} color={palette.textSecondary} />
      </View>
    );
  }

  return (
    <ExpoImage
      source={isImage ? { uri: item.path } : pdfIcon}
      style={styles.image}
      contentFit={isImage ? 'cover' : 'contain'}
      onError={() => setFailed(true)}
    />
  );
}

function ListComponent({ data, onDelete, openPDF }) {
  return (
    <FlatList
      data={data}
      keyExtractor={item => item.name}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => openPDF(item.path)}>
            <Thumbnail item={item} />
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.date}>{item.descripcion}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(item.path)}>
              <Icon name="trash-2" size={18} color={palette.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  )
}
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radius.card,
    alignItems: 'center',
    ...shadow.soft,
  },
  image: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: palette.background },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  infoContainer: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.body, fontFamily: fonts.semibold },
  date: { ...typography.caption, marginTop: 2 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginLeft: spacing.sm },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ListComponent
