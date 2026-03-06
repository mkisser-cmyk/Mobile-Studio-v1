import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#f59e0b" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'admin@railstream.net'}</Text>
            {user?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="notifications" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="color-palette" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.settingText}>Appearance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#22c55e20' }]}>
                <Ionicons name="help-circle" size={20} color="#22c55e" />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="information-circle" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.settingText}>About</Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>RailStream Studio Admin</Text>
        <Text style={styles.copyright}>© 2025 RailStream. All rights reserved.</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#f59e0b30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 15,
    color: '#ffffff',
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef444420',
    borderRadius: 12,
    height: 52,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginTop: 32,
  },
  copyright: {
    textAlign: 'center',
    color: '#4b5563',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
});
