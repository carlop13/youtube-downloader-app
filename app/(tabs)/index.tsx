import QualitySelector from 'components/QualitySelector';
import SearchInput from 'components/SearchInput';
import VideoCard from 'components/VideoCard';
import { StatusBar } from 'expo-status-bar';
import { Youtube } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DownloadProgress, DownloadService } from 'services/DownloadService';
import { getAvailableQualities, getDownloadableLink, VideoInfo } from 'services/YoutubeApiService';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleSearch = async () => {
    if (!url.trim()) return;

    setIsSearching(true);
    setVideoInfo(null);
    setAvailableQualities([]);
    setDownloadProgress(0);

    try {
      // Obtener calidades disponibles
      const qualities = await getAvailableQualities(url);
      setAvailableQualities(qualities);
      
      // Si hay calidades disponibles, usar la primera como predeterminada
      const qualityToUse = qualities.length > 0 ? qualities[0] : selectedQuality;
      setSelectedQuality(qualityToUse);

      // Obtener información del video
      const result = await getDownloadableLink(url, qualityToUse);
      
      if (result) {
        setVideoInfo(result);
      } else {
        Alert.alert(
          'Error',
          'No se pudo obtener la información del video. Verifica que la URL sea válida y que el video esté disponible.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error al buscar video:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servicio. Verifica tu conexión a internet e intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleQualityChange = async (quality: string) => {
    setSelectedQuality(quality);
    
    if (videoInfo && url) {
      setIsSearching(true);
      try {
        const result = await getDownloadableLink(url, quality);
        if (result) {
          setVideoInfo(result);
        }
      } catch (error) {
        console.error('Error al cambiar calidad:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const fileUri = await DownloadService.downloadFile(
        videoInfo.downloadUrl,
        videoInfo.filename,
        (progress: DownloadProgress) => {
          setDownloadProgress(progress.progress * 100);
        }
      );

      if (fileUri) {
        Alert.alert(
          '¡Descarga Completada!',
          `El video "${videoInfo.title}" se ha descargado exitosamente.`,
          [
            {
              text: 'Compartir',
              onPress: () => DownloadService.shareFile(fileUri),
            },
            { text: 'OK' },
          ]
        );
        setDownloadProgress(100);
      } else {
        Alert.alert(
          'Error en la Descarga',
          'No se pudo completar la descarga. Intenta nuevamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error en la descarga:', error);
      Alert.alert(
        'Error en la Descarga',
        'Ocurrió un error durante la descarga. Verifica tu conexión e intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const resetSearch = () => {
    setUrl('');
    setVideoInfo(null);
    setAvailableQualities([]);
    setDownloadProgress(0);
    setSelectedQuality('720p');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Youtube size={32} color="#FF0000" />
          <Text style={styles.headerTitle}>YouTube Downloader</Text>
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
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Buscando video...</Text>
          </View>
        )}

        {availableQualities.length > 0 && (
          <QualitySelector
            qualities={availableQualities}
            selectedQuality={selectedQuality}
            onQualitySelect={handleQualityChange}
          />
        )}

        {videoInfo && (
          <VideoCard
            video={videoInfo}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
          />
        )}

        {videoInfo && (
          <View style={styles.resetContainer}>
            <Text style={styles.resetText} onPress={resetSearch}>
              ¿Buscar otro video?
            </Text>
          </View>
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
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
});