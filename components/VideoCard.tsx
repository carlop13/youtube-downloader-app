import { Clock, Download, Eye, Play } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoInfo } from 'services/YoutubeApiService';

interface VideoCardProps {
  video: VideoInfo;
  onDownload: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

const { width } = Dimensions.get('window');

export default function VideoCard({ video, onDownload, isDownloading, downloadProgress }: VideoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
        <View style={styles.playOverlay}>
          <Play size={24} color="white" fill="white" />
        </View>
        {video.duration && (
          <View style={styles.durationBadge}>
            <Clock size={12} color="white" />
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        
        <View style={styles.metadata}>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>{video.quality}</Text>
          </View>
          
          {video.viewCount && (
            <View style={styles.viewCount}>
              <Eye size={14} color="#666" />
              <Text style={styles.viewCountText}>{video.viewCount} views</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.downloadButton, isDownloading && styles.downloadingButton]}
          onPress={onDownload}
          disabled={isDownloading}
        >
          <Download size={20} color="white" />
          <Text style={styles.downloadButtonText}>
            {isDownloading ? `${downloadProgress?.toFixed(0) || 0}%` : 'Descargar'}
          </Text>
        </TouchableOpacity>

        {isDownloading && downloadProgress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  qualityBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qualityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  downloadButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadingButton: {
    backgroundColor: '#34C759',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
});