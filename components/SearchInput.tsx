import * as Clipboard from 'expo-clipboard';
import { ClipboardPaste, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function SearchInput({ 
  value, 
  onChangeText, 
  onSearch, 
  isLoading = false, 
  disabled = false,
  placeholder = "Pega aquí la URL de YouTube" 
}: SearchInputProps) {
  
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    if (disabled || isLoading) return;
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        onChangeText(text);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo pegar el contenido del portapapeles');
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const isButtonDisabled = !value || !isValidYouTubeUrl(value) || isLoading || disabled;

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer, 
        isFocused && styles.inputContainerFocused,
        (isLoading || disabled) && styles.disabled
      ]}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSearch} // Buscar con "Enter"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading && !disabled}
        />
        
        <TouchableOpacity style={styles.pasteButton} onPress={handlePaste} disabled={isLoading || disabled}>
          <ClipboardPaste size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.searchButton,
          isButtonDisabled && styles.searchButtonDisabled,
        ]}
        onPress={onSearch}
        disabled={isButtonDisabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Search size={20} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
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
    transition: 'border-color 0.2s ease-in-out',
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
  },
  disabled: {
    backgroundColor: '#F5F5F5',
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 14,
  },
  pasteButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 56, 
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonDisabled: {
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
});