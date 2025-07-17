import * as Clipboard from 'expo-clipboard';
import { Cast as Paste, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchInput({ 
  value, 
  onChangeText, 
  onSearch, 
  isLoading, 
  placeholder = "Pega aquí la URL de YouTube" 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
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

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          multiline={false}
        />
        
        <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
          <Paste size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.searchButton,
          (!value || !isValidYouTubeUrl(value) || isLoading) && styles.searchButtonDisabled,
        ]}
        onPress={onSearch}
        disabled={!value || !isValidYouTubeUrl(value) || isLoading}
      >
        <Search size={20} color="white" />
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
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
  },
  pasteButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});