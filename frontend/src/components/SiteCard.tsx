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
  const streamStatus = site.health?.stream_status || 'stopped';
  const isOnline = status.toLowerCase() === 'online';
  // Check for both 'live' and 'running' as stream active states
  const isStreaming = ['live', 'running'].includes(streamStatus.toLowerCase());
  
  // Use snake_case field names from API
  const bitrate = site.health?.video_bitrate;
  const previewImage = site.health?.preview_image;

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
            <Ionicons name="videocam-off" size={24} color="#6b7280" />
          </View>
        )}
        {/* Status overlay */}
        <View style={styles.statusOverlay}>
          {isStreaming ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <StatusBadge status={status} size="small" />
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{site.name}</Text>
          {site.agent_version && (
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{site.agent_version}</Text>
            </View>
          )}
        </View>
        
        {site.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#9ca3af" />
            <Text style={styles.location} numberOfLines={1}>{site.location}</Text>
          </View>
        )}
        
        <View style={styles.statsRow}>
          {isOnline && bitrate && (
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={12} color="#f59e0b" />
              <Text style={styles.bitrate}>{(bitrate / 1000).toFixed(1)} Mbps</Text>
            </View>
          )}
          {site.health?.cpu_usage !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="hardware-chip" size={12} color="#3b82f6" />
              <Text style={styles.cpuText}>CPU {site.health.cpu_usage.toFixed(0)}%</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  previewContainer: {
    width: 80,
    height: 56,
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
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  versionBadge: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  versionText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bitrate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  cpuText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
