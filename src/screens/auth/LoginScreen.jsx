import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { biometriaDisponible, autenticarBiometrico } from '../../utils/biometria';
import { guardarCredenciales, obtenerCredenciales } from '../../utils/credencialesSeguras';
import { colors } from '../../utils/colors';
import { loginStyles as styles } from './styles/LoginStyles';
import { useAuth } from '../../hooks/AuthProvider';
import { useWifiLost } from '../../hooks/WifiLostProvider';
import baseUrl from '../../api/baseUrl';
import banner from '../../assets/banner.png';

const Login = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const [errorUser, setErrorUser] = useState('');
  const [errorPass, setErrorPass] = useState('');
  const [generalError, setGeneralError] = useState('');

  const { saveAuthIds } = useAuth();
  const { checkConnection } = useWifiLost();

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        console.log('[BIOMETRIC] Verificando disponibilidad del sensor...');
        const { available, error } = await biometriaDisponible();
        console.log('[BIOMETRIC] biometriaDisponible:', { available, error });
        setBiometricAvailable(Boolean(available));
      } catch (err) {
        console.error('[BIOMETRIC] Error verificando disponibilidad:', err);
        setBiometricAvailable(false);
      }
    };

    checkBiometricAvailability();
    checkConnection();
  }, []);

  const handleBiometricAuth = async () => {
    console.log('[BIOMETRIC] Iniciando autenticación biométrica...');
    const isConnected = await checkConnection();
    console.log('[BIOMETRIC] Conexión WiFi:', isConnected);
    if (!isConnected) return;

    try {
      const { available, error } = await biometriaDisponible();
      console.log('[BIOMETRIC] biometriaDisponible (onPress):', { available, error });
      if (!available) {
        const mensaje = error === 'BIOMETRIC_ERROR_NONE_ENROLLED'
          ? "No hay huella ni rostro configurados. Puede usar el PIN/Patrón de su dispositivo para ingresar."
          : (error || "Biometría no disponible. Puede usar el PIN/Patrón de su dispositivo para ingresar.");
        Alert.alert(
          "Biometría no disponible",
          mensaje,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Usar PIN/Patrón",
              onPress: () => launchPinAuth(),
            },
          ]
        );
        return;
      }

      console.log('[BIOMETRIC] Llamando a autenticarBiometrico...');
      const { success } = await autenticarBiometrico('Identifíquese para ingresar a DigiD');
      console.log('[BIOMETRIC] Resultado autenticarBiometrico:', success);

      if (success) {
        retrieveCredentialsAndLogin();
      }
    } catch (error) {
      console.error('[BIOMETRIC] Fallo biometría o cancelado:', error);
      askForPin();
    }
  };

  const askForPin = () => {
    Alert.alert(
      "Biometría no detectada",
      "La huella o reconocimiento facial no funcionó. ¿Desea ingresar usando el PIN/Patrón de su celular?",
      [
        { text: "No, cancelar", style: "cancel" },
        {
          text: "Sí, usar",
          onPress: () => launchPinAuth()
        }
      ]
    );
  };

  const launchPinAuth = async () => {
    try {
      // El PIN/Patron del dispositivo ya se ofrece como fallback dentro de
      // autenticarBiometrico(); aqui solo recuperamos las credenciales guardadas.
      const credentials = await obtenerCredenciales();
      if (credentials) {
        performLogin(credentials.username, credentials.password);
      } else {
        Alert.alert("Aviso", "Aun no ha guardado sus credenciales. Inicie sesión manualmente una vez.");
      }
    } catch (err) {
      Alert.alert("Aviso", "No se pudo validar.");
    }
  };

  const retrieveCredentialsAndLogin = async () => {
    try {
      const credentials = await obtenerCredenciales();
      if (credentials) {
        performLogin(credentials.username, credentials.password);
      } else {
        Alert.alert("Aviso", "Aun no ha guardado sus credenciales. Inicie sesión manualmente una vez.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron leer las credenciales.");
    }
  };

  const performLogin = async (user, pass) => {
    const url = `${baseUrl}/login`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: user,
          clave: pass,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        setGeneralError('Credenciales incorrectas');
        setTimeout(() => setGeneralError(''), 3000);
        return;
      }

      if (!response.ok) {
        setGeneralError(`Error del servidor (${response.status})`);
        setTimeout(() => setGeneralError(''), 3000);
        return;
      }

      const token = await response.json();
      if (!token?.user) {
        setGeneralError('Token inválido.');
        return;
      }

      try {
        await guardarCredenciales(user, pass);
      } catch (keychainError) {
        console.log('[LOGIN] error guardando credenciales', keychainError);
      }

      setGeneralError('');
      const { nombre, estado, ...data } = token.user;
      await saveAuthIds(data);
      navigation.replace('Inbox');
    } catch (error) {
      console.log('[LOGIN] error', { url, message: error?.message, name: error?.name });
      setGeneralError('Error de conexión');
      setTimeout(() => setGeneralError(''), 3000);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) { setErrorUser('Requerido'); return; }
    if (!password.trim()) { setErrorPass('Requerido'); return; }
    performLogin(username, password);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        <Animatable.View animation="fadeIn" duration={600} style={styles.container}>
          <Image source={banner} style={{ width: 80, height: 80 }} resizeMode="contain" />
          <Animatable.Image
            source={require('./images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Animatable.Text animation="fadeInDown" delay={100} style={styles.title}>DigiD</Animatable.Text>

          {generalError ? (
            <Animatable.Text animation="fadeInLeft" style={styles.generalError}>{generalError}</Animatable.Text>
          ) : null}

          <Animatable.View animation="fadeInUp" delay={200} style={styles.inputContainer}>
            <Icon name="person-outline" size={20} color={colors.lightText} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor={colors.lightText}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </Animatable.View>
          {errorUser ? (
            <Animatable.Text animation="fadeInLeft" style={styles.errorText}>{errorUser}</Animatable.Text>
          ) : null}

          <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
            <Icon name="lock-closed-outline" size={20} color={colors.lightText} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.lightText}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.lightText} />
            </TouchableOpacity>
          </Animatable.View>
          {errorPass ? (
            <Animatable.Text animation="fadeInLeft" style={styles.errorText}>{errorPass}</Animatable.Text>
          ) : null}

          <Animatable.View animation="fadeInUp" delay={400}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <View style={styles.loginContent}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
                <Icon name="log-in-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          </Animatable.View>


          {/* BOTÓN BIOMÉTRICO */}
          <Animatable.View animation="zoomIn" delay={600} style={{ alignItems: 'center', marginTop: 30 }}>
            <TouchableOpacity
              onPress={handleBiometricAuth}
              style={{ alignItems: 'center', padding: 10, opacity: biometricAvailable ? 1 : 0.5 }}
              disabled={!biometricAvailable}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="scan-outline" size={40} color={colors.primary} style={{ marginRight: -10 }} />
                <Icon name="finger-print-outline" size={55} color={colors.primary} />
              </View>
              <Text style={{ color: colors.lightText, fontSize: 13, marginTop: 8 }}>
                Acceso Biométrico
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerNote}>© 2026 Gobierno Autónomo de Cochabamba</Text>
            <Text style={styles.footerNote}>Dirección de Administración Geográfica y Catastro</Text>
            <Text style={styles.footerNote}>Departamento de Informática Catastral e Inteligencia Fiscal</Text>
            <Text style={styles.footerNote}>© Todos los derechos reservados.</Text>
          </View>
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
};

export default Login;