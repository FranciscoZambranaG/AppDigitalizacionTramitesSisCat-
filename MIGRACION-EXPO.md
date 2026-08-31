# Migración: React Native CLI → Expo (managed)

El código proviene del repo `app-digitalizaciontramites-siscat` (React Native CLI 0.78,
carpetas `android/`/`ios/` nativas). Se adaptó para correr en **Expo SDK 54 managed**
(RN 0.81, React 19.1), sin Android Studio y sin build nativo: se prueba con **Expo Go**.

> Se usa SDK 54 (no la 57) porque la Expo Go publicada en las tiendas todavía no
> soporta SDK 57.

## Config plugins y Node

El `app.json` **no lleva `plugins`**: los config plugins solo aplican a builds
nativos (EAS / `expo prebuild`), no a Expo Go, y además Node 24 rompe su
resolución (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). Si en el futuro se
hace un build nativo, hay que:
1. Volver a agregar los plugins (`expo-secure-store`, `expo-image-picker` con sus
   permisos, `expo-local-authentication`, `expo-splash-screen`, `expo-sharing`).
2. Usar **Node 20 o 22 LTS** (no Node 24).

## Cómo correr

```bash
npm start          # abre Metro + QR
```

Escanea el QR con **Expo Go** (Android/iOS). El teléfono y la PC deben estar en la
misma red Wi-Fi. Si la red bloquea la conexión directa: `npx expo start --tunnel`.

## Backend / variables de entorno

Antes se usaba `react-native-config` + `.env`. Ahora la config vive en
`app.json → expo.extra` y se lee desde `src/config/env.js`.

| Variable | Dónde se define | Default |
|---|---|---|
| `URL_BASE` | `app.json` → `expo.extra.URL_BASE` | `https://bkdgd.catastrocbba.com` |
| `ALLOWED_FILE_TYPES` | `app.json` → `expo.extra.ALLOWED_FILE_TYPES` | lista de MIME types |

También se pueden sobreescribir con un archivo `.env` en la raíz usando el prefijo
`EXPO_PUBLIC_` (soporte nativo de Expo):

```
EXPO_PUBLIC_URL_BASE=http://192.168.x.x:8000
```

## Reemplazo de módulos nativos

| Módulo original (RN CLI) | Reemplazo Expo | Archivo |
|---|---|---|
| `react-native-config` | `expo-constants` + `expo.extra` | `src/config/env.js`, `src/api/baseUrl.js` |
| `react-native-vector-icons/*` | `@expo/vector-icons` (Feather / Ionicons / AntDesign) | componentes y pantallas |
| `react-native-keychain` | `expo-secure-store` | `src/utils/credencialesSeguras.js` |
| `react-native-biometrics` / `react-native-touch-id` | `expo-local-authentication` | `src/utils/biometria.js` |
| `react-native-fs` | `expo-file-system/legacy` | `src/services/fileServices.js` |
| `react-native-image-resizer` | `expo-image-manipulator` | `src/utils/redimensionarImagen.js` |
| `react-native-pdf-from-image` | `pdf-lib` + `expo-file-system` | `src/utils/crearPdfDesdeImagenes.js` |
| `react-native-document-scanner-plugin` | `expo-image-picker` (cámara) | `src/services/scanService.js` |
| `@react-native-documents/picker` | `expo-document-picker` | `src/utils/abrirSelectorArchivo.js`, `seleccionarPDF.js` |
| `react-native-pdf` | `expo-intent-launcher` / `expo-sharing` / WebView (iOS) | `src/screens/home/PDFViewer.js` |
| `react-native-permissions` | permisos por-módulo de Expo | `src/utils/requestPermmissions.js` (ahora no-op) |
| `PermissionsAndroid` (storage) | innecesario (sandbox de la app) | `src/utils/requestPermmissions.js` |

Se conservan sin cambios: `@react-navigation/*`, `react-native-paper`,
`react-native-animatable`, `axios`, `qs`, `@react-native-async-storage/async-storage`.

Entrada de la app: `index.js` → `App.js` (providers + `NavigationContainer`).
Se eliminó `expo-router` (el scaffold inicial lo traía); se usa React Navigation
igual que el repo original.

## Limitaciones conocidas en Expo Go

1. **Escáner de documentos**: sin detección/recorte automático de bordes. Se usa la
   cámara del sistema con recorte manual (`allowsEditing`). Se pueden capturar
   varias páginas seguidas.
2. **Visor de PDF**: en Android no hay visor embebido; el PDF se abre con una app
   externa (Drive, visor de PDF). En iOS se muestra dentro de un WebView.
3. **Guardado de credenciales tras PIN/patrón**: `expo-local-authentication` ya
   ofrece el PIN/patrón del dispositivo como fallback; `expo-secure-store` guarda
   las credenciales en el Keystore/Keychain. No hay un flujo separado "solo PIN"
   como el de `react-native-keychain` con `DEVICE_PASSCODE`.

Si alguna de estas limitaciones es bloqueante, la alternativa (siempre sin Android
Studio) es un **development build con EAS Build** (compilación en la nube) que sí
permite módulos nativos como `react-native-pdf` o el escáner con bordes.

## Pantallas

`Splash → Login → Inbox (Trámites) → Home (Bandeja de documentos) → PDFViewer`
