import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const isOnline = status?.toLowerCase() === 'online';
  const dotSize = size === 'small' ? 8 : size === 'medium' ? 10 : 14;
  const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 15;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: isOnline ? '#22c55e' : '#ef4444',
          },
        ]}
      />
      <Text style={[styles.text, { fontSize, color: isOnline ? '#22c55e' : '#ef4444' }]}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 50,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
