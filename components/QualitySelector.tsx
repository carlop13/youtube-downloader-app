import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';

interface QualitySelectorProps {
  qualities: string[];
  selectedQuality: string;
  onQualitySelect: (quality: string) => void;
}

export default function QualitySelector({ qualities, selectedQuality, onQualitySelect }: QualitySelectorProps) {
  if (qualities.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona la calidad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.qualityList}>
          {qualities.map((quality) => (
            <TouchableOpacity
              key={quality}
              style={[
                styles.qualityButton,
                selectedQuality === quality && styles.selectedQualityButton,
              ]}
              onPress={() => onQualitySelect(quality)}
            >
              <Text
                style={[
                  styles.qualityText,
                  selectedQuality === quality && styles.selectedQualityText,
                ]}
              >
                {quality}
              </Text>
              {selectedQuality === quality && (
                <Check size={16} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  scrollView: {
    marginHorizontal: -4,
  },
  qualityList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  qualityButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});