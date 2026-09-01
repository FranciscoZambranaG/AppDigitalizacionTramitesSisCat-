import React from 'react'
import { FlatList, View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native'
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow, fonts } from '../utils/theme';

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
            <Image
              source={require('../assets/pdf-icon.png')}
              style={styles.image}
            />
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
  image: { width: 48, height: 48, borderRadius: radius.sm },
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
