import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, typography, spacing, radius, shadow, fonts } from '../utils/theme';

const ModalDescripcion = ({ visible, onClose, onConfirm }) => {
    const [descripcionInput, setDescripcionInput] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (descripcionInput.trim() === '') {
            setError('Por favor ingrese una descripción.');
            return;
        }
        setError('');
        onConfirm(descripcionInput); // Enviar la descripción al componente padre
        setDescripcionInput(''); // Reiniciar campo después de confirmar
    };

    return (
        <Modal visible={visible} onRequestClose={onClose} transparent animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Descripción</Text>
                    <Text style={styles.modalDesc}>Ingrese una descripción para el archivo.</Text>
                    
                    {error !== '' && <Text style={styles.errorText}>{error}</Text>}
                    
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Escriba una descripción para el archivo"
                        value={descripcionInput}
                        onChangeText={(text) => {
                            setDescripcionInput(text);
                            if (error) setError('');
                        }}
                    />
                    
                    <TouchableOpacity style={styles.modalButton} onPress={handleConfirm}>
                        <Text style={styles.modalButtonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 17, 17, 0.45)',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: palette.surface,
        padding: spacing.xxl,
        borderRadius: radius.lg,
        alignItems: 'center',
        ...shadow.card,
    },
    modalTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    modalDesc: {
        ...typography.caption,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    errorText: {
        color: palette.error,
        marginBottom: spacing.sm,
        width: '100%',
        textAlign: 'left',
        fontFamily: fonts.regular,
        fontSize: 13,
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: spacing.lg,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: palette.textPrimary,
        backgroundColor: palette.surface,
    },
    modalButton: {
        backgroundColor: palette.primaryDeep,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: radius.pill,
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    modalButtonText: {
        ...typography.button,
        color: palette.textOnDark,
    }
});

export default ModalDescripcion;
