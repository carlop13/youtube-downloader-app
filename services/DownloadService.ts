import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// =================================================================
// --- TIPOS (INTERFACES) ---
// =================================================================

/**
 * Describe la estructura de un archivo que ya ha sido descargado y está en la galería.
 */
export interface DownloadedFile {
  id: string; // ID del asset en la MediaLibrary
  filename: string;
  uri: string;
  size?: number;
  duration?: number;
  modificationTime?: number;
  exists: boolean;
}

/**
 * Describe el progreso de una descarga en curso.
 */
export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}
export type DownloadResumable = FileSystem.DownloadResumable;

// =================================================================
// --- CONFIGURACIÓN DE NOTIFICACIONES ---
// =================================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      alert('Necesitamos permisos para mostrar notificaciones de descarga.');
      return false;
    }
  }
  return true;
}
registerForPushNotificationsAsync();

// =================================================================
// --- LÓGICA DEL SERVICIO ---
// =================================================================

// Usaremos el directorio de documentos para descargas temporales, es más estable.
const tempDownloadDir = FileSystem.documentDirectory + 'downloads/';

/**
 * Asegura que el directorio de descargas exista antes de usarlo.
 */
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(tempDownloadDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(tempDownloadDir, { intermediates: true });
  }
}

/**
 * Pide permisos para acceder a la galería/mediateca.
 */
async function getMediaLibraryPermissions() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Lo sentimos, necesitamos permisos para guardar el video en tus archivos.');
    return false;
  }
  return true;
}

/**
 * Inicia una descarga y devuelve el objeto para poder cancelarla.
 */
async function startDownload(
  url: string, 
  filename: string, 
  onProgress: (progress: DownloadProgress) => void
): Promise<DownloadResumable> {
  await ensureDirExists();
  const fileUri = tempDownloadDir + filename;

  // Notificación de inicio (opcional, para feedback inmediato)
  await Notifications.scheduleNotificationAsync({
    identifier: 'download-progress',
    content: {
      title: 'Iniciando descarga...',
      body: filename,
    },
    trigger: null,
  });

  const callback = (p: FileSystem.DownloadProgressData) => {
    const progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
    onProgress({ ...p, progress });
    // Actualiza la notificación en segundo plano
    Notifications.scheduleNotificationAsync({
        identifier: 'download-progress',
        content: {
            title: 'Descargando...',
            body: `${filename}`,
            subtitle: `${(progress * 100).toFixed(0)}% completado`,
        },
        trigger: null,
    });
  };
  
  return FileSystem.createDownloadResumable(url, fileUri, {}, callback);
};

/**
 * Guarda el archivo descargado en la galería pública, en un álbum específico.
 */
async function saveToGallery(fileUri: string, filename: string): Promise<void> {
  const hasPermissions = await getMediaLibraryPermissions();
  if (!hasPermissions) {
    throw new Error('Permisos de la galería denegados.');
  }

  try {
    console.log(`Intentando crear asset desde la URI temporal: ${fileUri}`);
    const asset = await MediaLibrary.createAssetAsync(fileUri);

    console.log(`Asset creado con ID: ${asset.id}. Moviendo al álbum 'Snapcodrilo'...`);
    const album = await MediaLibrary.getAlbumAsync('Snapcodrilo');
    if (album == null) {
      await MediaLibrary.createAlbumAsync('Snapcodrilo', asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }
    
    console.log('Video guardado exitosamente en la galería!');
    
    // Limpiamos el archivo temporal después de una copia exitosa
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    
    // Notificación de éxito
    await Notifications.cancelScheduledNotificationAsync('download-progress'); // Cancela la de progreso
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '¡Descarga Completada!',
            body: `"${filename}" se ha guardado en tu galería.`,
        },
        trigger: { seconds: 1 },
    });
  } catch (e: any) {
    console.error('Error detallado al guardar en la galería:', e);
    // Este throw enviará el error de vuelta a la pantalla para que pueda ser mostrado en una alerta.
    throw new Error(`No se pudo guardar el video en la galería. Causa: ${e.message}`);
  }
}

/**
 * Abre el diálogo nativo para compartir un archivo.
 */
async function shareFile(fileUri: string): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
      alert('La funcionalidad de compartir no está disponible en este dispositivo.');
      return;
    }
    await Sharing.shareAsync(fileUri);
};

/**
 * Obtiene la lista de archivos del álbum de la app en la galería.
 */
async function getDownloadedFiles(): Promise<DownloadedFile[]> {
    const hasPermissions = await getMediaLibraryPermissions();
    if (!hasPermissions) return [];

    const album = await MediaLibrary.getAlbumAsync('Snapcodrilo');
    if (!album) {
      console.log("El álbum 'Snapcodrilo' no existe, no hay archivos para mostrar.");
      return [];
    }

    const assets = await MediaLibrary.getAssetsAsync({
        album: album,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.video],
        first: 100, // Obtiene los últimos 100 videos del álbum
    });

    return assets.assets.map(asset => ({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        size: asset.width * asset.height, // Esto es una estimación, MediaLibrary no provee el tamaño en bytes
        modificationTime: asset.modificationTime,
        exists: true,
        duration: asset.duration,
    }));
}

// Exportamos un objeto único 'DownloadService' que contiene todas nuestras funciones.
export const DownloadService = {
  startDownload,
  saveToGallery,
  shareFile,
  getDownloadedFiles,
};