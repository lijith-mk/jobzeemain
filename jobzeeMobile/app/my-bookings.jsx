import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SESSIONS.MY_BOOKINGS);
      const data = response.data;
      if (data.success) {
        setBookings(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getFilteredBookings = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledDate);
          return bookingDate >= now && booking.sessionStatus !== 'cancelled';
        });
      case 'past':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledDate);
          return bookingDate < now || booking.sessionStatus === 'completed';
        });
      case 'cancelled':
        return bookings.filter(booking => booking.sessionStatus === 'cancelled');
      default:
        return bookings;
    }
  };

  const getStatusBadge = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    
    if (booking.sessionStatus === 'cancelled') {
      return { text: 'Cancelled', color: '#EF4444' };
    }
    if (booking.sessionStatus === 'completed') {
      return { text: 'Completed', color: '#10B981' };
    }
    if (booking.sessionStatus === 'no-show') {
      return { text: 'No Show', color: '#F59E0B' };
    }
    if (bookingDate < now) {
      return { text: 'Past', color: '#6B7280' };
    }
    return { text: 'Upcoming', color: '#3B82F6' };
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return { text: 'Paid', color: '#10B981' };
      case 'pending':
        return { text: 'Payment Pending', color: '#F59E0B' };
      case 'failed':
        return { text: 'Payment Failed', color: '#EF4444' };
      case 'free':
        return { text: 'Free', color: '#6B7280' };
      default:
        return { text: paymentStatus, color: '#6B7280' };
    }
  };

  const renderBookingCard = ({ item }) => {
    const statusBadge = getStatusBadge(item);
    const paymentBadge = getPaymentStatusBadge(item.paymentStatus);
    const canCancel = item.sessionStatus === 'scheduled' && new Date(item.scheduledDate) > new Date();

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push({
          pathname: '/session-details',
          params: { sessionId: item._id }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {item.mentorId?.photo && (
              <Image
                source={{ uri: item.mentorId.photo }}
                style={styles.mentorImage}
              />
            )}
            <View>
              <Text style={styles.mentorName}>{item.mentorId?.name || 'Mentor'}</Text>
              <Text style={styles.sessionId}>ID: {item.sessionId}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.sessionTitle}>{item.sessionTypeId?.title || 'Session'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏰ Time:</Text>
            <Text style={styles.infoValue}>{item.scheduledTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏱ Duration:</Text>
            <Text style={styles.infoValue}>{item.duration} minutes</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💰 Amount:</Text>
            <Text style={styles.infoValue}>₹{String(item.amount).replace(/[$₹]/g, '')}</Text>
          </View>

          <View style={[styles.paymentBadge, { backgroundColor: `${paymentBadge.color}20` }]}>
            <Text style={[styles.paymentText, { color: paymentBadge.color }]}>
              {paymentBadge.text}
            </Text>
          </View>

          {item.meetingLink && (
            <View style={styles.meetingLinkContainer}>
              <Text style={styles.meetingLinkLabel}>🔗 Meeting Link Available</Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push({
              pathname: '/session-details',
              params: { sessionId: item._id }
            })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => confirmCancel(booking),
        },
      ]
    );
  };

  const confirmCancel = async (booking) => {
    try {
      const response = await api.patch(
        API_ENDPOINTS.SESSIONS.CANCEL(booking._id),
        { reason: 'Cancelled by user' }
      );
      const data = response.data;
      
      if (data.success) {
        Alert.alert('Success', 'Session cancelled successfully');
        fetchBookings();
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel session');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', 'Failed to cancel session');
    }
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} total sessions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'You haven\'t booked any sessions yet' 
              : `No ${filter} sessions found`}
          </Text>
          <TouchableOpacity
            style={styles.browseMentorsButton}
            onPress={() => router.push('/(tabs)/mentors')}
          >
            <Text style={styles.browseMentorsText}>Browse Mentors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
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
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#EFF6FF',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mentorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionId: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  paymentBadge: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  meetingLinkContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  meetingLinkLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseMentorsButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseMentorsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
