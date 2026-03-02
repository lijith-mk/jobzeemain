import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function EmployerEventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.EMPLOYER_BY_ID(id));
      setEvent(response.data.event || response.data);
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/employer-edit-event?id=${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.EVENTS.DELETE(id));
              Alert.alert('Success', 'Event deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { text: 'Approved', style: styles.approvedBadge };
      case 'rejected':
        return { text: 'Rejected', style: styles.rejectedBadge };
      default:
        return { text: 'Pending', style: styles.pendingBadge };
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusBadge = getStatusBadge(event.status);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBackButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>

      {/* Banner Image */}
      {event.bannerUrl && (
        <Image
          source={{ uri: event.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
      )}

      {/* Status and Type Badges */}
      <View style={styles.badgesContainer}>
        <View style={statusBadge.style}>
          <Text style={styles.badgeText}>{statusBadge.text}</Text>
        </View>
        <View style={[styles.typeBadge, event.type === 'free' ? styles.freeBadge : styles.paidBadge]}>
          <Text style={styles.badgeText}>
            {event.type === 'free' ? 'FREE' : `₹${event.price}`}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Start:</Text>
            <Text style={styles.detailValue}>{formatDate(event.startDateTime)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 End:</Text>
            <Text style={styles.detailValue}>{formatDate(event.endDateTime)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode:</Text>
            <Text style={styles.detailValue}>
              {event.mode === 'online' ? '🌐 Online' : '📍 Offline'}
            </Text>
          </View>

          {event.mode === 'online' && event.meetingLink && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Meeting Link:</Text>
              <TouchableOpacity onPress={() => Linking.openURL(event.meetingLink)}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {event.meetingLink}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {event.mode === 'offline' && event.venueAddress && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Venue:</Text>
              <Text style={styles.detailValue}>{event.venueAddress}</Text>
            </View>
          )}

          {event.seatsLimit && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seats Limit:</Text>
              <Text style={styles.detailValue}>{event.seatsLimit}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Attendees:</Text>
            <Text style={styles.detailValue}>{event.attendeesCount || 0}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Visibility:</Text>
            <Text style={styles.detailValue}>{event.visibility}</Text>
          </View>
        </View>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.tagsContainer}>
              {event.categories.map((category, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, styles.tagSecondary]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Organizer Info */}
        {(event.organizerCompanyName || event.organizerEmail || event.organizerPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizer Information</Text>
            
            {event.organizerCompanyName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Company:</Text>
                <Text style={styles.detailValue}>{event.organizerCompanyName}</Text>
              </View>
            )}

            {event.organizerEmail && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{event.organizerEmail}</Text>
              </View>
            )}

            {event.organizerPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{event.organizerPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push(`/employer-event-registrations?id=${id}&title=${encodeURIComponent(event.title)}`)}
          >
            <Text style={styles.actionButtonText}>View Registrations ({event.attendeesCount || 0})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            disabled={event.status === 'rejected'}
          >
            <Text style={styles.actionButtonText}>Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBackButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  badgesContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  approvedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: '#3b82f6',
  },
  paidBadge: {
    backgroundColor: '#8b5cf6',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagSecondary: {
    backgroundColor: '#e0e7ff',
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#10b981',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
