import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7C6BF0',
        tabBarInactiveTintColor: '#8A8A9A',
        tabBarStyle: { backgroundColor: '#1C1C26', borderTopColor: '#2A2A38' },
        headerStyle: { backgroundColor: '#121218' },
        headerTintColor: '#FFFFFF',
        sceneStyle: { backgroundColor: '#121218' },
      }}
    >
      <Tabs.Screen
        name="search"
        options={{
          title: 'Suche',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="playlist-music" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
