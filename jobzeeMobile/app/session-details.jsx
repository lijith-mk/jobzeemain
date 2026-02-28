import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

export default function SessionDetailsScreen() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const endpoint = typeof API_ENDPOINTS.SESSIONS.BY_ID === 'function'
        ? API_ENDPOINTS.SESSIONS.BY_ID(sessionId)
        : `/sessions/${sessionId}`;
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!session.meetingLink) {
      Alert.alert('No Meeting Link', 'Meeting link not available yet');
      return;
    }

    try {
      // Track join
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.JOIN(sessionId)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      // Open meeting link
      Linking.openURL(session.meetingLink);
    } catch (error) {
      console.error('Error joining session:', error);
      // Still open the link even if tracking fails
      Linking.openURL(session.meetingLink);
    }
  };

  const handleCancelSession = () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
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
          body: JSON.stringify({
            reason: 'Cancelled by user',
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Session cancelled successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel session');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', 'Failed to cancel session');
    }
  };

  const getStatusInfo = () => {
    if (!session) return { text: '', color: '' };
    
    const now = new Date();
    const bookingDate = new Date(session.scheduledDate);
    
    if (session.sessionStatus === 'cancelled') {
      return { text: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' };
    }
    if (session.sessionStatus === 'completed') {
      return { text: 'Completed', color: '#10B981', bg: '#D1FAE5' };
    }
    if (session.sessionStatus === 'no-show') {
      return { text: 'No Show', color: '#F59E0B', bg: '#FEF3C7' };
    }
    if (bookingDate < now) {
      return { text: 'Past', color: '#6B7280', bg: '#F3F4F6' };
    }
    return { text: 'Upcoming', color: '#3B82F6', bg: '#EFF6FF' };
  };

  const getPaymentInfo = () => {
    if (!session) return { text: '', color: '' };
    
    switch (session.paymentStatus) {
      case 'paid':
        return { text: 'Paid', color: '#10B981', bg: '#D1FAE5' };
      case 'pending':
        return { text: 'Payment Pending', color: '#F59E0B', bg: '#FEF3C7' };
      case 'failed':
        return { text: 'Payment Failed', color: '#EF4444', bg: '#FEE2E2' };
      case 'free':
        return { text: 'Free Session', color: '#6B7280', bg: '#F3F4F6' };
      default:
        return { text: session.paymentStatus, color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading session details...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo();
  const paymentInfo = getPaymentInfo();
  const canCancel = session.sessionStatus === 'scheduled' && new Date(session.scheduledDate) > new Date();
  const canJoin = session.meetingLink && session.sessionStatus === 'scheduled';

  return (
    <ScrollView style={styles.container}>
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
        <Text style={styles.sessionId}>Session ID: {session.sessionId}</Text>
      </View>

      {/* Mentor Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mentor</Text>
        <View style={styles.mentorCard}>
          {session.mentorId?.photo && (
            <Image
              source={{ uri: session.mentorId.photo }}
              style={styles.mentorImage}
            />
          )}
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorName}>{session.mentorId?.name || 'Mentor'}</Text>
            {session.mentorId?.email && (
              <Text style={styles.mentorEmail}>✉️ {session.mentorId.email}</Text>
            )}
            {session.mentorId?.city && session.mentorId?.country && (
              <Text style={styles.mentorLocation}>
                📍 {session.mentorId.city}, {session.mentorId.country}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Session Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Details</Text>
        <View style={styles.detailsCard}>
          <Text style={styles.sessionTitle}>
            {session.sessionTypeId?.title || 'Mentorship Session'}
          </Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(session.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ Time:</Text>
            <Text style={styles.detailValue}>{session.scheduledTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱ Duration:</Text>
            <Text style={styles.detailValue}>{session.duration} minutes</Text>
          </View>

          {session.sessionTypeId?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>
                {session.sessionTypeId.description}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount:</Text>
            <Text style={styles.paymentAmount}>₹{session.amount}</Text>
          </View>
          
          <View style={[styles.paymentStatusBadge, { backgroundColor: paymentInfo.bg }]}>
            <Text style={[styles.paymentStatusText, { color: paymentInfo.color }]}>
              {paymentInfo.text}
            </Text>
          </View>

          {session.paymentMode && session.paymentMode !== 'none' && (
            <Text style={styles.paymentMode}>Mode: {session.paymentMode}</Text>
          )}

          {session.paymentId && (
            <Text style={styles.paymentId}>Payment ID: {session.paymentId}</Text>
          )}
        </View>
      </View>

      {/* Meeting Link */}
      {session.meetingLink && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Link</Text>
          <TouchableOpacity
            style={styles.meetingLinkCard}
            onPress={handleJoinSession}
          >
            <Text style={styles.meetingLinkIcon}>🔗</Text>
            <View style={styles.meetingLinkInfo}>
              <Text style={styles.meetingLinkLabel}>Join Meeting</Text>
              <Text style={styles.meetingLinkText} numberOfLines={1}>
                {session.meetingLink}
              </Text>
            </View>
          </TouchableOpacity>
          {session.linkAddedAt && (
            <Text style={styles.linkAddedInfo}>
              Link added: {new Date(session.linkAddedAt).toLocaleString()}
            </Text>
          )}
        </View>
      )}

      {/* Notes */}
      {session.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Notes</Text>
          <View style={styles.notesCard}>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        </View>
      )}

      {/* Evaluation (for completed sessions) */}
      {session.evaluation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mentor Feedback</Text>
          <View style={styles.evaluationCard}>
            <Text style={styles.evaluationText}>{session.evaluation}</Text>
          </View>
        </View>
      )}

      {/* Cancellation Info */}
      {session.sessionStatus === 'cancelled' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Details</Text>
          <View style={styles.cancellationCard}>
            {session.cancelledBy && (
              <Text style={styles.cancellationText}>
                Cancelled by: {session.cancelledBy}
              </Text>
            )}
            {session.cancelledAt && (
              <Text style={styles.cancellationText}>
                Cancelled on: {new Date(session.cancelledAt).toLocaleString()}
              </Text>
            )}
            {session.cancellationReason && (
              <Text style={styles.cancellationReason}>
                Reason: {session.cancellationReason}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinSession}
          >
            <Text style={styles.joinButtonText}>Join Meeting</Text>
          </TouchableOpacity>
        )}
        
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSession}
          >
            <Text style={styles.cancelButtonText}>Cancel Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionId: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  mentorEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  mentorLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  paymentId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  meetingLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  meetingLinkIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  meetingLinkInfo: {
    flex: 1,
  },
  meetingLinkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  meetingLinkText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  linkAddedInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  evaluationCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 16,
  },
  evaluationText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  cancellationCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 16,
  },
  cancellationText: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 4,
  },
  cancellationReason: {
    fontSize: 14,
    color: '#991B1B',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
