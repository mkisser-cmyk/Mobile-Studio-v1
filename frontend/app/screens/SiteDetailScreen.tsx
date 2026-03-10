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

export default function SiteDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSite = useCallback(async (showLoader = true) => {
    if (!id) {
      setError('No site ID provided');
      setIsLoading(false);
      return;
    }
    
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSite(id);
      setSite(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch site');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSite();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchSite(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchSite]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSite(false);
  };

  const handleStopStream = async () => {
    if (!id) return;
    try {
      await apiClient.stopStream(id);
      Alert.alert('Success', 'Stop command sent');
      fetchSite(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to stop stream');
    }
  };

  const handleStartStream = async () => {
    if (!id) return;
    try {
      await apiClient.startStream(id);
      Alert.alert('Success', 'Start command sent');
      fetchSite(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to start stream');
    }
  };

  const handleRestart = () => {
    if (!id || !site) return;
    Alert.alert(
      'Restart Site PC',
      `Restart ${site.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.restartSitePC(id);
              Alert.alert('Success', 'Restart command sent');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to restart');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !site) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Site not found'}</Text>
          <TouchableOpacity onPress={() => fetchSite()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get site data safely
  const status = site.health?.status || 'offline';
  const streamStatus = site.health?.stream_status || 'stopped';
  const isOnline = status.toLowerCase() === 'online';
  const isStreaming = streamStatus.toLowerCase() === 'live' || streamStatus.toLowerCase() === 'running';
  const previewImage = site.health?.preview_image || null;
  const videoBitrate = site.health?.video_bitrate || 0;
  const cpuUsage = site.health?.cpu_usage || 0;
  const gpuUsage = site.health?.gpu_usage || 0;
  const uptime = site.health?.uptime_seconds || 0;

  const formatUptime = (secs: number) => {
    if (!secs) return '0m';
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{site.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: isOnline ? '#22c55e30' : '#ef444430' }]}>
              <View style={[styles.dot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.badgeText, { color: isOnline ? '#22c55e' : '#ef4444' }]}>{status}</Text>
            </View>
            {isStreaming && (
              <View style={[styles.badge, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        {/* Preview */}
        <View style={styles.previewBox}>
          {previewImage ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${previewImage}` }}
              style={styles.previewImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noPreview}>
              <Ionicons name="videocam-off" size={40} color="#666" />
              <Text style={styles.noPreviewText}>No preview</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="speedometer" size={20} color="#f59e0b" />
            <Text style={styles.statVal}>{(videoBitrate / 1000).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Mbps</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="hardware-chip" size={20} color="#3b82f6" />
            <Text style={styles.statVal}>{cpuUsage.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>CPU</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="desktop" size={20} color="#8b5cf6" />
            <Text style={styles.statVal}>{gpuUsage.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>GPU</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time" size={20} color="#22c55e" />
            <Text style={styles.statVal}>{formatUptime(uptime)}</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoVal}>{site.location || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Agent</Text>
            <Text style={styles.infoVal}>v{site.agent_version || '?'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stream</Text>
            <Text style={[styles.infoVal, { color: isStreaming ? '#22c55e' : '#f59e0b' }]}>{streamStatus}</Text>
          </View>
        </View>

        {/* Controls */}
        <Text style={styles.sectionTitle}>Stream Controls</Text>
        <View style={styles.controlsRow}>
          {isStreaming ? (
            <TouchableOpacity style={[styles.ctrlBtn, styles.stopBtn]} onPress={handleStopStream}>
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={styles.ctrlText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.ctrlBtn, styles.startBtn]} onPress={handleStartStream}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.ctrlText}>Start</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchSite(false)}>
            <Ionicons name="refresh" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Restart */}
        <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
          <Ionicons name="power" size={20} color="#fff" />
          <Text style={styles.restartText}>Restart Site PC</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  previewBox: { width: '100%', aspectRatio: 16/9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a', marginBottom: 16 },
  previewImg: { width: '100%', height: '100%' },
  noPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noPreviewText: { color: '#666', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  infoBox: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  infoLabel: { color: '#888', fontSize: 14 },
  infoVal: { color: '#fff', fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  controlsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  ctrlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  stopBtn: { backgroundColor: '#ef444440', borderWidth: 1, borderColor: '#ef4444' },
  startBtn: { backgroundColor: '#22c55e40', borderWidth: 1, borderColor: '#22c55e' },
  ctrlText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  refreshBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  restartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, marginTop: 8 },
  restartText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  errorText: { color: '#ef4444', marginTop: 12, fontSize: 15 },
  retryText: { color: '#f59e0b', marginTop: 8, fontSize: 14 },
});
