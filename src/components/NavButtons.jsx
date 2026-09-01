import React from 'react'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { Feather as Icon } from '@expo/vector-icons';
import { palette, typography, spacing, radius, shadow } from '../utils/theme';

const NavButtons = ({ onScan, onLogout, onAttach }) => {

    return (
        <>
            <TouchableOpacity style={styles.navButton} onPress={onAttach}>
                <Icon name="file-plus" size={22} color={palette.textSecondary} />
                <Text style={styles.label}>Adjuntar archivo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabWrapper} onPress={onScan} activeOpacity={0.85}>
                <View style={styles.fab}>
                    <Icon name="camera" size={26} color={palette.textOnDark} />
                </View>
                <Text style={styles.label}>Escanear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={onLogout}>
                <Icon name="log-out" size={22} color={palette.textSecondary} />
                <Text style={styles.label}>Cerrar sesión</Text>
            </TouchableOpacity>
        </>
    )
}
const styles = StyleSheet.create({
    navButton: { alignItems: 'center', gap: 4, flex: 1 },
    fabWrapper: { alignItems: 'center', gap: 4, flex: 1 },
    fab: {
        width: 60,
        height: 60,
        borderRadius: radius.pill,
        backgroundColor: palette.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -28,
        ...shadow.fab,
    },
    label: {
        ...typography.caption,
        fontSize: 11,
        lineHeight: 14,
    },
})

export default NavButtons
