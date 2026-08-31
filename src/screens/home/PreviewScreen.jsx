import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9d9d9d',
  },
  title: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9d9d9d',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  editButton: {
    backgroundColor: '#33a5ff',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderText: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});

export default function App() {
  const [hasImage, setHasImage] = useState(true);

  const handleDelete = () => {
    setHasImage(false);
  };

  const handleEdit = () => {
    setHasImage(true);
  };

  const handleSave = () => {
    console.log("Imagen guardada");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vista Previa</Text>
      </View>

      <View style={styles.previewContainer}>
        {hasImage ? (
          <Image
            source={{ uri: 'https://media.zenfs.com/es/animal_pol_tico_619/ed41eafbad9b28bc405171d34f34da98' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholderText}>No hay imagen seleccionada</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}