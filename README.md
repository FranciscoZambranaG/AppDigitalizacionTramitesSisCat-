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

## Módulo "Estudiar con la IA" (backend `server/`)

Backend Node aparte en [`server/`](./server) (ver [`server/README.md`](./server/README.md)).
La app se conecta vía `EXPO_PUBLIC_AI_BACKEND_URL`. `AIStudyScreen` (se abre
desde un documento ya escaneado) clasifica el tipo de documento y muestra
preguntas preescritas, con Ollama `qwen3-vl:2b` (`AI_PROVIDER` en `server/.env`).
Sin el backend corriendo, esa pantalla no clasifica ni responde. Solo móvil.

## Módulo "Resoluciones" (carpeta `resoluciones/`)

Para digitalizar la tabla "RELACIÓN DE SUPERFICIE" de las resoluciones y volcarla
a la **Hoja2** de `plantilla-ph.xlsm`. Pensado para entregarse como módulo del
ERP `proyecto-erp` (FastAPI + PostgreSQL + React). Ver
[`resoluciones/README.md`](./resoluciones/README.md).

- **App móvil** (`ResolucionesScreen`, botón en la pantalla principal): escanea
  las páginas + N° de resolución + nombre y **las sube** (`EXPO_PUBLIC_ERP_BACKEND_URL`).
  Lista "mis resoluciones" con su estado. No hace OCR ni Excel.
- **`resoluciones/backend/`** (FastAPI): guarda/lista/entrega las resoluciones por usuario.
- **`resoluciones/frontend/`** (Vite + React, diseño del ERP): OCR en el navegador
  (`ocr.catastrocbba.com`), editor de la tabla y generación del `.xlsm`.

## Estructura

```
App.js / index.js         entrada (providers + NavigationContainer)
src/
├── api/                   baseUrl
├── config/                env (expo-constants)
├── navigation/            stack de React Navigation
├── screens/               Login · Home · PDFViewer · AIStudy · Resoluciones
├── components/            modales, listas, botones
├── hooks/                 AuthProvider, WifiLostProvider
├── services/              fileServices, scanService, authService, aiDocService
└── utils/                 pdf, resize, biometría, credenciales seguras
```

## Limitaciones en Expo Go

- Escáner sin recorte automático de bordes (usa la cámara del sistema).
- En Android el PDF se abre con una app externa (Drive / visor de PDF).

Detalle y alternativa con EAS Build en [`MIGRACION-EXPO.md`](./MIGRACION-EXPO.md).

## Flujo de trabajo

Trabaja en tu rama → commit y push → abre un Pull Request para revisión.
