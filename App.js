import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { Navigations } from './src/navigation/Navigations';
import { palette } from './src/utils/theme';
import PhotoCropModal from './src/components/PhotoCropModal';
import { setPhotoCropOpener } from './src/utils/photoCropController';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const cropModalRef = useRef(null);
  useEffect(() => {
    setPhotoCropOpener((uri) => cropModalRef.current?.open(uri));
  }, []);

  // Si las fuentes no cargan aun (o fallan), se muestra un fondo neutro y luego
  // la app; nunca se bloquea el arranque.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <StatusBar style="auto" />
          <Navigations />
          <PhotoCropModal ref={cropModalRef} />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
