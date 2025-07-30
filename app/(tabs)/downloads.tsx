import * as MediaLibrary from 'expo-media-library'; // Importamos MediaLibrary para borrar
import { useFocusEffect } from 'expo-router'; // ¡Importamos el hook mágico!
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { File, FolderOpen, Share, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DownloadService, DownloadedFile } from 'services/DownloadService';

export default function DownloadsScreen() {
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadFiles = useCallback(async () => {
    // No establecemos isLoading a true aquí, para una recarga más suave en focus
    try {
      const files = await DownloadService.getDownloadedFiles();
      setDownloadedFiles(files);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      Alert.alert('Error', 'No se pudieron cargar los archivos descargados.');
    } finally {
      setIsLoading(false); // Solo se establece en false al final
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }, [loadFiles]);

  // --- ¡ESTA ES LA MEJORA CLAVE! ---
  // useFocusEffect se ejecuta CADA VEZ que esta pantalla aparece.
  // Esto asegura que la lista siempre esté actualizada después de una nueva descarga.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true); // Mostramos el indicador de carga al entrar
      loadFiles();
    }, [loadFiles])
  );

  const handleShare = async (file: DownloadedFile) => {
    try {
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el archivo.');
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
              // --- CORRECCIÓN LÓGICA DE BORRADO ---
              // Usamos MediaLibrary.deleteAssetsAsync con el ID del asset
              const result = await MediaLibrary.deleteAssetsAsync([file.id]);
              if (result) {
                Alert.alert('Éxito', `"${file.filename}" ha sido eliminado.`);
                // Recargamos la lista para reflejar el cambio
                await loadFiles(); 
              } else {
                 Alert.alert('Error', 'El archivo no pudo ser eliminado.');
              }
            } catch (error) {
              console.error("Error al eliminar:", error);
              Alert.alert('Error', 'Ocurrió un error al intentar eliminar el archivo.');
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
          {downloadedFiles.length} video{downloadedFiles.length !== 1 ? 's' : ''} en tu dispositivo
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#007AFF']} 
            tintColor={'#007AFF'} 
          />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.emptyStateText}>Buscando tus videos...</Text>
          </View>
        ) : downloadedFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderOpen size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No hay descargas</Text>
            <Text style={styles.emptyStateText}>
              Los videos que descargues aparecerán aquí.
            </Text>
          </View>
        ) : (
          downloadedFiles.map((file) => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <File size={24} color="#007AFF" />
              </View>
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.filename}
                </Text>
                <Text style={styles.fileDetails}>
                  {formatFileSize(file.size)} • {formatDate(file.modificationTime)}
                </Text>
              </View>

              <View style={styles.fileActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(file)}>
                  <Share size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDelete(file)}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (El resto de tus estilos pueden quedar igual)
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
  fileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 14,
    color: '#666',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
});