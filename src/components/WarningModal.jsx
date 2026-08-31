import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather as Icon } from '@expo/vector-icons'; // Importar ícono

const WarningModal = ({ visible, onCancel, onConfirm,iconName, text }) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Icon name={iconName} size={50} color="#e74c3c" style={styles.icon} />
          <Text style={styles.message}>{text}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.delete]} onPress={onConfirm}>
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      width: 300,
      padding: 20,
      backgroundColor: "white",
      borderRadius: 10,
      alignItems: "center",
    },
    icon: {
      marginBottom: 10, // Espacio entre el icono y el mensaje
    },
    message: {
      fontSize: 18,
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "bold",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    button: {
      flex: 1,
      padding: 10,
      marginHorizontal: 5,
      borderRadius: 5,
      alignItems: "center",
    },
    cancel: {
      backgroundColor: "#ccc",
    },
    delete: {
      backgroundColor: "#e74c3c",
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
    },
  });
  
  export default WarningModal;
  