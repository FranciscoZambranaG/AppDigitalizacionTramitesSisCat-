# DigiD — Digitalización de Trámites SisCat

App móvil (React Native + **Expo SDK 54**, managed) para escanear, adjuntar y enviar
documentos de trámites del sistema **SisCat** de la Dirección de Administración
Geográfica y Catastro del Gobierno Autónomo Municipal de Cochabamba.

Es una adaptación a Expo del proyecto original `app-digitalizaciontramites-siscat`
(React Native CLI). El detalle de la migración y de los reemplazos de módulos
nativos está en [`MIGRACION-EXPO.md`](./MIGRACION-EXPO.md).

## Requisitos

- **Node 20 o 22 LTS** (con Node 24 falla la resolución de config plugins; para
  correr en Expo Go igual funciona, pero se recomienda 20/22).
- App **Expo Go** en un teléfono Android/iOS.

## Arranque

```bash
npm install
npm start          # abre Metro + QR
```

Escanea el QR con **Expo Go** (el teléfono y la PC deben estar en la misma red
Wi-Fi). Si la red bloquea la conexión directa:

```bash
npx expo start --tunnel
```

## Configuración del backend

La URL del backend y los tipos de archivo permitidos se definen en
`app.json → expo.extra` y se leen desde `src/config/env.js`.

| Variable | Default |
|---|---|
| `URL_BASE` | `https://bkdgd.catastrocbba.com` |
| `ALLOWED_FILE_TYPES` | lista de MIME types |

Para apuntar a otro servidor sin tocar `app.json`, crea un `.env` en la raíz:

```
EXPO_PUBLIC_URL_BASE=http://192.168.x.x:8000
```

## Estructura

```
App.js / index.js         entrada (providers + NavigationContainer)
src/
├── api/                   baseUrl
├── config/                env (expo-constants)
├── navigation/            stack de React Navigation
├── screens/               Splash · Login · Trámites · Bandeja · PDFViewer
├── components/            modales, listas, botones
├── hooks/                 AuthProvider, WifiLostProvider
├── services/              fileServices, scanService, tramiteService, ...
└── utils/                 pdf, resize, biometría, credenciales seguras
```

## Limitaciones en Expo Go

- Escáner sin recorte automático de bordes (usa la cámara del sistema).
- En Android el PDF se abre con una app externa (Drive / visor de PDF).

Detalle y alternativa con EAS Build en [`MIGRACION-EXPO.md`](./MIGRACION-EXPO.md).

## Flujo de trabajo

Trabaja en tu rama → commit y push → abre un Pull Request para revisión.
