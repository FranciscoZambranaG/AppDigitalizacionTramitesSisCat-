import React, { useRef,useEffect } from 'react'
import { View, Text, Image, PanResponder } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as Animatable from 'react-native-animatable'
import background from '../../assets/alcaldia1.jpeg' // Imagen optimizada
import banner from '../../assets/banner.png'
import { splashStyles as styles } from './styles/SplashStyles'
import { useAuth } from '../../hooks/AuthProvider'
import { useWifiLost } from '../../hooks/WifiLostProvider'

export const SplashScreen = () => {
  const navigation = useNavigation()
  const splashRef = useRef(null)
  const { logout } = useAuth() // <-- Aquí accedes a la función logout del contexto
  const { checkConnection } = useWifiLost()

  // Ejecuta logout al cargar SplashScreen
  useEffect(() => {
    const clearSession = async () => {
      await logout()
      await checkConnection(); //Verifica inmediatamente al abrir la app
    }
    clearSession()
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dx < -20, // Detectar swipe hacia izquierda
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          splashRef.current?.animate('slideOutLeft', 500).then(() => {
            navigation.replace('Login')
          })
        }
      },
    })
  ).current

  return (
    <Animatable.View
      ref={splashRef}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      <Image source={background} style={styles.backgroundImage} />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image source={banner} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}> DigiD </Text>
        <Text style={styles.subtitle}>
          Aplicación para la digitalización de trámites de la Dirección de Administración Geográfica y Catastro del Gobierno Autónomo Municipal de Cochabamba 
        </Text>

        <Animatable.Text
          animation="pulse"
          easing="ease-in-out"
          iterationCount="infinite"
          style={styles.swipeText}
        >
          Deslice hacia la izquierda para iniciar sesión
        </Animatable.Text>
      </View>
    </Animatable.View>
  )
}
