import React from 'react'
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { palette, typography, spacing, radius, fonts } from '../utils/theme';

const FilterComponent = ({search, setSearch}) => {
  return (
    <View style={styles.searchContainer}>
    <TextInput
        style={styles.searchInput}
        placeholder="Buscar"
        placeholderTextColor={palette.textSecondary}
        value={search}
        onChangeText={setSearch}
    />
    <TouchableOpacity style={styles.searchButton}>
        <Text style={styles.searchText}>Buscar</Text>
    </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'center', gap: spacing.sm },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: palette.textPrimary,
  },
  searchButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.primaryDeep,
    borderRadius: radius.pill,
  },
  searchText: { ...typography.button, fontSize: 14, color: palette.textOnDark },
})

export default FilterComponent
