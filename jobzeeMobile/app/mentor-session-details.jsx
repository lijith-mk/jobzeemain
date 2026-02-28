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
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

export default function MentorSessionDetailsScreen() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Editable fields
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [sessionStatus, setSessionStatus] = useState('');

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.MENTOR_TOKEN);
      const endpoint = typeof API_ENDPOINTS.SESSIONS.MENTOR_SESSION_BY_ID === 'function'
        ? API_ENDPOINTS.SESSIONS.MENTOR_SESSION_BY_ID(sessionId)
        : `/sessions/mentor/sessions/${sessionId}`;
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        setMeetingLink(data.data.meetingLink || '');
        setNotes(data.data.notes || '');
        setEvaluation(data.data.evaluation || '');
        setSessionStatus(data.data.sessionStatus || 'scheduled');
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

  const handleUpdateSession = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.MENTOR_TOKEN);
      const endpoint = typeof API_ENDPOINTS.SESSIONS.UPDATE_SESSION === 'function'
        ? API_ENDPOINTS.SESSIONS.UPDATE_SESSION(sessionId)
        : `/sessions/mentor/sessions/${sessionId}`;
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingLink: meetingLink || undefined,
          notes: notes || undefined,
          evaluation: evaluation || undefined,
          sessionStatus: sessionStatus !== session.sessionStatus ? sessionStatus : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Session updated successfully');
        fetchSessionDetails();
      } else {
        Alert.alert('Error', data.message || 'Failed to update session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      Alert.alert('Error', 'Failed to update session');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkCompleted = () => {
    Alert.alert(
      'Mark as Completed',
      'Mark this session as completed? You can add evaluation feedback before confirming.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            setSessionStatus('completed');
            setTimeout(() => handleUpdateSession(), 100);
          },
        },
      ]
    );
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
          onPress: async () => {
            setSessionStatus('cancelled');
            setTimeout(() => handleUpdateSession(), 100);
          },
        },
      ]
    );
  };

  const handleJoinSession = async () => {
    if (!meetingLink) {
      Alert.alert('No Meeting Link', 'Please add a meeting link first');
      return;
    }

    try {
      // Track join
      const token = await AsyncStorage.getItem(STORAGE_KEYS.MENTOR_TOKEN);
      await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SESSIONS.MENTOR_JOIN(sessionId)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      // Open meeting link
      Linking.openURL(meetingLink);
    } catch (error) {
      console.error('Error joining session:', error);
      // Still open the link even if tracking fails
      Linking.openURL(meetingLink);
    }
  };

  const getStatusInfo = () => {
    if (!session) return { text: '', color: '', bg: '' };
    
    switch (session.sessionStatus) {
      case 'cancelled':
        return { text: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' };
      case 'completed':
        return { text: 'Completed', color: '#10B981', bg: '#D1FAE5' };
      case 'no-show':
        return { text: 'No Show', color: '#F59E0B', bg: '#FEF3C7' };
      default:
        return { text: 'Scheduled', color: '#3B82F6', bg: '#EFF6FF' };
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
  const isPast = new Date(session.scheduledDate) < new Date();
  const canComplete = isPast && session.sessionStatus === 'scheduled';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          <Text style={styles.sessionId}>Session ID: {session.sessionId}</Text>
        </View>

        {/* Employee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee</Text>
          <View style={styles.employeeCard}>
            {session.userId?.photo && (
              <Image
                source={{ uri: session.userId.photo }}
                style={styles.employeeImage}
              />
            )}
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{session.userId?.name || 'Employee'}</Text>
              {session.userId?.email && (
                <Text style={styles.employeeEmail}>✉️ {session.userId?.email}</Text>
              )}
              {session.userId?.city && session.userId?.country && (
                <Text style={styles.employeeLocation}>
                  📍 {session.userId.city}, {session.userId.country}
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

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💰 Amount:</Text>
              <Text style={styles.detailValue}>₹{String(session.amount).replace(/[$₹]/g, '')}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💳 Payment:</Text>
              <Text style={styles.detailValue}>{session.paymentStatus}</Text>
            </View>
          </View>
        </View>

        {/* Employee Notes */}
        {session.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee's Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </View>
        )}

        {/* Meeting Link (Editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Link *</Text>
          <TextInput
            style={styles.input}
            placeholder="Add meeting link (Zoom, Google Meet, etc.)"
            value={meetingLink}
            onChangeText={setMeetingLink}
            editable={session.sessionStatus !== 'cancelled' && session.sessionStatus !== 'completed'}
          />
          {meetingLink && (
            <TouchableOpacity
              style={styles.testLinkButton}
              onPress={handleJoinSession}
            >
              <Text style={styles.testLinkText}>🔗 Join Meeting</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mentor Notes (Editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add your notes about the session..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            editable={session.sessionStatus !== 'cancelled'}
          />
        </View>

        {/* Evaluation/Feedback (Editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation & Feedback</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide feedback and evaluation for the employee..."
            value={evaluation}
            onChangeText={setEvaluation}
            multiline
            numberOfLines={6}
            editable={session.sessionStatus !== 'cancelled'}
          />
          <Text style={styles.helperText}>
            This will be visible to the employee after the session
          </Text>
        </View>

        {/* Session Status */}
        {session.sessionStatus === 'scheduled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Status</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  sessionStatus === 'scheduled' && styles.statusOptionActive,
                ]}
                onPress={() => setSessionStatus('scheduled')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    sessionStatus === 'scheduled' && styles.statusOptionTextActive,
                  ]}
                >
                  Scheduled
                </Text>
              </TouchableOpacity>
              
              {canComplete && (
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    sessionStatus === 'completed' && styles.statusOptionActive,
                  ]}
                  onPress={() => setSessionStatus('completed')}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      sessionStatus === 'completed' && styles.statusOptionTextActive,
                    ]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  sessionStatus === 'no-show' && styles.statusOptionActive,
                ]}
                onPress={() => setSessionStatus('no-show')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    sessionStatus === 'no-show' && styles.statusOptionTextActive,
                  ]}
                >
                  No Show
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {session.sessionStatus !== 'cancelled' && session.sessionStatus !== 'completed' && (
            <>
              <TouchableOpacity
                style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                onPress={handleUpdateSession}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              {canComplete && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleMarkCompleted}
                >
                  <Text style={styles.completeButtonText}>✓ Mark as Completed</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSession}
              >
                <Text style={styles.cancelButtonText}>Cancel Session</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    flex: 1,
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
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  employeeLocation: {
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
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  testLinkButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    alignItems: 'center',
  },
  testLinkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
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
