import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

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
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#E6F4F1',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
      
    },
    modalDesc: {
        fontSize: 12,
        fontWeight: 'normal',
        marginBottom: 10,
        textAlign: 'center',
      
    },
    errorText: {
        color: 'red',
        marginBottom: 5,
        width: '100%',
        textAlign: 'left',
        fontSize: 14
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16
    },
    modalButton: {
        backgroundColor: '#3f008c',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default ModalDescripcion;
