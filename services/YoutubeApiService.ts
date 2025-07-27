// --- TIPOS DE DATOS ---
// Define la estructura de una calidad de video individual.
export interface VideoQuality {
  quality: string;
  url: string;
}

// Define la estructura completa de la información que la app necesita.
export interface VideoDetails {
  title: string;
  thumbnail: string;
  qualities: VideoQuality[]; // Una lista de las calidades disponibles
}

// Tipos internos para parsear la respuesta de la API de RapidAPI
interface ApiFormat {
  url: string;
  quality: string;
  hasAudio: boolean;
  mimeType: string;
}

interface ApiInfo {
  title: string;
  thumbnails: { url: string }[];
  videos: {
    items: ApiFormat[];
  };
}

// --- CONFIGURACIÓN DE CLAVES DE API ---
const RAPIDAPI_KEYS: string[] = [
  "07b50fa5acmsha0d4c8ee6111aa4p186610jsnb231ff9a5ac7",
  "c723d030aamshbfa77f58f63d24ep1a3e87jsn73d6859b7732",
  "54dc0bede2msh5f9afe6a4a0d6c9p192b75jsn96e77dd7daf2",
  "d066f3c628msh89d0a8dfc291442p179cddjsnff49af9598f0",
  "69069d4fd3msh4cf4c4f456c02f9p17f158jsndb31848c91a3",
  "e56c8765ddmsh378be11fb068007p1b1f58jsn77cb05001ffe",
  "c45f0c4d42msh723620516944473p106dd5jsn45346e5c6f2a",
];

// --- FUNCIONES AUXILIARES ---
function getYouTubeID(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
    if (urlObj.hostname === 'youtu.be') return urlObj.pathname.split('/')[1];
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchVideoInfo(videoID: string, apiKey: string): Promise<ApiInfo> {
  const options = {
    method: 'GET',
    url: 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details',
    params: { videoId: videoID },
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
    }
  };
  const response = await fetch(`${options.url}?${new URLSearchParams(options.params)}`, {
    method: options.method,
    headers: options.headers,
  });
  if (response.status === 429) throw new Error('Límite de la API key alcanzado.');
  if (!response.ok) throw new Error(`La API respondió con error: ${response.status}`);
  return response.json();
}


// --- FUNCIÓN PRINCIPAL EXPORTADA ---
/**
 * Obtiene los detalles y todos los enlaces de descarga de un video en UNA SOLA PETICIÓN.
 * Rota las claves de API si una falla, hasta agotar todas las opciones.
 */
export async function getVideoDetails(videoUrl: string): Promise<VideoDetails | null> {
  const videoID = getYouTubeID(videoUrl);
  if (!videoID) {
    console.error("URL de YouTube no válida.");
    return null;
  }

  // Iteramos sobre cada una de nuestras claves de API
  for (const apiKey of RAPIDAPI_KEYS) {
    try {
      console.log(`Intentando obtener detalles con la clave que termina en: ...${apiKey.slice(-6)}`);
      // Intentamos obtener la información con la clave actual
      const info = await fetchVideoInfo(videoID, apiKey);

      // Si la respuesta no tiene el formato esperado, la consideramos un fallo y probamos la siguiente clave.
      if (!info?.videos?.items) {
          console.warn("Respuesta de API inesperada. Intentando con la siguiente clave...");
          continue; // Pasa a la siguiente iteración del bucle (siguiente clave)
      }
      
      // Filtramos solo los formatos MP4 que tienen audio y una URL válida
      const combinedFormats = info.videos.items
        .filter(f => f.hasAudio && f.mimeType.includes('mp4') && f.url)
        .map(f => ({ quality: f.quality, url: f.url }));
        
      if (combinedFormats.length > 0) {
        const thumbnailUrl = info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1].url : '';
        console.log(`¡Éxito! Información encontrada con la clave ...${apiKey.slice(-6)}`);
        
        // ¡Éxito! Devolvemos un objeto con toda la información y detenemos el bucle.
        return {
          title: info.title,
          thumbnail: thumbnailUrl,
          qualities: combinedFormats,
        };
      } else {
        // La clave funcionó pero no hay formatos válidos. No tiene caso probar otras claves.
        console.error("No se encontró ningún formato MP4 con audio para este video.");
        return null; 
      }
    } catch (error: any) {
      // Si el error es por límite de peticiones (429) u otro, lo registramos
      // y el bucle 'for' continuará AUTOMÁTICAMENTE con la siguiente clave.
      console.log(`Falló la clave ...${apiKey.slice(-6)}: ${error.message}`);
    }
  }

  // Si el bucle 'for' termina sin que hayamos retornado éxito, significa que todas las claves fallaron.
  console.error("Todas las claves de API han fallado o han alcanzado su límite.");
  return null;
}