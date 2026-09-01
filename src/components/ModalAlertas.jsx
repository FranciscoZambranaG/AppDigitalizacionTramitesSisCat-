import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, typography, spacing, radius, shadow } from '../utils/theme';

const ModalAlerta = ({ visible, title, description, onOk }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <TouchableOpacity style={styles.button} onPress={onOk}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalAlerta;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.card,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: palette.primaryDeep,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: radius.pill,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: palette.textOnDark,
  },
});
