// --- CONFIGURACIÓN DE CLAVES DE API ---
const RAPIDAPI_KEYS = [
  "07b50fa5acmsha0d4c8ee6111aa4p186610jsnb231ff9a5ac7", // Clave #1 (Principal)
  "c723d030aamshbfa77f58f63d24ep1a3e87jsn73d6859b7732", // Clave #2
  "54dc0bede2msh5f9afe6a4a0d6c9p192b75jsn96e77dd7daf2", // Clave #3
  "d066f3c628msh89d0a8dfc291442p179cddjsnff49af9598f0", // Clave #4
  "69069d4fd3msh4cf4c4f456c02f9p17f158jsndb31848c91a3", // Clave #5
  "e56c8765ddmsh378be11fb068007p1b1f58jsn77cb05001ffe", // Clave #6
  "c45f0c4d42msh723620516944473p106dd5jsn45346e5c6f2a", // Clave #7
];

export interface VideoInfo {
  title: string;
  thumbnail: string;
  downloadUrl: string;
  filename: string;
  quality: string;
  duration?: string;
  viewCount?: string;
}

export interface VideoFormat {
  quality: string;
  mimeType: string;
  url: string;
  hasAudio: boolean;
  filesize?: number;
}

interface ApiResponse {
  title: string;
  thumbnails: Array<{ url: string; width: number; height: number }>;
  videos: {
    items: VideoFormat[];
  };
  duration?: string;
  viewCount?: string;
}

// --- FUNCIÓN PARA EXTRAER EL ID DEL VIDEO ---
function getYouTubeID(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.split('/')[1];
    }
    return null;
  } catch (e) {
    console.error("Error al parsear la URL:", e);
    return null;
  }
}

/**
 * Llama a la API de RapidAPI para obtener los detalles de un video.
 */
async function fetchVideoInfo(videoID: string, apiKey: string): Promise<ApiResponse> {
  const options = {
    method: 'GET',
    url: 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details',
    params: { videoId: videoID },
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
    }
  };

  console.log(`Intentando obtener detalles con la clave que termina en: ...${apiKey.slice(-6)}`);
  
  const response = await fetch(`${options.url}?${new URLSearchParams(options.params)}`, {
    method: options.method,
    headers: options.headers,
  });

  if (response.status === 429) {
    throw new Error('Límite de la API key alcanzado.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`Error de RapidAPI: ${response.status}`, errorData);
    throw new Error(`La API de terceros respondió con un error: ${response.status}`);
  }

  return response.json();
}

/**
 * Función principal para obtener el enlace de descarga directo.
 */
export async function getDownloadableLink(videoUrl: string, desiredQuality: string = '720p'): Promise<VideoInfo | null> {
  const videoID = getYouTubeID(videoUrl);
  if (!videoID) {
    console.error("URL de YouTube no válida.");
    return null;
  }

  // Iteramos sobre cada una de nuestras claves de API
  for (const apiKey of RAPIDAPI_KEYS) {
    try {
      const info = await fetchVideoInfo(videoID, apiKey);

      if (!info || !info.videos || !info.videos.items) {
        console.warn("La respuesta de RapidAPI no tiene el formato esperado. Intentando con la siguiente clave...");
        continue;
      }
      
      // Lógica para encontrar el mejor formato con audio y video
      let format: VideoFormat | null = null;
      const combinedFormats = info.videos.items.filter(f => f.hasAudio && f.mimeType.includes('mp4'));
      
      if (combinedFormats.length > 0) {
        format = combinedFormats.find(f => f.quality === desiredQuality) || null;
        if (!format) {
            console.warn(`Calidad combinada ${desiredQuality} no encontrada, usando la mejor disponible.`);
            format = combinedFormats[0];
        }
      }
      
      if (format && format.url) {
        const filename = `${info.title.replace(/[^a-z0-9_.-]/gi, '-')}-${format.quality}.mp4`;
        const thumbnailUrl = info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : '';

        console.log(`¡Éxito! Enlace encontrado con la clave que termina en ...${apiKey.slice(-6)}`);
        
        return {
          title: info.title,
          thumbnail: thumbnailUrl,
          downloadUrl: format.url,
          filename: filename,
          quality: format.quality,
          duration: info.duration,
          viewCount: info.viewCount
        };
      } else {
        console.error("No se encontró ningún formato MP4 con audio para este video.");
        return null;
      }

    } catch (error) {
      console.error(`Falló la clave ...${apiKey.slice(-6)}: ${(error as Error).message}`);
    }
  }

  console.error("Todas las claves de API han fallado o han alcanzado su límite.");
  return null;
}

/**
 * Obtiene todas las calidades disponibles para un video
 */
export async function getAvailableQualities(videoUrl: string): Promise<string[]> {
  const videoID = getYouTubeID(videoUrl);
  if (!videoID) return [];

  for (const apiKey of RAPIDAPI_KEYS) {
    try {
      const info = await fetchVideoInfo(videoID, apiKey);
      
      if (!info || !info.videos || !info.videos.items) continue;
      
      const combinedFormats = info.videos.items.filter(f => f.hasAudio && f.mimeType.includes('mp4'));
      const qualities = combinedFormats.map(f => f.quality).filter((q, i, arr) => arr.indexOf(q) === i);
      
      return qualities.sort((a, b) => {
        const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
        return qualityOrder.indexOf(b) - qualityOrder.indexOf(a);
      });
    } catch (error) {
      continue;
    }
  }
  
  return [];
}