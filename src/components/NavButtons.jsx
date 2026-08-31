import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Feather as Icon } from '@expo/vector-icons';

const NavButtons = ({ onScan, onNavigate, onAttach }) => {

    return (
        <>
            <TouchableOpacity
                style={styles.navButton}
                onPress={onNavigate}>
                <Icon name="grid" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onScan}>
                <Icon name="camera" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Escanear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onAttach}>
                <Icon name="file-plus" size={24} color="white" />
                <Text style={{ color: '#ffffff' }}>Adjuntar archivo</Text>
            </TouchableOpacity>
        </>
    )
}
const styles = StyleSheet.create({
    navButton: { alignItems: 'center' },
})

export default NavButtons