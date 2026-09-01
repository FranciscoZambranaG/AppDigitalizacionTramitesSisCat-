import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { biometriaDisponible, autenticarBiometrico } from '../../utils/biometria';
import { guardarCredenciales, obtenerCredenciales } from '../../utils/credencialesSeguras';
import { colors } from '../../utils/colors';
import { loginStyles as styles } from './styles/LoginStyles';
import { useAuth } from '../../hooks/AuthProvider';
import { useWifiLost } from '../../hooks/WifiLostProvider';
import banner from '../../assets/banner.png';
import { components as themeComponents } from '../../utils/theme';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorUser, setErrorUser] = useState('');
  const [errorPass, setErrorPass] = useState('');
  const [generalError, setGeneralError] = useState('');

  const { login } = useAuth();
  const { checkConnection } = useWifiLost();

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const { available } = await biometriaDisponible();
        setBiometricAvailable(Boolean(available));
      } catch (err) {
        setBiometricAvailable(false);
      }
    };

    checkBiometricAvailability();
    checkConnection();
  }, []);

  const handleBiometricAuth = async () => {
    const isConnected = await checkConnection();
    if (!isConnected) return;

    try {
      const { available, error } = await biometriaDisponible();
      if (!available) {
        const mensaje = error === 'BIOMETRIC_ERROR_NONE_ENROLLED'
          ? 'No hay huella ni rostro configurados. Puede usar el PIN/Patron de su dispositivo para ingresar.'
          : (error || 'Biometria no disponible. Puede usar el PIN/Patron de su dispositivo para ingresar.');
        Alert.alert(
          'Biometria no disponible',
          mensaje,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Usar PIN/Patron', onPress: () => launchPinAuth() },
          ],
        );
        return;
      }

      const { success } = await autenticarBiometrico('Identifiquese para ingresar');
      if (success) {
        retrieveCredentialsAndLogin();
      }
    } catch (error) {
      askForPin();
    }
  };

  const askForPin = () => {
    Alert.alert(
      'Biometria no detectada',
      'La huella o reconocimiento facial no funciono. Desea ingresar usando el PIN/Patron de su celular?',
      [
        { text: 'No, cancelar', style: 'cancel' },
        { text: 'Si, usar', onPress: () => launchPinAuth() },
      ],
    );
  };

  const launchPinAuth = async () => {
    try {
      const credentials = await obtenerCredenciales();
      if (credentials) {
        performLogin(credentials.username, credentials.password);
      } else {
        Alert.alert('Aviso', 'Aun no ha guardado sus credenciales. Inicie sesion manualmente una vez.');
      }
    } catch (err) {
      Alert.alert('Aviso', 'No se pudo validar.');
    }
  };

  const retrieveCredentialsAndLogin = async () => {
    try {
      const credentials = await obtenerCredenciales();
      if (credentials) {
        performLogin(credentials.username, credentials.password);
      } else {
        Alert.alert('Aviso', 'Aun no ha guardado sus credenciales. Inicie sesion manualmente una vez.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron leer las credenciales.');
    }
  };

  const performLogin = async (user, pass) => {
    const nombre = (user || '').trim();
    setLoading(true);
    try {
      await login(nombre, pass);
      try {
        await guardarCredenciales(nombre, pass);
      } catch (keychainError) {
        console.log('[LOGIN] error guardando credenciales', keychainError);
      }
      setGeneralError('');
      // La navegacion cambia sola al quedar la sesion autenticada.
    } catch (error) {
      setGeneralError(error?.message || 'No se pudo iniciar sesion');
      setTimeout(() => setGeneralError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorUser('');
    setErrorPass('');
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
          <View style={themeComponents.titleAccent} />

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
              editable={!loading}
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
              editable={!loading}
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
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <View style={styles.loginContent}>
                <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
                <Icon name="log-in-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* BOTON BIOMETRICO */}
          <Animatable.View animation="zoomIn" delay={600} style={{ alignItems: 'center', marginTop: 30 }}>
            <TouchableOpacity
              onPress={handleBiometricAuth}
              style={{ alignItems: 'center', padding: 10, opacity: biometricAvailable ? 1 : 0.5 }}
              disabled={!biometricAvailable || loading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="scan-outline" size={40} color={colors.primary} style={{ marginRight: -10 }} />
                <Icon name="finger-print-outline" size={55} color={colors.primary} />
              </View>
              <Text style={{ color: colors.lightText, fontSize: 13, marginTop: 8 }}>
                Acceso Biometrico
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
