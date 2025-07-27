import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { File, FolderOpen, RefreshCw, Share, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DownloadService, DownloadedFile } from 'services/DownloadService';

export default function DownloadsScreen() {
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadFiles = useCallback(async () => {
    try {
      const files = await DownloadService.getDownloadedFiles();
      setDownloadedFiles(files);
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

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleShare = async (file: DownloadedFile) => {
    try {
      await DownloadService.shareFile(file.uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const handleDelete = (file: DownloadedFile) => {
    Alert.alert(
      'Eliminar archivo',
      `¿Estás seguro de que quieres eliminar "${file.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                await FileSystem.deleteAsync(file.uri);
                await loadFiles();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Fecha desconocida';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <FolderOpen size={32} color="#007AFF" />
            <Text style={styles.headerTitle}>Mis Descargas</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            En web, los archivos se descargan automáticamente
          </Text>
        </View>
        
        <View style={styles.webNotice}>
          <File size={48} color="#ccc" />
          <Text style={styles.webNoticeTitle}>Descargas Automáticas</Text>
          <Text style={styles.webNoticeText}>
            En la versión web, los videos se descargan directamente a tu carpeta de descargas del navegador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
        <View style={styles.headerContent}>
          <FolderOpen size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Mis Descargas</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {downloadedFiles.length} archivo{downloadedFiles.length !== 1 ? 's' : ''} descargado{downloadedFiles.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <RefreshCw size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>Cargando archivos...</Text>
          </View>
        ) : downloadedFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderOpen size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No hay descargas</Text>
            <Text style={styles.emptyStateText}>
              Los videos que descargues aparecerán aquí
            </Text>
          </View>
        ) : (
          downloadedFiles.map((file, index) => (
            <View key={index} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <File size={24} color="#007AFF" />
              </View>
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.name}
                </Text>
                <Text style={styles.fileDetails}>
                  {formatFileSize(file.size)} • {formatDate(file.modificationTime)}
                </Text>
              </View>

              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShare(file)}
                >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
    paddingVertical: 60,
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
  webNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  webNoticeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  webNoticeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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