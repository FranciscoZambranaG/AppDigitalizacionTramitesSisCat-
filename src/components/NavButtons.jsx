import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather as Icon } from '@expo/vector-icons';

const NavButtons = ({ onScan, onLogout, onAttach }) => {

    return (
        <>
            <TouchableOpacity style={styles.navButton} onPress={onScan}>
                <Icon name="camera" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Escanear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onAttach}>
                <Icon name="file-plus" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Adjuntar archivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onLogout}>
                <Icon name="log-out" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Cerrar sesión</Text>
            </TouchableOpacity>
        </>
    )
}
const styles = StyleSheet.create({
    navButton: { alignItems: 'center' },
})

export default NavButtons
