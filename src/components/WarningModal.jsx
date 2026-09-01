import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather as Icon } from '@expo/vector-icons'; // Importar ícono
import { palette, typography, spacing, radius, shadow } from '../utils/theme';

const WarningModal = ({ visible, onCancel, onConfirm,iconName, text }) => {
  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Icon name={iconName} size={50} color="#e74c3c" style={styles.icon} />
          <Text style={styles.message}>{text}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
              <Text style={[styles.buttonText, styles.cancelText]}>Cancelar</Text>
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
      backgroundColor: "rgba(17, 17, 17, 0.45)",
      padding: spacing.xl,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 360,
      padding: spacing.xxl,
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      alignItems: "center",
      ...shadow.card,
    },
    icon: {
      marginBottom: spacing.md,
    },
    message: {
      ...typography.h2,
      fontSize: 18,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: radius.pill,
      alignItems: "center",
    },
    cancel: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    delete: {
      backgroundColor: palette.danger,
    },
    buttonText: {
      ...typography.button,
      fontSize: 15,
      color: palette.textOnDark,
    },
    cancelText: {
      color: palette.textPrimary,
    },
  });
  
  export default WarningModal;
  