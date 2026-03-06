import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../types';

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
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

  const getAlertIcon = (alertType: string): keyof typeof Ionicons.glyphMap => {
    switch (alertType.toLowerCase()) {
      case 'offline':
      case 'connection':
        return 'wifi-off';
      case 'cpu':
        return 'hardware-chip';
      case 'gpu':
        return 'desktop';
      case 'stream':
        return 'videocam-off';
      default:
        return 'alert-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
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

  const severityColor = getSeverityColor(alert.severity);

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: severityColor + '20' }]}>
        <Ionicons name={getAlertIcon(alert.alertType)} size={20} color={severityColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.siteName}>{alert.siteName}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityColor + '30' }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {alert.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.message} numberOfLines={2}>{alert.message}</Text>
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{formatTimestamp(alert.timestamp)}</Text>
          {alert.resolved && (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolvedText: {
    fontSize: 12,
    color: '#22c55e',
  },
});
