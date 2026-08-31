# 📲 Digitalización de Trámites - App SisCat

Aplicación móvil desarrollada en **React Native**, bajo la arquitectura **MVVM**, para escanear, adjuntar y enviar documentos relacionados con trámites del sistema **SisCat**.

## 🧱 Estructura del Proyecto

```
src/
├── api/        # Llamadas a APIs externas
├── components/ # Componentes reutilizables
├── screens/    # Pantallas principales
├── hooks/      # Hooks personalizados
├── navigation/ # Configuración de navegación
├── services/   # Servicios como autenticación y almacenamiento
├── store/      # Gestión de estado (Redux/Zustand)
├── utils/      # Funciones auxiliares
├── assets/     # Recursos (imágenes, fuentes)
├── config/     # Configuración global
```

## ⚙️ Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto. Puedes usar `.env.example` como plantilla:

```env
# Ejemplo de configuración (.env.example)
# Copia este archivo a .env y actualiza los valores según tu entorno

# Dirección del backend (reemplaza con la URL correspondiente)
URL_BASE=http://tu-servidor-backend:puerto

# Tipos de archivo soportados por la app (MIME types)
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed,application/octet-stream
```

> **Nota**: Nunca subas el archivo `.env` con valores reales al repositorio. Asegúrate de que esté incluido en tu `.gitignore`.

## 📄 Tipos de archivo soportados

La aplicación permite adjuntar los siguientes formatos de archivo:

- **Documentos**: PDF, DOC, DOCX
- **Hojas de cálculo**: XLS, XLSX
- **Imágenes**: JPG/JPEG
- **Archivos comprimidos**: ZIP, RAR

## ▶️ Pasos para ejecutar la app en modo desarrollo

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Iniciar el servidor Metro (bundler)**
   ```bash
   npm start
   ```

3. **Ejecutar la app en Android**
   ```bash
   npm run android
   ```

## 📦 Generar APK (modo release)

1. **Generar clave de firma**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guarda `my-release-key.keystore` en: `android/app/`

2. **Configurar credenciales en `android/gradle.properties`**
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=tu_contraseña
   MYAPP_RELEASE_KEY_PASSWORD=tu_contraseña
   ```

3. **Configurar firma en `android/app/build.gradle`**
   ```gradle
   signingConfigs {
       release {
           storeFile file(MYAPP_RELEASE_STORE_FILE)
           storePassword MYAPP_RELEASE_STORE_PASSWORD
           keyAlias MYAPP_RELEASE_KEY_ALIAS
           keyPassword MYAPP_RELEASE_KEY_PASSWORD
       }
   }

   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           shrinkResources false
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

4. **Generar el APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   El archivo se generará en: `android/app/build/outputs/apk/release/app-release.apk`

## 🧪 Subir cambios al repositorio

- Realiza los cambios necesarios en tu rama.
- Haz commit y push de los cambios.
- Genera un Merge Request (MR) para revisión y aprobación por parte del equipo o del ingeniero responsable.

## 👨‍💻 Tecnologías utilizadas

- React Native
- JavaScript (ES6+)
- Axios
- AsyncStorage
- @react-native-documents/picker
- Metro Bundler
- Firebase / API REST (según backend)