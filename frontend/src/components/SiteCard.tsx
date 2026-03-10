import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Site } from '../types';

interface SiteCardProps {
  site: Site;
  onPress: () => void;
}

export default function SiteCard({ site, onPress }: SiteCardProps) {
  const [imageKey, setImageKey] = useState(0);
  
  const status = site.health?.status || site.status || 'offline';
  const streamStatus = site.health?.stream_status || 'stopped';
  const isOnline = status.toLowerCase() === 'online';
  const isLive = streamStatus.toLowerCase() === 'live';
  
  // Use snake_case field names from API
  const videoBitrate = site.health?.video_bitrate;
  const sourceBitrate = site.health?.source_bitrate;
  const cpuUsage = site.health?.cpu_usage;
  const previewImage = site.health?.preview_image;
  const agentVersion = site.agent_version;

  // Auto-refresh image every 5 seconds by forcing re-render
  useEffect(() => {
    const interval = setInterval(() => {
      setImageKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBitrate = (bitrate: number | undefined) => {
    if (!bitrate) return '0';
    return bitrate.toFixed(1);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Preview Image */}
      <View style={styles.previewContainer}>
        {previewImage ? (
          <Image
            key={imageKey}
            source={{ uri: `data:image/jpeg;base64,${previewImage}` }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPreview}>
            <Ionicons name="videocam-off" size={48} color="#6b7280" />
            <Text style={styles.noPreviewText}>No Preview</Text>
          </View>
        )}
        
        {/* LIVE Badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        
        {/* Offline Badge */}
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline" size={14} color="#ffffff" />
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        )}
      </View>

      {/* Site Info */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.siteName} numberOfLines={1}>{site.name}</Text>
          </View>
          {agentVersion && (
            <View style={styles.versionBadge}>
              <Ionicons name="download-outline" size={12} color="#22c55e" />
              <Text style={styles.versionText}>v{agentVersion}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.location} numberOfLines={1}>{site.location || 'Unknown Location'}</Text>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Output</Text>
            <Text style={styles.statValue}>{formatBitrate(videoBitrate)} kbps</Text>
            {sourceBitrate && (
              <Text style={styles.statSubtext}>In: {formatBitrate(sourceBitrate)} kbps</Text>
            )}
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>System</Text>
            <Text style={styles.statValue}>CPU: {cpuUsage?.toFixed(1) || '0'}%</Text>
            {site.health?.gpu_usage !== undefined && (
              <Text style={styles.statSubtext}>GPU: {site.health.gpu_usage.toFixed(1)}%</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a0a0a',
    position: 'relative',
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
  noPreviewText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  offlineBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  versionText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    marginLeft: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    padding: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
