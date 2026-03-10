import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '../../src/services/api';
import { Site } from '../../src/types';

interface DownAlert {
  id: string;
  siteName: string;
  siteId: string;
  status: string;
  streamStatus: string;
  lastHeartbeat: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export default function AlertsScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSites = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSites();
      setSites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sites');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
    
    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchSites(false);
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSites(false);
  };

  // Generate alerts from site status
  const alerts: DownAlert[] = sites
    .filter(site => {
      const status = site.health?.status || site.status || 'offline';
      const streamStatus = site.health?.stream_status || 'stopped';
      return status.toLowerCase() !== 'online' || streamStatus.toLowerCase() !== 'live';
    })
    .map(site => {
      const status = site.health?.status || site.status || 'offline';
      const streamStatus = site.health?.stream_status || 'stopped';
      const isOffline = status.toLowerCase() !== 'online';
      
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (isOffline) {
        severity = 'critical';
      } else if (streamStatus.toLowerCase() === 'error') {
        severity = 'high';
      } else if (streamStatus.toLowerCase() === 'stopped') {
        severity = 'medium';
      }

      return {
        id: site.id,
        siteName: site.name,
        siteId: site.id,
        status: status,
        streamStatus: streamStatus,
        lastHeartbeat: site.health?.last_heartbeat || null,
        severity,
      };
    })
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getAlertIcon = (status: string, streamStatus: string): keyof typeof Ionicons.glyphMap => {
    if (status.toLowerCase() !== 'online') return 'cloud-offline';
    if (streamStatus.toLowerCase() === 'error') return 'alert-circle';
    if (streamStatus.toLowerCase() === 'stopped') return 'pause-circle';
    return 'information-circle';
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleAlertPress = (alert: DownAlert) => {
    router.push({
      pathname: '/site/[id]',
      params: { id: alert.siteId }
    });
  };

  const renderAlert = ({ item }: { item: DownAlert }) => {
    const severityColor = getSeverityColor(item.severity);
    const isOffline = item.status.toLowerCase() !== 'online';
    
    return (
      <TouchableOpacity 
        style={[styles.alertCard, { borderLeftColor: severityColor }]}
        onPress={() => handleAlertPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: severityColor + '20' }]}>
          <Ionicons 
            name={getAlertIcon(item.status, item.streamStatus)} 
            size={24} 
            color={severityColor} 
          />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={styles.siteName}>{item.siteName}</Text>
            <View style={[styles.severityBadge, { backgroundColor: severityColor + '30' }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {item.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>
            {isOffline 
              ? `Site is offline` 
              : `Stream ${item.streamStatus}`
            }
          </Text>
          <View style={styles.alertFooter}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: isOffline ? '#ef4444' : '#f59e0b' }]} />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <Text style={styles.timestamp}>
              Last seen: {formatTimestamp(item.lastHeartbeat)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Checking sites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.badgeRow}>
          {criticalCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#ef444430' }]}>
              <Text style={[styles.countText, { color: '#ef4444' }]}>{criticalCount} Critical</Text>
            </View>
          )}
          {highCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#f9731630' }]}>
              <Text style={[styles.countText, { color: '#f97316' }]}>{highCount} High</Text>
            </View>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => fetchSites()}>Tap to retry</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#f59e0b"
              colors={['#f59e0b']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              </View>
              <Text style={styles.emptyTitle}>All Systems Operational</Text>
              <Text style={styles.emptyText}>All sites are online and streaming</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="desktop" size={24} color="#22c55e" />
                  <Text style={styles.statValue}>{sites.length}</Text>
                  <Text style={styles.statLabel}>Sites Online</Text>
                </View>
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9ca3af',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
