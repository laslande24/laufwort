import { useEffect } from 'react';
import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme';

// Icône qui rebondit quand l'onglet devient actif.
function TabIcon({ name, color, focused }: { name: 'home' | 'stats-chart'; color: ColorValue; focused: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withSpring(focused ? 1.18 : 1, { damping: 9, stiffness: 260 });
  }, [focused, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { translateY: (1 - s.value) * 12 }] }));
  return (
    <Animated.View style={a}>
      <Ionicons name={name} color={color} size={24} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.mist,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Accueil', tabBarIcon: (p) => <TabIcon name="home" {...p} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progrès', tabBarIcon: (p) => <TabIcon name="stats-chart" {...p} /> }}
      />
    </Tabs>
  );
}
