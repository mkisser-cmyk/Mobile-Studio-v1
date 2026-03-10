import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '../../src/services/api';
import { Site } from '../../src/types';
import SiteCard from '../../src/components/SiteCard';

export default function SitesListScreen() {
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSites = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getSites();
      setSites(data);
      setFilteredSites(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sites');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
    
    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchSites(false);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSites]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSites(sites);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSites(
        sites.filter(
          (site) =>
            site.name.toLowerCase().includes(query) ||
            site.location?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, sites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSites(false);
  };

  const handleSitePress = (site: Site) => {
    router.push({
      pathname: '/site/[id]',
      params: { id: site.id }
    });
  };

  const onlineSites = filteredSites.filter(
    (s) => (s.health?.status || s.status)?.toLowerCase() === 'online'
  );
  const offlineSites = filteredSites.filter(
    (s) => (s.health?.status || s.status)?.toLowerCase() !== 'online'
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading sites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sites</Text>
          <View style={styles.updateBadge}>
            <Ionicons name="sync" size={12} color="#6b7280" />
            <Text style={styles.updateText}>{formatTime(lastUpdate)}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <View style={[styles.statDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.statText}>{onlineSites.length} Online</Text>
          </View>
          <View style={styles.statBadge}>
            <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.statText}>{offlineSites.length} Offline</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="layers" size={14} color="#6b7280" />
            <Text style={styles.statText}>{sites.length} Total</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sites..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color="#6b7280"
            onPress={() => setSearchQuery('')}
          />
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText} onPress={() => fetchSites()}>Tap to retry</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SiteCard site={item} onPress={() => handleSitePress(item)} />
          )}
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
              <Ionicons name="desktop-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No sites found</Text>
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
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  updateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
});
