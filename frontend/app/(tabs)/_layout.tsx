import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

const SitesIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="desktop" size={size} color={color} />
);

const AlertsIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="notifications" size={size} color={color} />
);

const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="settings" size={size} color={color} />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sites',
          tabBarIcon: SitesIcon,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: AlertsIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0c0c0c',
    borderTopColor: '#1a1a1a',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 28,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
