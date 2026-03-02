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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function MyTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, valid, used, cancelled
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      params.set('page', 1);
      params.set('limit', 20);

      const url = `${API_ENDPOINTS.TICKETS.MY_TICKETS}?${params.toString()}`;
      console.log('Fetching tickets from:', url);
      
      const response = await api.get(url);
      console.log('Tickets response:', response.data);
      
      setTickets(response.data.tickets || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching tickets:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status !== 404) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load tickets'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleCancelTicket = async (ticketId) => {
    Alert.alert(
      'Cancel Ticket',
      'Are you sure you want to cancel this ticket? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(API_ENDPOINTS.TICKETS.CANCEL(ticketId));
              Alert.alert('Success', 'Ticket cancelled successfully');
              fetchTickets();
            } catch (error) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to cancel ticket'
              );
            }
          },
        },
      ]
    );
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return '#10B981';
      case 'used':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusBadgeStyle = (status) => {
    return {
      ...styles.statusBadge,
      backgroundColor: `${getStatusColor(status)}20`,
    };
  };

  const renderTicketCard = ({ item }) => {
    const event = item.eventId;
    if (!event) return null;

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => router.push(`/event-details?id=${event._id}`)}
        activeOpacity={0.95}
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Text style={styles.ticketNumber}>{item.ticketId}</Text>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
          </View>
          <View style={[getStatusBadgeStyle(item.status)]}>
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.ticketBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}
              </Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {event.location}
                </Text>
              </View>
            </View>
          )}

          {item.ticketType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🎫</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ticket Type</Text>
                <Text style={styles.detailValue}>
                  {item.ticketType}
                  {item.ticketPrice > 0 && ` - ₹${item.ticketPrice}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Ticket Code Section */}
        {item.status === 'valid' && (
          <View style={styles.ticketCodeSection}>
            <Text style={styles.ticketCodeLabel}>Ticket Code</Text>
            <View style={styles.ticketCodeContainer}>
              <Text style={styles.ticketCodeText}>{item.ticketId}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={async () => {
                  await Clipboard.setStringAsync(item.ticketId);
                  Alert.alert('Copied!', 'Ticket code copied to clipboard');
                }}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ticketCodeInstructions}>
              Show this code at venue for entry
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.ticketActions}>
          {item.status === 'valid' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/event-details?id=${event._id}`)}
              >
                <Text style={styles.actionButtonText}>View Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelTicket(item._id)}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'used' && (
            <View style={styles.usedInfo}>
              <Text style={styles.usedText}>
                ✓ Attended on {formatDate(item.usedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Ticket Perforations */}
        <View style={styles.perforation}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={styles.perforationDot} />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['all', 'valid', 'used', 'cancelled'].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            filter === status && styles.filterButtonActive,
          ]}
          onPress={() => setFilter(status)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === status && styles.filterButtonTextActive,
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      {renderFilterButtons()}

      {/* Tickets Count */}
      {tickets.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {pagination.total || tickets.length}{' '}
            {(pagination.total || tickets.length) === 1 ? 'ticket' : 'tickets'}
          </Text>
        </View>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>No Tickets Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? "You haven't registered for any events yet"
              : `No ${filter} tickets found`}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/events')}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketCard}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#6366F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ticketHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  ticketNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  ticketBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  ticketCodeSection: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  ticketCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  ticketCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  copyButton: {
    marginLeft: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ticketCodeInstructions: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#DC2626',
  },
  usedInfo: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  usedText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  perforation: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    transform: [{ translateY: -2 }],
  },
  perforationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
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
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
