import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/home/HomeScreen';
import Login from '../screens/auth/LoginScreen';
import PDFViewer from '../screens/home/PDFViewer';
import AIStudyScreen from '../screens/home/AIStudyScreen';
import AuthProvider, { useAuth } from '../hooks/AuthProvider';
import WifiLostProvider from '../hooks/WifiLostProvider';

const Stack = createNativeStackNavigator();
const { Navigator, Screen } = Stack;

const RootStack = () => {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3f008c" />
      </View>
    );
  }

  return (
    <Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Screen name="Home" component={Home} />
          <Screen name="PDFViewer" component={PDFViewer} />
          <Screen name="AIStudyScreen" component={AIStudyScreen} />
        </>
      ) : (
        <Screen name="Login" component={Login} />
      )}
    </Navigator>
  );
};

export const Navigations = () => {
  return (
    <WifiLostProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </AuthProvider>
    </WifiLostProvider>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F4F1' },
});
