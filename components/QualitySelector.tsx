import { ArrowDownToLine } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QualitySelectorProps {
  qualities: string[];
  selectedQuality: string;
  onQualitySelect: (quality: string) => void;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ qualities, selectedQuality, onQualitySelect }) => {
  // Ordenamos las calidades de mejor a peor para mostrarlas en la UI
  const sortedQualities = [...qualities].sort((a, b) => {
    const aNum = parseInt(a.replace('p', ''));
    const bNum = parseInt(b.replace('p', ''));
    return bNum - aNum;
  });

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <ArrowDownToLine size={18} color="#666" />
        <Text style={styles.title}>Elige una calidad</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sortedQualities.map((quality) => (
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
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  qualityButton: {
    backgroundColor: '#EFEFEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQualityButton: {
    backgroundColor: '#E0F0FF',
    borderColor: '#007AFF',
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedQualityText: {
    color: '#007AFF',
  },
});

export default QualitySelector;