import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow } from '../utils/theme';

export const WifiOffModal = ({ visible, onCLose }) => {
    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            onRequestClose={() => { }} // Necesario para Android
            statusBarTranslucent={true} // Para que cubra toda la pantalla
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Icon name="wifi-off" size={50} color="#e74c3c" style={styles.icon} />
                    <Text style={styles.message}>
                        No es posible conectarse al servidor, revise su conexion de datos o Wi-Fi.
                    </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCLose}>
                            <Text style={styles.buttonText}>Aceptar</Text>
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
        backgroundColor: "rgba(17, 17, 17, 0.55)",
        padding: spacing.xl,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 420,
        padding: spacing.xxl,
        backgroundColor: palette.surface,
        borderRadius: radius.lg,
        alignItems: "center",
        ...shadow.card,
    },
    icon: {
        marginBottom: spacing.lg,
    },
    message: {
        ...typography.body,
        color: palette.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "center",
        width: "100%",
        marginTop: spacing.xl,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: radius.pill,
        alignItems: "center",
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.border,
    },
    buttonText: {
        ...typography.button,
        fontSize: 15,
        color: palette.textPrimary,
    },
});
