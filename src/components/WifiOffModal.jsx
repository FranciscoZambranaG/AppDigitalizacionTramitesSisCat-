import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather as Icon } from '@expo/vector-icons';

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
        backgroundColor: "rgba(0,0,0,0.7)", // Más oscuro para mejor visibilidad
    },
    modalContainer: {
        width: '80%', // Mejor responsividad
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        alignItems: "center",
    },
    icon: {
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24, // Mejor legibilidad
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
    buttonText: {
        color: "#e74c3c",
        fontWeight: "bold",
    },
});
