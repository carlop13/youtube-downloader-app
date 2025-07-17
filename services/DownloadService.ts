import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// =================================================================
// --- TIPOS (INTERFACES) ---
// Definimos los tipos aquí para que puedan ser importados y usados en toda la app.
// =================================================================

/**
 * Describe la estructura de un archivo que ya ha sido descargado.
 * Esto es lo que nuestra pantalla `downloads.tsx` espera recibir.
 */
export interface DownloadedFile {
  name: string;
  uri: string;
  size?: number;
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


// =================================================================
// --- LÓGICA DEL SERVICIO ---
// =================================================================

// Directorio donde se guardarán todas las descargas.
const downloadDir = FileSystem.documentDirectory + 'downloads/';

/**
 * Asegura que el directorio de descargas exista antes de usarlo.
 */
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(downloadDir);
  if (!dirInfo.exists) {
    console.log("Creando directorio de descargas:", downloadDir);
    await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
  }
}

/**
 * Descarga un archivo desde una URL y guarda el progreso.
 * @param url La URL del archivo a descargar.
 * @param filename El nombre con el que se guardará el archivo.
 * @param onProgress Callback que se ejecuta con el progreso de la descarga.
 * @returns La URI local del archivo o null si falla.
 */
async function downloadFile(
  url: string, 
  filename: string, 
  onProgress: (progress: DownloadProgress) => void
): Promise<string | null> {

  // La descarga en web es diferente, la manejamos por separado (no aplica en móvil).
  if (Platform.OS === 'web') {
    alert("La descarga en web se maneja directamente en el navegador.");
    return null;
  }

  await ensureDirExists();
  const fileUri = downloadDir + filename;

  // Creamos el objeto de descarga con su callback para el progreso
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      onProgress({ ...downloadProgress, progress });
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (result) {
      console.log('Descarga finalizada, guardada en:', result.uri);
      return result.uri;
    }
    return null;
  } catch (e) {
    console.error('Error en la descarga del archivo:', e);
    return null;
  }
};

/**
 * Abre el diálogo nativo para compartir un archivo.
 * @param fileUri La URI local del archivo a compartir.
 */
async function shareFile(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    alert('La funcionalidad de compartir no está disponible en este dispositivo.');
    return;
  }
  await Sharing.shareAsync(fileUri);
};


/**
 * Obtiene y devuelve una lista de todos los archivos descargados.
 * @returns Un array de objetos DownloadedFile.
 */
async function getDownloadedFiles(): Promise<DownloadedFile[]> {
  await ensureDirExists();
  const fileNames = await FileSystem.readDirectoryAsync(downloadDir);
  
  const fileDetails = await Promise.all(
    fileNames.map(async (fileName): Promise<DownloadedFile> => {
      const fileUri = downloadDir + fileName;
      // Usamos un try-catch por si un archivo se borra mientras leemos sus datos
      try {
        const info = await FileSystem.getInfoAsync(fileUri) as FileSystem.FileInfo & { size?: number, modificationTime?: number };
        
        return {
          name: fileName,
          uri: fileUri,
          size: info.exists ? info.size : undefined,
          modificationTime: info.exists ? info.modificationTime : undefined,
          exists: info.exists,
        };
      } catch (error) {
        // Si hay un error al leer un archivo, lo marcamos como no existente.
        return {
          name: fileName,
          uri: fileUri,
          exists: false,
        };
      }
    })
  );
  
  // Filtramos por si acaso y ordenamos por el más reciente.
  return fileDetails
    .filter(file => file.exists)
    .sort((a, b) => (b.modificationTime || 0) - (a.modificationTime || 0));
};

// Exportamos un objeto único 'DownloadService' que contiene todas nuestras funciones.
// Esto hace que sea fácil de importar y usar en otras partes de la app.
export const DownloadService = {
  downloadFile,
  shareFile,
  getDownloadedFiles,
};