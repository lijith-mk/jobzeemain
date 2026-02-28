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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../../constants/config';

export default function MentorSessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, completed, scheduled

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.MENTOR_TOKEN);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.MENTOR_SESSIONS}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const getFilteredSessions = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduledDate);
          return sessionDate >= now && session.sessionStatus !== 'cancelled';
        });
      case 'past':
        return sessions.filter(session => {
          const sessionDate = new Date(session.scheduledDate);
          return sessionDate < now;
        });
      case 'completed':
        return sessions.filter(session => session.sessionStatus === 'completed');
      case 'scheduled':
        return sessions.filter(session => session.sessionStatus === 'scheduled');
      default:
        return sessions;
    }
  };

  const getStatusBadge = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.scheduledDate);
    
    if (session.sessionStatus === 'cancelled') {
      return { text: 'Cancelled', color: '#EF4444' };
    }
    if (session.sessionStatus === 'completed') {
      return { text: 'Completed', color: '#10B981' };
    }
    if (session.sessionStatus === 'no-show') {
      return { text: 'No Show', color: '#F59E0B' };
    }
    if (sessionDate < now && session.sessionStatus === 'scheduled') {
      return { text: 'Needs Action', color: '#F59E0B' };
    }
    return { text: 'Scheduled', color: '#3B82F6' };
  };

  const renderSessionCard = ({ item }) => {
    const statusBadge = getStatusBadge(item);
    const sessionDate = new Date(item.scheduledDate);
    const isPast = sessionDate < new Date();
    const needsAction = isPast && item.sessionStatus === 'scheduled';

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          needsAction && styles.sessionCardNeedsAction,
        ]}
        onPress={() => router.push({
          pathname: '/mentor-session-details',
          params: { sessionId: item._id }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {item.userId?.photo && (
              <Image
                source={{ uri: item.userId.photo }}
                style={styles.userImage}
              />
            )}
            <View>
              <Text style={styles.userName}>{item.userId?.name || 'Employee'}</Text>
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
              {sessionDate.toLocaleDateString('en-US', {
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
            <Text style={styles.infoValue}>₹{item.amount}</Text>
          </View>

          {item.paymentStatus && (
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>
                Payment: {item.paymentStatus}
              </Text>
            </View>
          )}

          {item.meetingLink && (
            <View style={styles.meetingLinkIndicator}>
              <Text style={styles.meetingLinkText}>🔗 Meeting link added</Text>
            </View>
          )}

          {!item.meetingLink && item.sessionStatus === 'scheduled' && (
            <View style={styles.noLinkWarning}>
              <Text style={styles.noLinkText}>⚠️ Add meeting link</Text>
            </View>
          )}

          {needsAction && (
            <View style={styles.actionNeeded}>
              <Text style={styles.actionNeededText}>
                ⚠️ Session completed? Please update status
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push({
              pathname: '/mentor-session-details',
              params: { sessionId: item._id }
            })}
          >
            <Text style={styles.manageButtonText}>Manage Session</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredSessions = getFilteredSessions();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <Text style={styles.subtitle}>{sessions.length} total sessions</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {sessions.filter(s => s.sessionStatus === 'scheduled').length}
          </Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {sessions.filter(s => s.sessionStatus === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {sessions.filter(s => {
              const date = new Date(s.scheduledDate);
              const now = new Date();
              return date >= now && s.sessionStatus !== 'cancelled';
            }).length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
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
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'scheduled' && styles.filterTabActive]}
          onPress={() => setFilter('scheduled')}
        >
          <Text style={[styles.filterText, filter === 'scheduled' && styles.filterTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No Sessions Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'No sessions booked yet' 
              : `No ${filter} sessions found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionCard}
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionCardNeedsAction: {
    borderWidth: 2,
    borderColor: '#F59E0B',
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
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
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
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  paymentText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  meetingLinkIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  meetingLinkText: {
    fontSize: 12,
    color: '#065F46',
  },
  noLinkWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  noLinkText: {
    fontSize: 12,
    color: '#92400E',
  },
  actionNeeded: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  actionNeededText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  manageButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#FFFFFF',
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
  },
});
