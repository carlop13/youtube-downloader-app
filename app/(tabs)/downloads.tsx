import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import { ResizeMode, Video } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { File, FolderOpen, Mic, PlayCircle, Search, Share, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DownloadService, DownloadedFile } from 'services/DownloadService';

// --- COMPONENTE INTERNO PARA LA MINIATURA ---
const FileThumbnail: React.FC<{ fileUri: string }> = ({ fileUri }) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(fileUri, { time: 1000 });
        if (isMounted) setThumbnailUri(uri);
      } catch (e) {
        console.warn('No se pudo generar la miniatura:', e);
      }
    };
    generateThumbnail();
    return () => { isMounted = false; };
  }, [fileUri]);

  if (!thumbnailUri) {
    return (
      <View style={styles.thumbnailPlaceholder}>
        <File size={24} color="#007AFF" />
      </View>
    );
  }
  return <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />;
};

// --- NUEVO COMPONENTE: REPRODUCTOR DE VIDEO EN MODAL ---
const VideoPlayerModal: React.FC<{
  visible: boolean;
  file: DownloadedFile | null;
  onClose: () => void;
}> = ({ visible, file, onClose }) => {
  const videoRef = useRef<Video>(null);
  const insets = useSafeAreaInsets(); // Usamos insets para el botón de cerrar

  useEffect(() => {
    if (!visible) {
      videoRef.current?.stopAsync();
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <View style={styles.videoContainer}>
        {file?.uri && (
          <Video
            ref={videoRef}
            style={StyleSheet.absoluteFill}
            source={{ uri: file.uri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onError={(error) => console.error("Error del reproductor de video:", error)}
          />
        )}
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={onClose}>
          <X size={28} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};


// --- PANTALLA PRINCIPAL ---
export default function DownloadsScreen() {
  const [allDownloadedFiles, setAllDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  const [isListening, setIsListening] = useState(false);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);
  const [selectedFileToPlay, setSelectedFileToPlay] = useState<DownloadedFile | null>(null);

  const handlePlayVideo = (file: DownloadedFile) => {
    setSelectedFileToPlay(file);
    setIsVideoPlayerVisible(true);
  };

  useEffect(() => {
    const onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value?.[0]) setSearchQuery(e.value[0]);
      setIsListening(false);
    };
    const onSpeechError = (e: SpeechErrorEvent) => {
      console.error('onSpeechError: ', e);
      Alert.alert("Error de Voz", e.error?.message || "No se pudo reconocer el audio.");
      setIsListening(false);
    };
    const onSpeechEnd = () => setIsListening(false);

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  const startListening = async () => {
    try {
      setSearchQuery('');
      await Voice.start('es-ES');
      setIsListening(true);
    } catch (e) {
      console.error('Error al iniciar la escucha:', e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Error al detener la escucha:', e);
    }
  };
  
  const handleVoiceSearch = () => isListening ? stopListening() : startListening();

  const loadFiles = useCallback(async () => {
    try {
      const files = await DownloadService.getDownloadedFiles();
      setAllDownloadedFiles(files);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }, [loadFiles]);

  useFocusEffect(useCallback(() => { loadFiles(); }, [loadFiles]));

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return allDownloadedFiles;
    return allDownloadedFiles.filter(file => 
      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allDownloadedFiles, searchQuery]);

  const handleShare = async (file: DownloadedFile) => {
    try {
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const handleDelete = (file: DownloadedFile) => {
    Alert.alert(
      'Eliminar archivo',
      `¿Estás seguro de que quieres eliminar "${file.filename}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync([file.id]);
              await loadFiles();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return 'Tamaño desc.';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Fecha desc.';
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <View style={styles.headerContent}>
          <FolderOpen size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Mis Descargas</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {allDownloadedFiles.length} video{allDownloadedFiles.length !== 1 ? 's' : ''} en tu dispositivo
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <Search size={23} color="#444343ff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en tus descargas..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.actionIcon}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleVoiceSearch} style={styles.actionIcon}>
              <Mic size={24} color={isListening ? '#FF3B30' : '#007AFF'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} tintColor={'#007AFF'} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}><ActivityIndicator size="large" color="#007AFF" /></View>
        ) : filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'Sin resultados' : 'No hay descargas'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `No se encontraron videos que coincidan con "${searchQuery}"`
                : 'Los videos que descargues aparecerán aquí.'
              }
            </Text>
          </View>
        ) : (
          filteredFiles.map((file) => (
            <TouchableOpacity key={file.id} onPress={() => handlePlayVideo(file)} activeOpacity={0.8}>
              <View style={styles.fileCard}>
                <View style={styles.thumbnailContainer}>
                  <FileThumbnail fileUri={file.uri} />
                  <View style={styles.playIconOverlay}>
                    <PlayCircle size={24} color="white" fill="rgba(0,0,0,0.5)" />
                  </View>
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>{file.filename}</Text>
                  <Text style={styles.fileDetails}>
                    {formatFileSize(file.size)} • {formatDate(file.modificationTime)}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleShare(file); }}>
                    <Share size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]} 
                    onPress={(e) => { e.stopPropagation(); handleDelete(file); }}
                  >
                    <Trash2 size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <VideoPlayerModal 
        visible={isVideoPlayerVisible}
        file={selectedFileToPlay}
        onClose={() => setIsVideoPlayerVisible(false)}
      />
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
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 16, color: '#666', marginLeft: 44 },
  searchSection: {
    paddingHorizontal: 18,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainerFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 14,
  },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: { 
    flex: 1, 
    paddingHorizontal: 16 
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a1a' },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center', maxWidth: 280 },
  fileCard: { backgroundColor: 'white', borderRadius: 16, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#e0e0e0',
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  fileDetails: { fontSize: 14, color: '#666' },
  fileActions: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  deleteButton: { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
});