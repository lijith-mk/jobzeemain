import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function EventSidebar({ onClose }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'browse',
      label: 'Browse Events',
      icon: '🎉',
      path: '/(tabs)/events',
    },
    {
      id: 'my-events',
      label: 'My Events',
      icon: '📅',
      path: '/my-events',
    },
    {
      id: 'my-tickets',
      label: 'My Tickets',
      icon: '🎫',
      path: '/my-tickets',
    },
    {
      id: 'payments',
      label: 'Event Payments',
      icon: '💳',
      path: '/event-payments',
    },
  ];

  const handleNavigation = (path) => {
    if (path === '/(tabs)/events') {
      // Stay on events tab
      if (onClose) onClose();
    } else {
      router.push(path);
      if (onClose) onClose();
    }
  };

  const isActive = (path) => {
    if (path === '/(tabs)/events') {
      return pathname === '/events';
    }
    return pathname?.includes(path.replace('/', ''));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.headerIcon}>🎉</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>JobZee</Text>
          <Text style={styles.headerSubtitle}>Event Portal</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              isActive(item.path) && styles.menuItemActive,
            ]}
            onPress={() => handleNavigation(item.path)}
          >
            <View style={styles.menuItemContent}>
              <View style={[
                styles.iconCircle,
                isActive(item.path) && styles.iconCircleActive,
              ]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={[
                styles.menuLabel,
                isActive(item.path) && styles.menuLabelActive,
              ]}>
                {item.label}
              </Text>
            </View>
            {isActive(item.path) && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 JobZee</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menu: {
    padding: 16,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  menuLabelActive: {
    color: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 4,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    transform: [{ translateY: -12 }],
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
