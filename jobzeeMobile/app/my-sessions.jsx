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
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function MySessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, completed, cancelled

  useEffect(() => {
    fetchMySessions();
    
    // Auto-refresh for sessions without meeting links
    const interval = setInterval(() => {
      const now = new Date();
      const hasScheduledWithoutLinks = sessions.some(
        s => s.sessionStatus === 'scheduled' && !s.meetingLink
      );
      
      if (hasScheduledWithoutLinks) {
        silentRefresh();
      }
    }, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchMySessions = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        Alert.alert('Error', 'Please login to view your sessions');
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.MY_BOOKINGS}`,
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

  const silentRefresh = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.MY_BOOKINGS}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        const oldSessions = sessions;
        const newSessions = data.data || [];
        
        // Check if new links were added
        const hasNewLinks = oldSessions.some(oldSession => {
          const newSession = newSessions.find(s => s._id === oldSession._id);
          return newSession && newSession.meetingLink && !oldSession.meetingLink;
        });
        
        if (hasNewLinks) {
          Alert.alert('New Meeting Link!', 'A mentor has added a meeting link to one of your sessions');
        }
        
        setSessions(newSessions);
      }
    } catch (error) {
      console.error('Silent refresh error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySessions();
  };

  const handleCancelSession = async (sessionId) => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
              const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.CANCEL(sessionId)}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ reason: 'User cancelled' }),
                }
              );

              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', 'Session cancelled successfully');
                fetchMySessions();
              } else {
                Alert.alert('Error', data.message || 'Failed to cancel session');
              }
            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel session');
            }
          },
        },
      ]
    );
  };

  const handleJoinMeeting = async (meetingLink) => {
    try {
      const supported = await Linking.canOpenURL(meetingLink);
      if (supported) {
        await Linking.openURL(meetingLink);
      } else {
        Alert.alert('Error', 'Cannot open meeting link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open meeting link');
    }
  };

  const handleDownloadInvoice = async (sessionId) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const downloadUrl = `${API_CONFIG.BASE_URL}/api/session-payments/invoice/${sessionId}`;
      
      const fileUri = FileSystem.documentDirectory + `invoice-${sessionId}.pdf`;
      
      Alert.alert('Downloading...', 'Please wait');
      
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'Invoice downloaded successfully', [
          { text: 'Open', onPress: () => Sharing.shareAsync(uri) },
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert('Error', 'Failed to download invoice');
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return sessions.filter(s => {
          const sessionDate = new Date(s.scheduledDate);
          return sessionDate >= now && s.sessionStatus === 'scheduled';
        }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      
      case 'past':
        return sessions.filter(s => {
          const sessionDate = new Date(s.scheduledDate);
          return sessionDate < now && 
                 s.sessionStatus !== 'cancelled' && 
                 s.sessionStatus !== 'completed';
        }).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
      
      case 'completed':
        return sessions.filter(s => s.sessionStatus === 'completed')
          .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
      
      case 'cancelled':
        return sessions.filter(s => s.sessionStatus === 'cancelled')
          .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
      
      default:
        return sessions.sort((a, b) => {
          // Scheduled sessions first
          if (a.sessionStatus === 'scheduled' && b.sessionStatus !== 'scheduled') return -1;
          if (a.sessionStatus !== 'scheduled' && b.sessionStatus === 'scheduled') return 1;
          return new Date(b.scheduledDate) - new Date(a.scheduledDate);
        });
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
    if (sessionDate < now && session.sessionStatus === 'scheduled') {
      return { text: 'Pending Review', color: '#F59E0B' };
    }
    if (session.sessionStatus === 'no-show') {
      return { text: 'No Show', color: '#9CA3AF' };
    }
    return { text: 'Scheduled', color: '#3B82F6' };
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const renderSessionCard = ({ item }) => {
    const statusBadge = getStatusBadge(item);
    const sessionDate = new Date(item.scheduledDate);
    const now = new Date();
    const isPast = sessionDate < now;
    const isUpcoming = sessionDate >= now && item.sessionStatus === 'scheduled';
    const canJoin = item.meetingLink && isUpcoming;
    const canCancel = !isPast && item.sessionStatus === 'scheduled';

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push({
          pathname: '/session-details',
          params: { sessionId: item._id }
        })}
      >
        {/* Mentor Info */}
        <View style={styles.mentorHeader}>
          <Image
            source={{ uri: item.mentorId?.photo || 'https://via.placeholder.com/50' }}
            style={styles.mentorPhoto}
          />
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorName}>{item.mentorId?.name || 'Mentor'}</Text>
            <Text style={styles.mentorRole}>
              {item.mentorId?.city && item.mentorId?.country
                ? `${item.mentorId.city}, ${item.mentorId.country}`
                : 'Location not available'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{item.sessionTypeId?.title || 'Session'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              {sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoText}>
              {sessionDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })} ({item.duration || 60} mins)
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>₹{item.price || item.sessionTypeId?.pricing}</Text>
          </View>

          {item.sessionId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔖</Text>
              <Text style={styles.infoText}>ID: {item.sessionId}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {canJoin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleJoinMeeting(item.meetingLink);
              }}
            >
              <Text style={styles.actionButtonText}>🎥 Join Meeting</Text>
            </TouchableOpacity>
          )}
          
          {!item.meetingLink && isUpcoming && (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingText}>Waiting for meeting link...</Text>
            </View>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleCancelSession(item._id);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </TouchableOpacity>
          )}

          {item.sessionStatus === 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.invoiceButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDownloadInvoice(item._id);
              }}
            >
              <Text style={styles.actionButtonText}>📄 Download Invoice</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.sessionStatus === 'cancelled' && item.cancelledBy && (
          <View style={styles.cancellationInfo}>
            <Text style={styles.cancellationText}>
              Cancelled by: {item.cancelledBy === 'mentor' ? 'Mentor' : 'You'}
            </Text>
            {item.cancellationReason && (
              <Text style={styles.cancellationReason}>
                Reason: {item.cancellationReason}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredSessions = getFilteredSessions();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'My Sessions' }} />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Sessions' }} />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: filterItem }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                filter === filterItem.key && styles.filterTabActive,
              ]}
              onPress={() => setFilter(filterItem.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterItem.key && styles.filterTextActive,
                ]}
              >
                {filterItem.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No sessions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'all'
              ? 'Book a mentor session to get started'
              : `No ${filter} sessions available`}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/mentors')}
          >
            <Text style={styles.browseButtonText}>Browse Mentors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mentorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  mentorRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#10b981',
  },
  invoiceButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingBadge: {
    flex: 1,
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  waitingText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
  },
  cancellationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  cancellationText: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
    marginBottom: 4,
  },
  cancellationReason: {
    fontSize: 13,
    color: '#7f1d1d',
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
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
