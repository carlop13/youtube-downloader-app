import { CheckCircle, Download, XCircle } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Definimos los tipos de las props que el componente recibirá
interface VideoCardProps {
  // Usamos un tipo parcial para la info del video que necesita la tarjeta
  video: {
    title: string;
    thumbnail: string;
  };
  selectedQuality: string | null; // La calidad seleccionada
  onDownload: () => void;
  onCancel: () => void;
  isDownloading: boolean;
  downloadProgress: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  selectedQuality,
  onDownload, 
  onCancel, 
  isDownloading, 
  downloadProgress 
}) => {

  // Esta función renderiza la parte inferior de la tarjeta (el botón o el progreso)
  const renderActionSection = () => {
    // ESTADO 3: Descarga completada (mostramos un estado de éxito)
    if (downloadProgress === 100 && !isDownloading) {
      return (
        <View style={[styles.button, styles.completedButton]}>
          <CheckCircle size={22} color="#FFFFFF" />
          <Text style={styles.buttonText}>¡Descargado!</Text>
        </View>
      );
    }
    
    // ESTADO 2: Descarga en progreso
    if (isDownloading) {
      return (
        <View style={styles.downloadingContainer}>
          {/* El indicador de progreso que no es un botón */}
          <View style={styles.progressWrapper}>
            <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
            <Text style={styles.progressText}>
              Descargando... {downloadProgress.toFixed(0)}%
            </Text>
          </View>
          {/* El botón de cancelar al lado */}
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <XCircle size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      );
    }

    // ESTADO 1: Normal, listo para descargar
    return (
      <TouchableOpacity style={styles.button} onPress={onDownload}>
        <Download size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Descargar</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {/* Miniatura del video */}
      <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
      
      <View style={styles.infoContainer}>
        {/* Título del video */}
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        
        {/* Sección de metadatos (Calidad) */}
        <View style={styles.metadata}>
          {selectedQuality && (
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{selectedQuality}</Text>
            </View>
          )}
          {/* Puedes añadir más metadatos aquí si la API los devuelve, como las vistas */}
          {/* <View style={styles.viewCount}>
            <Eye size={14} color="#666" />
            <Text style={styles.viewCountText}>1.2M vistas</Text>
          </View> */}
        </View>

        {/* Sección de acción (Botón o Progreso) */}
        {renderActionSection()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  qualityBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  qualityText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '700',
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    color: '#666',
    fontSize: 12,
  },
  // --- Estilos para la sección de acción ---
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF', // Botón azul
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  completedButton: {
    backgroundColor: '#34C759', // Verde para completado
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressWrapper: {
    flex: 1, // Ocupa todo el espacio disponible
    height: 50,
    backgroundColor: '#E0F0FF', // Un azul claro de fondo
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden', // Para que la barra de progreso no se salga
  },
  progressBar: {
    backgroundColor: '#007AFF', // Azul para el progreso
    height: '100%',
    position: 'absolute',
  },
  progressText: {
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#0059B3', // Un azul más oscuro para el texto
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFE5E5', // Un rojo claro
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoCard;