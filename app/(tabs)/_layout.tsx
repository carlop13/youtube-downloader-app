import { Tabs } from 'expo-router';
import { Download, FolderOpen, Settings } from 'lucide-react-native';
import React from 'react';

// Esta función será nuestro componente de ícono reutilizable
function TabBarIcon({ name, color }: { name: string; color: string }) {
  const iconSize = 28;
  if (name === 'index') {
    return <Download size={iconSize} color={color} />;
  } else if (name === 'downloads') {
    return <FolderOpen size={iconSize} color={color} />;
  } else if (name === 'settings') {
    return <Settings size={iconSize} color={color} />;
  }
  return null;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        // --- ¡ESTE ES EL CAMBIO CLAVE! ---
        // Eliminamos height, paddingTop y paddingBottom.
        // Dejamos que Expo maneje la altura y los márgenes automáticamente.
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          // Podemos mantener las sombras si nos gustan
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: -5, // Ajuste fino para acercar el texto al ícono
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Descargar',
          // Usamos la propiedad 'tabBarIcon' para pasar nuestro componente personalizado
          tabBarIcon: ({ color }) => <TabBarIcon name="index" color={color} />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Mis Descargas',
          tabBarIcon: ({ color }) => <TabBarIcon name="downloads" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}