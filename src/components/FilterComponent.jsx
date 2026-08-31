import React from 'react'
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native'

const FilterComponent = ({search, setSearch}) => {
  return (
    <View style={styles.searchContainer}>
    <TextInput
        style={styles.searchInput}
        placeholder="Buscar"
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
  searchContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, backgroundColor: 'white' },
  searchButton: { marginLeft: 10, padding: 10, backgroundColor: '#3f008c', borderRadius: 8 },
  searchText: { color: 'white', fontWeight: 'bold' },
})

export default FilterComponent