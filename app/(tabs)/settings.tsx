import { StatusBar } from 'expo-status-bar';
import { ExternalLink, Globe, Heart, Info, Settings as SettingsIcon, Shield, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [defaultQuality, setDefaultQuality] = useState('720p');

  const qualities = ['144p', '240p', '360p', '480p', '720p', '1080p'];

  const handleQualityChange = (quality: string) => {
    setDefaultQuality(quality);
    // para guardar en AsyncStorage si se sigue con la configuración
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const showAbout = () => {
    Alert.alert(
      'Acerca de YouTube Downloader',
      'Esta aplicación te permite descargar videos de YouTube en diferentes calidades. \n\nDesarrollada por Carlos Guadalupe López Trejo.\n\nVersión: 1.0.0',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <SettingsIcon size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Personaliza tu experiencia de descarga
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descarga</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Smartphone size={24} color="#007AFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Calidad predeterminada</Text>
              <Text style={styles.settingDescription}>
                Calidad que se seleccionará automáticamente
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.qualitySelector}>
                <View style={styles.qualityList}>
                  {qualities.map((quality) => (
                    <TouchableOpacity
                      key={quality}
                      style={[
                        styles.qualityButton,
                        defaultQuality === quality && styles.selectedQualityButton,
                      ]}
                      onPress={() => handleQualityChange(quality)}
                    >
                      <Text
                        style={[
                          styles.qualityText,
                          defaultQuality === quality && styles.selectedQualityText,
                        ]}
                      >
                        {quality}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <TouchableOpacity style={styles.settingCard} onPress={showAbout}>
            <View style={styles.settingIcon}>
              <Info size={24} color="#34C759" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Acerca de la app</Text>
              <Text style={styles.settingDescription}>
                Versión, información y créditos
              </Text>
            </View>
            <ExternalLink size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard} 
            onPress={() => openLink('https://github.com/carlop13/youtube-downloader-app.git')}
          >
            <View style={styles.settingIcon}>
              <Globe size={24} color="#FF9500" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Código fuente</Text>
              <Text style={styles.settingDescription}>
                Ve el código en GitHub
              </Text>
            </View>
            <ExternalLink size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Shield size={24} color="#FF3B30" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Aviso legal</Text>
              <Text style={styles.settingDescription}>
                Respeta los derechos de autor y usa esta app responsablemente
              </Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingIcon}>
              <Heart size={24} color="#FF2D92" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Hecho para 🦖🐊</Text>
              <Text style={styles.settingDescription}>
                Desarrollado por Carlos Guadalupe López Trejo
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            YouTube Downloader v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            App creada con Expo & React Native
          </Text>
        </View>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingCard: {
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  qualitySelector: {
    marginTop: 12,
    marginHorizontal: -4,
  },
  qualityList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  qualityButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQualityButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedQualityText: {
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
  },
});