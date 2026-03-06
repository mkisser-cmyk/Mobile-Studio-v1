import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../src/services/api';
import { Site } from '../../src/types';
import StatusBadge from '../../src/components/StatusBadge';
import StatCard from '../../src/components/StatCard';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSite = useCallback(async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSite(id);
      setSite(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch site details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSite(false);
  };

  const handleRestart = () => {
    Alert.alert(
      'Restart Site PC',
      `Are you sure you want to restart ${site?.name}? This will temporarily disrupt the stream.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            setIsRestarting(true);
            try {
              const response = await apiClient.restartSitePC(id!);
              Alert.alert('Success', response.message || 'Restart command sent successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to restart site');
            } finally {
              setIsRestarting(false);
            }
          },
        },
      ]
    );
  };

  const formatUptime = (seconds: number | undefined) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatBitrate = (bitrate: number | undefined) => {
    if (!bitrate) return 'N/A';
    return `${(bitrate / 1000).toFixed(1)} Mbps`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !site) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Site not found'}</Text>
          <Text style={styles.retryText} onPress={() => fetchSite()}>Tap to retry</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = site.health?.status || site.status || 'offline';
  const isOnline = status.toLowerCase() === 'online';
  const previewImage = site.health?.previewImage;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>{site.name}</Text>
          {site.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#9ca3af" />
              <Text style={styles.location}>{site.location}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#f59e0b"
          />
        }
      >
        {/* Preview Image */}
        <View style={styles.previewContainer}>
          {previewImage ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${previewImage}` }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noPreview}>
              <Ionicons name="videocam-off" size={48} color="#6b7280" />
              <Text style={styles.noPreviewText}>No preview available</Text>
            </View>
          )}
          <View style={styles.statusBadgeOverlay}>
            <StatusBadge status={status} size="medium" />
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Stream Status</Text>
              <Text style={[styles.statusValue, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
                {site.health?.streamStatus || status}
              </Text>
            </View>
            <View>
              <Text style={styles.statusLabel}>Uptime</Text>
              <Text style={styles.statusValue}>{formatUptime(site.health?.uptimeSeconds)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Output Bitrate"
            value={formatBitrate(site.health?.videoBitrate)}
            icon="speedometer"
            color="#f59e0b"
          />
          <StatCard
            title="Source Bitrate"
            value={formatBitrate(site.health?.sourceBitrate)}
            icon="cloud-upload"
            color="#3b82f6"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="CPU Usage"
            value={formatPercentage(site.health?.cpuUsage)}
            icon="hardware-chip"
            color="#22c55e"
          />
          <StatCard
            title="GPU Usage"
            value={formatPercentage(site.health?.gpuUsage)}
            icon="desktop"
            color="#8b5cf6"
          />
        </View>

        {/* Last Heartbeat */}
        {site.health?.lastHeartbeat && (
          <View style={styles.heartbeatContainer}>
            <Ionicons name="pulse" size={16} color="#6b7280" />
            <Text style={styles.heartbeatText}>
              Last heartbeat: {new Date(site.health.lastHeartbeat).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Restart Button */}
        <TouchableOpacity
          style={[styles.restartButton, isRestarting && styles.restartButtonDisabled]}
          onPress={handleRestart}
          disabled={isRestarting}
        >
          {isRestarting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="power" size={20} color="#ffffff" />
              <Text style={styles.restartButtonText}>Restart Site PC</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  noPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPreviewText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  heartbeatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  heartbeatText: {
    fontSize: 13,
    color: '#6b7280',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    height: 52,
    marginTop: 8,
  },
  restartButtonDisabled: {
    opacity: 0.7,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    color: '#f59e0b',
  },
});
