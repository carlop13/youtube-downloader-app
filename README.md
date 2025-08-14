# Snapcodrilo 🐊

Una aplicación móvil para descargar tus videos favoritos de YouTube, construida con React Native y Expo.

## Acerca del Proyecto

Snapcodrilo es una aplicación móvil diseñada para buscar, previsualizar y descargar videos de YouTube directamente al almacenamiento del dispositivo. La aplicación se enfoca en una experiencia de usuario limpia y funcional, permitiendo gestionar las descargas en una galería integrada.

La arquitectura utiliza una API externa (RapidAPI) para obtener los enlaces de descarga de forma segura, protegiendo la clave de API y manejando los límites de uso a través de un sistema de rotación de claves.

### ✨ Características Principales

- **Búsqueda de Videos:** Pega cualquier URL de YouTube (`youtube.com` o `youtu.be`) para obtener la información del video.
- **Selector de Calidad:** Visualiza las calidades disponibles (1080p, 720p, etc.) y elige la que prefieras para la descarga.
- **Descarga a la Galería:** Los videos se guardan directamente en la galería de tu teléfono, dentro de un álbum dedicado llamado "Snapcodrilo".
- **Notificaciones Nativas:** Recibe notificaciones de progreso mientras se descarga un video y una notificación final cuando se completa.
- **Galería Integrada:**
  - Visualiza todos tus videos descargados con miniaturas generadas automáticamente.
  - Busca en tus descargas por nombre.
  - Comparte los videos con otras aplicaciones.
  - Elimina los videos para liberar espacio.
- **Interfaz Adaptable:** Diseñada para funcionar en diferentes tamaños de pantalla, respetando las áreas seguras (notch, isla dinámica, etc.).
- **Rotación de Claves de API:** Utiliza un sistema de múltiples claves de API para maximizar el uso de los planes gratuitos y asegurar la continuidad del servicio.

### 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo
- **Lenguaje:** TypeScript
- **Navegación:** Expo Router (File-based routing)
- **API Externa:** RapidAPI (YouTube Media Downloader)
- **Iconos:** Lucide React Native
- **Manejo de Archivos y Galería:** `expo-media-library`, `expo-file-system`, `expo-sharing`
- **Funcionalidades Nativas:** `expo-notifications`, `expo-video-thumbnails`

### 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo.

#### 1. Clonar el repositorio
```bash
git clone https://github.com/carlop13/youtube-downloader-app.git
cd youtube-downloader-app
```

#### 2. Instalar dependencias
```bash
npm install
```

#### 3. Crear una Build de Desarrollo

Dado que la app utiliza librerías nativas (expo-media-library, etc.), no funcionará correctamente en la app Expo Go. Es necesario crear una build de desarrollo.
```bash
# Inicia sesión en tu cuenta de Expo
eas login

# Construye la app para Android o iOS
eas build --profile development --platform android
```
Sigue las instrucciones para descargar e instalar el APK resultante en tu dispositivo.

#### 4. Iniciar el servidor de desarrollo

Una vez instalada la build de desarrollo, inicia el servidor:
```bash
npm start
```

### 📝 Ideas y Mejoras Futuras

- **Implementar búsqueda por voz en la pantalla de descargas.**
- **Añadir soporte para descargar solo el audio en formato MP3.**
- **Guardar la calidad de descarga preferida en la configuración (AsyncStorage).**
- **Permitir al usuario elegir la carpeta de descarga.**