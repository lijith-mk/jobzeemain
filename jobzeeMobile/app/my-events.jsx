import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function MyEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchMyEvents();
    fetchStats();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MY_EVENTS);
      setEvents(response.data.registrations || []);
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.USER_STATS);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyEvents();
    fetchStats();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (registration) => {
    if (registration.status === 'attended') {
      return { text: 'Attended', style: styles.attendedBadge };
    }
    if (registration.status === 'cancelled') {
      return { text: 'Cancelled', style: styles.cancelledBadge };
    }
    
    const eventDate = new Date(registration.event?.endDateTime);
    const now = new Date();
    
    if (eventDate < now) {
      return { text: 'Past', style: styles.pastBadge };
    }
    return { text: 'Upcoming', style: styles.upcomingBadge };
  };

  const renderEventCard = ({ item }) => {
    const event = item.event;
    if (!event) return null;
    
    const badge = getStatusBadge(item);

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => router.push(`/event-details?id=${event._id}`)}
      >
        {event.bannerUrl && (
          <Image
            source={{ uri: event.bannerUrl }}
            style={styles.eventBanner}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={badge.style}>
              <Text style={styles.badgeText}>{badge.text}</Text>
            </View>
            <View style={[styles.modeBadge, event.mode === 'online' ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.modeBadgeText}>
                {event.mode === 'online' ? '🌐 Online' : '📍 Offline'}
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.eventMeta}>
            <Text style={styles.metaText}>📅 {formatDate(event.startDateTime)}</Text>
            <Text style={styles.metaText}>🕐 {formatTime(event.startDateTime)}</Text>
            {item.ticketPrice > 0 && (
              <Text style={styles.metaText}>💳 Paid: ₹{item.ticketPrice}</Text>
            )}
          </View>

          {item.status === 'attended' && item.certificateIssued && (
            <View style={styles.certificateBadge}>
              <Text style={styles.certificateText}>🏆 Certificate Issued</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.uniqueEvents || 0}</Text>
            <Text style={styles.statLabel}>Registered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.certificatesIssued || 0}</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalApprovedEvents || 0}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>
              You haven't registered for any events.{'\n'}
              Browse available events and register!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/events')}
            >
              <Text style={styles.browseButtonText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventBanner: {
    width: '100%',
    height: 150,
    backgroundColor: '#e5e7eb',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upcomingBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  attendedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pastBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  onlineBadge: {
    backgroundColor: '#dbeafe',
  },
  offlineBadge: {
    backgroundColor: '#fce7f3',
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  eventMeta: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  certificateBadge: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  certificateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
