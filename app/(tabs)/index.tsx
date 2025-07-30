import { StatusBar } from 'expo-status-bar';
import { Youtube } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tus componentes y servicios (las rutas relativas son más seguras si los alias fallan)
import QualitySelector from '@/../components/QualitySelector';
import SearchInput from '@/../components/SearchInput';
import VideoCard from '@/../components/VideoCard';
import { DownloadProgress, DownloadResumable, DownloadService } from '@/../services/DownloadService';
import { getVideoDetails, VideoDetails, VideoQuality } from '@/../services/YoutubeApiService';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  // Guardamos el objeto de calidad completo, no solo el string.
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const downloadResumableRef = useRef<DownloadResumable | null>(null);
  const insets = useSafeAreaInsets(); // Hook para obtener los márgenes seguros

  const handleSearch = async () => {
    if (!url.trim()) return;

    setIsSearching(true);
    setVideoDetails(null);
    setSelectedQuality(null);
    setDownloadProgress(0);

    try {
      // Hacemos una sola petición que nos trae toda la información del video
      const result = await getVideoDetails(url);
      
      // CORRECCIÓN LÓGICA: Ahora guardamos los detalles en el estado para que se renderice.
      if (result && result.qualities.length > 0) {
        setVideoDetails(result);
        // Seleccionamos la mejor calidad disponible (la primera de la lista) por defecto.
        setSelectedQuality(result.qualities[0]);
      } else {
        Alert.alert('Error', 'No se pudo obtener la información del video. Verifica la URL o que el video no tenga restricciones.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servicio. Intenta nuevamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // En app/(tabs)/index.tsx

const handleDownload = async () => {
    if (!videoDetails || !selectedQuality) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    const filename = `${videoDetails.title.replace(/[^a-z0-9_.-]/gi, '-')}-${selectedQuality.quality}.mp4`;

    try {
      // Llamamos a la nueva función unificada, que se encarga de todo.
      const { downloadResumable } = await DownloadService.downloadAndSave(
        selectedQuality.url,
        filename,
        (progress: DownloadProgress) => {
          setDownloadProgress(progress.progress * 100);
        }
      );
      
      downloadResumableRef.current = downloadResumable;

    } catch (error: any) {
      // Si el error no es por cancelación del usuario, mostramos una alerta.
      if (!error.message.includes('cancel')) {
        Alert.alert('Error', error.message || 'Ocurrió un error durante la descarga.');
      }
    } finally {
      setIsDownloading(false);
      // Solo marcamos 100% si no fue cancelado y no hubo error.
      if(!downloadResumableRef.current?.__SAFEv2_shouldCancel) {
          setDownloadProgress(100);
      }
      downloadResumableRef.current = null;
    }
};
  
  const handleCancelDownload = async () => {
    if (downloadResumableRef.current) {
      console.log("Cancelando descarga...");
      await downloadResumableRef.current.cancelAsync();
      // El bloque finally de handleDownload se encargará del resto.
    }
  };

  const resetSearch = () => {
    if (isDownloading) return;
    setUrl('');
    setVideoDetails(null);
    setSelectedQuality(null);
    setDownloadProgress(0);
  };

  return (
    // SafeAreaView gestiona automáticamente los márgenes superior e inferior
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
        <View style={styles.headerContent}>
          <Youtube size={32} color="#FF0000" />
          <Text style={styles.headerTitle}>Snapcodrilo</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Descarga tus videos favoritos en alta calidad
        </Text>
      </View>

      <SearchInput
        value={url}
        onChangeText={setUrl}
        onSearch={handleSearch}
        isLoading={isSearching}
        disabled={isDownloading}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} // Margen inferior dinámico
        showsVerticalScrollIndicator={false}
      >
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Buscando video...</Text>
          </View>
        )}

        {videoDetails && (
          <>
            <QualitySelector
              qualities={videoDetails.qualities.map(q => q.quality)}
              selectedQuality={selectedQuality?.quality || ''}
              onQualitySelect={(quality) => {
                const newQuality = videoDetails.qualities.find(q => q.quality === quality);
                if (newQuality) setSelectedQuality(newQuality);
              }}
            />
            <VideoCard
  video={{
    title: videoDetails.title,
    thumbnail: videoDetails.thumbnail,
  }}
  selectedQuality={selectedQuality?.quality || null} // Pasamos solo el string de calidad
  onDownload={handleDownload}
  onCancel={handleCancelDownload}
  isDownloading={isDownloading}
  downloadProgress={downloadProgress}
/>
            <View style={styles.resetContainer}>
              <TouchableOpacity onPress={resetSearch} disabled={isDownloading}>
                <Text style={[styles.resetText, isDownloading && styles.disabledText]}>
                  ¿Buscar otro video?
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10, 
    backgroundColor: 'white',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginLeft: 44,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  resetContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  resetText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  disabledText: {
    color: '#BDBDBD',
    textDecorationLine: 'none',
  },
});