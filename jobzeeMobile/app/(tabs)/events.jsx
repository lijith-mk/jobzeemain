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
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';
import EventSidebar from '../../components/EventSidebar';

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState({
    type: 'all', // all, free, paid
    mode: 'all', // all, online, offline
    date: 'upcoming', // upcoming, past
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.mode !== 'all') params.append('mode', filter.mode);
      if (filter.date) params.append('date', filter.date);
      
      const response = await api.get(`${API_ENDPOINTS.EVENTS.ALL}?${params.toString()}`);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const filteredEvents = searchQuery
    ? events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

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

  const renderEventCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => router.push(`/event-details?id=${item._id}`)}
    >
      {item.bannerUrl && (
        <Image
          source={{ uri: item.bannerUrl }}
          style={styles.eventBanner}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={[styles.typeBadge, item.type === 'free' ? styles.freeBadge : styles.paidBadge]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'free' ? 'FREE' : `₹${item.price}`}
            </Text>
          </View>
          <View style={[styles.modeBadge, item.mode === 'online' ? styles.onlineBadge : styles.offlineBadge]}>
            <Text style={styles.modeBadgeText}>
              {item.mode === 'online' ? '🌐 Online' : '📍 Offline'}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📅 {formatDate(item.startDateTime)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>🕐 {formatTime(item.startDateTime)}</Text>
          </View>
        </View>

        {item.categories && item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.slice(0, 2).map((category, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        )}

        {item.seatsLimit && (
          <Text style={styles.seatsInfo}>
            {item.attendeesCount || 0} / {item.seatsLimit} seats filled
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1}
            onPress={() => setSidebarVisible(false)}
          />
          <View style={styles.sidebarContainer}>
            <EventSidebar onClose={() => setSidebarVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Header with Menu Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter.type === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, type: 'all' })}
          >
            <Text style={[styles.filterText, filter.type === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter.type === 'free' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, type: 'free' })}
          >
            <Text style={[styles.filterText, filter.type === 'free' && styles.filterTextActive]}>
              Free
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter.type === 'paid' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, type: 'paid' })}
          >
            <Text style={[styles.filterText, filter.type === 'paid' && styles.filterTextActive]}>
              Paid
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter.mode === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, mode: 'all' })}
          >
            <Text style={[styles.filterText, filter.mode === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter.mode === 'online' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, mode: 'online' })}
          >
            <Text style={[styles.filterText, filter.mode === 'online' && styles.filterTextActive]}>
              Online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter.mode === 'offline' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, mode: 'offline' })}
          >
            <Text style={[styles.filterText, filter.mode === 'offline' && styles.filterTextActive]}>
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter.date === 'upcoming' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, date: 'upcoming' })}
          >
            <Text style={[styles.filterText, filter.date === 'upcoming' && styles.filterTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter.date === 'past' && styles.filterButtonActive]}
            onPress={() => setFilter({ ...filter, date: 'past' })}
          >
            <Text style={[styles.filterText, filter.date === 'past' && styles.filterTextActive]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events available</Text>
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebarContainer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
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
    height: 180,
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
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: '#d1fae5',
  },
  paidBadge: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
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
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventMeta: {
    marginBottom: 12,
  },
  metaRow: {
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#3730a3',
  },
  seatsInfo: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
