import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Site } from '../types';
import StatusBadge from './StatusBadge';

interface SiteCardProps {
  site: Site;
  onPress: () => void;
}

export default function SiteCard({ site, onPress }: SiteCardProps) {
  const status = site.health?.status || site.status || 'offline';
  const isOnline = status.toLowerCase() === 'online';
  const bitrate = site.health?.videoBitrate;
  const previewImage = site.health?.previewImage;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.previewContainer}>
        {previewImage ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${previewImage}` }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPreview}>
            <Ionicons name="videocam-off" size={32} color="#6b7280" />
          </View>
        )}
        <View style={styles.statusOverlay}>
          <StatusBadge status={status} size="small" />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{site.name}</Text>
        {site.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#9ca3af" />
            <Text style={styles.location} numberOfLines={1}>{site.location}</Text>
          </View>
        )}
        {isOnline && bitrate && (
          <View style={styles.bitrateRow}>
            <Ionicons name="speedometer" size={14} color="#f59e0b" />
            <Text style={styles.bitrate}>{Math.round(bitrate / 1000)} Mbps</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  previewContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  noPreview: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: '#9ca3af',
  },
  bitrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bitrate: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
  },
});
