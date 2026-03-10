import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../src/services/api';
import { Site } from '../../src/types';

const { width } = Dimensions.get('window');

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSite = useCallback(async (showLoader = true) => {
    if (!id) return;
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSite(id);
      setSite(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch site details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    try {
      const logsData = await apiClient.getSiteLogs(id, 50);
      setLogs(logsData);
    } catch (err: any) {
      console.log('Logs not available:', err.message);
    }
  }, [id]);

  useEffect(() => {
    fetchSite();
    fetchLogs();
    
    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchSite(false);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSite, fetchLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSite(false);
    fetchLogs();
  };

  const handleStopStream = async () => {
    Alert.alert(
      'Stop Stream',
      `Are you sure you want to stop the stream for ${site?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            setIsStreamLoading(true);
            try {
              await apiClient.stopStream(id!);
              Alert.alert('Success', 'Stream stop command sent');
              fetchSite(false);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to stop stream');
            } finally {
              setIsStreamLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStartStream = async () => {
    setIsStreamLoading(true);
    try {
      await apiClient.startStream(id!);
      Alert.alert('Success', 'Stream start command sent');
      fetchSite(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to start stream');
    } finally {
      setIsStreamLoading(false);
    }
  };

  const handleRestart = () => {
    Alert.alert(
      'Restart Site PC',
      `Are you sure you want to restart ${site?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.restartSitePC(id!);
              Alert.alert('Success', 'Restart command sent');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'Failed to restart');
            }
          },
        },
      ]
    );
  };

  const formatUptime = (seconds: number | undefined) => {
    if (!seconds) return '0m';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        </View>
      </SafeAreaView>
    );
  }

  const status = site.health?.status || 'offline';
  const streamStatus = site.health?.stream_status || 'stopped';
  const isOnline = status.toLowerCase() === 'online';
  const isLive = streamStatus.toLowerCase() === 'live';
  const previewImage = site.health?.preview_image;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>{site.name}</Text>
          <View style={styles.headerBadges}>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#22c55e20' : '#ef444420' }]}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
                {status}
              </Text>
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />
        }
      >
        {/* Preview */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <View style={styles.previewTitle}>
              <Ionicons name="videocam" size={16} color="#f59e0b" />
              <Text style={styles.previewLabel}>Preview</Text>
            </View>
            <Text style={styles.updateTime}>{formatTime(lastUpdate)}</Text>
          </View>
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
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="wifi" size={20} color="#f59e0b" />
            <Text style={styles.statCardValue}>
              {((site.health?.video_bitrate || 0) / 1000).toFixed(1)} Mbps
            </Text>
            <Text style={styles.statCardLabel}>Output</Text>
            <Text style={styles.statCardSub}>
              In: {((site.health?.source_bitrate || 0) / 1000).toFixed(1)} Mbps
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="pulse" size={20} color="#22c55e" />
            <Text style={styles.statCardValue}>{site.health?.dropped_frames || 0} FPS</Text>
            <Text style={styles.statCardLabel}>Dropped</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="hardware-chip" size={20} color="#3b82f6" />
            <Text style={styles.statCardValue}>{(site.health?.cpu_usage || 0).toFixed(0)}%</Text>
            <Text style={styles.statCardLabel}>CPU</Text>
            {site.health?.gpu_usage !== undefined && (
              <Text style={styles.statCardSub}>GPU: {site.health.gpu_usage.toFixed(0)}%</Text>
            )}
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#8b5cf6" />
            <Text style={styles.statCardValue}>{formatUptime(site.health?.uptime_seconds)}</Text>
            <Text style={styles.statCardLabel}>Uptime</Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{site.location || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agent Version</Text>
              <Text style={styles.infoValue}>v{site.agent_version || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stream Status</Text>
              <Text style={[styles.infoValue, { color: isLive ? '#22c55e' : '#f59e0b' }]}>
                {streamStatus}
              </Text>
            </View>
            {site.health?.last_heartbeat && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Heartbeat</Text>
                <Text style={styles.infoValue}>
                  {new Date(site.health.last_heartbeat).toLocaleString()}
                </Text>
              </View>
            )}
            {site.health?.gpu_temp !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GPU Temp</Text>
                <Text style={styles.infoValue}>{site.health.gpu_temp}°C</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stream Controls */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Stream Controls</Text>
          <View style={styles.controlRow}>
            {isLive ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStopStream}
                disabled={isStreamLoading}
              >
                {isStreamLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="stop" size={18} color="#ffffff" />
                    <Text style={styles.controlButtonText}>Stop</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, styles.startButton]}
                onPress={handleStartStream}
                disabled={isStreamLoading}
              >
                {isStreamLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="play" size={18} color="#ffffff" />
                    <Text style={styles.controlButtonText}>Start</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchSite(false)}>
              <Ionicons name="refresh" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logs Section */}
        <View style={styles.logsSection}>
          <TouchableOpacity style={styles.logsHeader} onPress={() => setShowLogs(!showLogs)}>
            <View style={styles.logsTitle}>
              <Ionicons name="terminal" size={18} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Recent Logs</Text>
            </View>
            <Ionicons name={showLogs ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {showLogs && (
            <View style={styles.logsContainer}>
              {logs.length > 0 ? (
                <ScrollView style={styles.logsScroll} nestedScrollEnabled>
                  {logs.slice(0, 20).map((log, index) => (
                    <Text key={index} style={styles.logLine} numberOfLines={2}>
                      {log}
                    </Text>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noLogs}>No logs available</Text>
              )}
            </View>
          )}
        </View>

        {/* Restart Button */}
        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
          <Ionicons name="power" size={20} color="#ffffff" />
          <Text style={styles.restartButtonText}>Restart Site PC</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
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
    marginBottom: 4,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  updateTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2 - 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statCardSub: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  controlSection: {
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  stopButton: {
    backgroundColor: '#ef444420',
    borderColor: '#ef4444',
  },
  startButton: {
    backgroundColor: '#22c55e20',
    borderColor: '#22c55e',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  refreshButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsSection: {
    marginBottom: 16,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
  },
  logsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logsContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginTop: 8,
    padding: 12,
    maxHeight: 200,
  },
  logsScroll: {
    maxHeight: 180,
  },
  logLine: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  noLogs: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
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
});
