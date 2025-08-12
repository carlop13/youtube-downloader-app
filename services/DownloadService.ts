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
  size: number; // El tamaño real en bytes
  duration: number;
  modificationTime: number;
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
    shouldPlaySound: true, // Permitimos el sonido, pero lo controlaremos por notificación
    shouldSetBadge: false,
  }),
});

/**
 * Configura los canales de notificación para Android.
 * Uno para notificaciones silenciosas (progreso) y otro para notificaciones con sonido (finalización).
 */
async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    // Canal para notificaciones importantes (con sonido)
    await Notifications.setNotificationChannelAsync('default-channel', {
      name: 'Descargas Completadas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    // Canal para actualizaciones de progreso (SILENCIOSO)
    await Notifications.setNotificationChannelAsync('download-progress-channel', {
      name: 'Progreso de Descarga',
      importance: Notifications.AndroidImportance.DEFAULT, // Importancia baja para que no sea intrusivo
      sound: true,
      vibrationPattern: [], // Sin vibración
    });
  }
}

/**
 * Pide permisos para enviar notificaciones y configura los canales.
 */
async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      alert('Necesitamos permisos para mostrar notificaciones de descarga.');
      return;
    }
  }
  await setupNotificationChannels();
}
registerForPushNotificationsAsync();

// =================================================================
// --- LÓGICA DEL SERVICIO ---
// =================================================================

const tempDownloadDir = FileSystem.cacheDirectory + 'downloads/';

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(tempDownloadDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(tempDownloadDir, { intermediates: true });
  }
}

async function getMediaLibraryPermissions() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Lo sentimos, necesitamos permisos para guardar y ver tus videos.');
    return false;
  }
  return true;
}

/**
 * Función UNIFICADA para descargar un archivo. Devuelve el objeto para poder cancelarla.
 */
async function downloadAndSave(
  url: string, 
  filename: string, 
  onProgress: (progress: DownloadProgress) => void
): Promise<{ downloadResumable: DownloadResumable; fileUri: string | null }> {

  const hasPermissions = await getMediaLibraryPermissions();
  if (!hasPermissions) {
    throw new Error('Permisos de la galería denegados.');
  }

  const tempFileUri = FileSystem.cacheDirectory + filename;
  const notificationId = 'download-progress';
  let lastNotifiedProgress = -1;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    tempFileUri,
    {},
    (p: FileSystem.DownloadProgressData) => {
      const progress = p.totalBytesWritten / p.totalBytesExpectedToWrite;
      onProgress({ ...p, progress });
      const currentProgress = Math.floor(progress * 100);

      // Solo actualizamos la notificación si el porcentaje ha cambiado para evitar spam
      if (currentProgress > lastNotifiedProgress) {
        lastNotifiedProgress = currentProgress;
        Notifications.scheduleNotificationAsync({
          identifier: notificationId, // Usamos el mismo ID para reemplazar la anterior
          content: {
            title: `Descargando: ${filename}`,
            body: `${currentProgress}% completado`,
            sound: false, // Forzamos a que no tenga sonido en iOS
            vibrate: [], // Forzamos a que no vibre
            autoDismiss: false, // La notificación no se irá sola
            sticky: true, // En Android, hace que sea más difícil de descartar
          },
          trigger: { 
            channelId: 'download-progress-channel', // Le decimos a Android que use el canal silencioso
          },
        });
      }
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    
    if (result) {
      const asset = await MediaLibrary.createAssetAsync(result.uri);
      const album = await MediaLibrary.getAlbumAsync('Snapcodrilo');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Snapcodrilo', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      console.log('Video guardado en la galería!');
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
      
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await Notifications.scheduleNotificationAsync({
          content: { 
            title: '¡Descarga Completada!', 
            body: `"${filename}" se ha guardado.`,
            sound: true, // Esta sí tiene sonido
          },
          trigger: { 
            channelId: 'default-channel', // Usa el canal por defecto (con sonido)
            seconds: 1 
          },
      });

      return { downloadResumable, fileUri: result.uri };
    }
  } catch (e: any) {
    console.error('Error durante la descarga o guardado:', e);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    await Notifications.scheduleNotificationAsync({
        content: { title: 'Error en la Descarga', body: `No se pudo descargar "${filename}".`, sound: true },
        trigger: { channelId: 'default-channel', seconds: 1 },
    });
    throw new Error(`La descarga falló: ${e.message}`);
  }
  
  return { downloadResumable, fileUri: null };
};

/**
 * Abre el diálogo nativo para compartir un archivo.
 */
async function shareFile(file: DownloadedFile): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    alert('La funcionalidad de compartir no está disponible en este dispositivo.');
    return;
  }
  try {
    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    if (!fileInfo.exists) {
      alert("El archivo ya no existe. Por favor, refresca la lista de descargas.");
      return;
    }
    await Sharing.shareAsync(file.uri);
  } catch (error: any) {
    console.error("Error al compartir el archivo:", error);
    alert(`No se pudo compartir el archivo. Error: ${error.message}`);
  }
};

/**
 * Obtiene la lista de archivos del álbum de la app en la galería.
 */
async function getDownloadedFiles(): Promise<DownloadedFile[]> {
    const hasPermissions = await getMediaLibraryPermissions();
    if (!hasPermissions) return [];

    const album = await MediaLibrary.getAlbumAsync('Snapcodrilo');
    if (!album) return [];

    const { assets } = await MediaLibrary.getAssetsAsync({
        album: album,
        sortBy: [MediaLibrary.SortBy.creationTime],
        mediaType: [MediaLibrary.MediaType.video],
        first: album.assetCount, 
    });

    const fileDetails = await Promise.all(
      assets.map(async (asset) => {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        return {
            id: asset.id,
            filename: asset.filename,
            uri: asset.uri,
            size: fileInfo.exists ? fileInfo.size : 0,
            modificationTime: asset.modificationTime,
            exists: fileInfo.exists,
            duration: asset.duration,
        };
      })
    );
    return fileDetails;
}

/**
 * Limpia un string para que sea un nombre de archivo válido y legible.
 * Reemplaza caracteres ilegales por guiones y colapsa espacios múltiples.
 * @param title El título original del video.
 * @returns Un string seguro para usar como nombre de archivo.
 */
function sanitizeFilename(title: string): string {
  // Reemplaza los caracteres ilegales en nombres de archivo (\ / : * ? " < > |) con un espacio
  const sanitized = title.replace(/[\\/:*?"<>|]/g, ' ');
  // Colapsa múltiples espacios o guiones en uno solo y recorta los extremos
  return sanitized.replace(/\s+/g, ' ').trim();
}

// Exportamos un objeto único con nuestras funciones.
export const DownloadService = {
  downloadAndSave,
  shareFile,
  getDownloadedFiles,
  sanitizeFilename,
};