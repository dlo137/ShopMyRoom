import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // [STARTUP SIDE EFFECT DISABLED: eager tab mounting]
        // React Navigation mounts ALL tab screens simultaneously by default.
        // If navigation state restores to /(tabs)/ on a cold launch, profile.tsx,
        // history.tsx, and index.tsx all mount at once, importing supabase and
        // firing their useEffects. lazy:true defers each screen until it is first
        // visited, eliminating those startup native calls.
        // Set back to false (or remove) once the crash is confirmed resolved.
        lazy: true,
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#C4C3C0',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 26,
          paddingTop: 10,
          ...shadow.sm,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Design',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-wand-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
