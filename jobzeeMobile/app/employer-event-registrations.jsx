import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function EmployerEventRegistrationsScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    attended: 0,
    cancelled: 0,
    totalPaid: 0,
  });

  useEffect(() => {
    if (id) {
      fetchRegistrations();
    }
  }, [id]);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.EVENT_REGISTRATIONS(id));
      const data = response.data.registrations || response.data || [];
      setRegistrations(data);
      
      // Calculate stats
      const total = data.length;
      const attended = data.filter(r => r.status === 'attended').length;
      const cancelled = data.filter(r => r.status === 'cancelled').length;
      const totalPaid = data
        .filter(r => r.ticketPrice > 0)
        .reduce((sum, r) => sum + r.ticketPrice, 0);
      
      setStats({ total, attended, cancelled, totalPaid });
    } catch (error) {
      console.error('Error fetching registrations:', error);
      Alert.alert('Error', 'Failed to load registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'attended':
        return { text: 'Attended', style: styles.attendedBadge };
      case 'cancelled':
        return { text: 'Cancelled', style: styles.cancelledBadge };
      default:
        return { text: 'Registered', style: styles.registeredBadge };
    }
  };

  const renderRegistrationCard = ({ item }) => {
    const badge = getStatusBadge(item.status);
    const user = item.userId || item.user;

    return (
      <View style={styles.registrationCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
          <View style={badge.style}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Registered:</Text>
            <Text style={styles.detailValue}>{formatDate(item.registeredAt)}</Text>
          </View>

          {item.ticketPrice > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💰 Paid:</Text>
              <Text style={styles.detailValue}>₹{item.ticketPrice}</Text>
            </View>
          )}

          {item.paymentStatus && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={[
                styles.detailValue,
                item.paymentStatus === 'completed' ? styles.successText : styles.pendingText
              ]}>
                {item.paymentStatus}
              </Text>
            </View>
          )}

          {user?.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📱 Phone:</Text>
              <Text style={styles.detailValue}>{user.phone}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading registrations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Event'} - Registrations
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.attended}</Text>
          <Text style={styles.statLabel}>Attended</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
        {stats.totalPaid > 0 && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.totalPaid}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        )}
      </View>

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Registrations Yet</Text>
          <Text style={styles.emptyText}>
            No one has registered for this event yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderRegistrationCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  registrationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelledBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  registeredBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  successText: {
    color: '#10b981',
  },
  pendingText: {
    color: '#f59e0b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
