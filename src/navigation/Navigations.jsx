import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/home/HomeScreen';
import Login from '../screens/auth/LoginScreen';
import { SplashScreen } from '../screens/splashScreen/SplashScreen';
import PDFViewer from '../screens/home/PDFViewer';
import InboxScreen from '../screens/home/tramitesScreen';
import AuthProvider from '../hooks/AuthProvider';
import WifiLostProvider from '../hooks/WifiLostProvider';

const Stack = createNativeStackNavigator();
const { Navigator, Screen } = Stack;

export const Navigations = () => {

  return (
    <WifiLostProvider>
      <AuthProvider>
        <NavigationContainer >
          <Navigator screenOptions={{ headerShown: false }}>
            <Screen name="Splash" component={SplashScreen} />
            <Screen name="Login" component={Login} />
            <Screen name="Inbox" component={InboxScreen} />
            <Screen name='Home' component={Home} />
            <Screen name="PDFViewer" component={PDFViewer} />
          </Navigator>
        </NavigationContainer>
      </AuthProvider>
    </WifiLostProvider>
  )
}
