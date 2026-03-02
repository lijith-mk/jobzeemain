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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.BY_ID(id));
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // For paid events, redirect to payment page
    if (event.type === 'paid' && event.price > 0) {
      router.push(`/event-payment?eventId=${id}&title=${encodeURIComponent(event.title)}&price=${event.price}&currency=INR`);
      return;
    }

    // For free events, register directly
    setRegistering(true);
    try {
      const response = await api.post(API_ENDPOINTS.EVENTS.REGISTER(id));
      
      if (response.data.success) {
        Alert.alert('Success!', 'You have been registered for this event');
        setIsRegistered(true);
        
        if (event.mode === 'online' && event.meetingLink) {
          Alert.alert(
            'Meeting Link',
            'Would you like to save the meeting link?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Open Link', 
                onPress: () => Linking.openURL(event.meetingLink) 
              },
            ]
          );
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register';
      Alert.alert('Registration Failed', message);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const isEventPast = new Date(event.endDateTime) < new Date();
  const isFull = event.seatsLimit && event.attendeesCount >= event.seatsLimit;

  return (
    <View style={styles.container}>
      <ScrollView>
        {event.bannerUrl && (
          <Image
            source={{ uri: event.bannerUrl }}
            style={styles.banner}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, event.type === 'free' ? styles.freeBadge : styles.paidBadge]}>
              <Text style={styles.badgeText}>
                {event.type === 'free' ? 'FREE EVENT' : `₹${event.price}`}
              </Text>
            </View>
            <View style={[styles.badge, event.mode === 'online' ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.badgeText}>
                {event.mode === 'online' ? '🌐 ONLINE' : '📍 OFFLINE'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Organizer */}
          {event.organizerCompanyName && (
            <Text style={styles.organizer}>
              Organized by: {event.organizerCompanyName}
            </Text>
          )}

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Date & Time</Text>
            <Text style={styles.sectionText}>
              {formatDate(event.startDateTime)}
            </Text>
            <Text style={styles.sectionText}>
              {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
            </Text>
          </View>

          {/* Location/Link */}
          {event.mode === 'online' && event.meetingLink && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌐 Online Meeting</Text>
              {isRegistered ? (
                <TouchableOpacity onPress={() => Linking.openURL(event.meetingLink)}>
                  <Text style={styles.linkText}>Join Meeting →</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.sectionText}>Link will be shared after registration</Text>
              )}
            </View>
          )}

          {event.mode === 'offline' && event.venueAddress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Venue</Text>
              <Text style={styles.sectionText}>{event.venueAddress}</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏷️ Categories</Text>
              <View style={styles.categoriesContainer}>
                {event.categories.map((category, index) => (
                  <View key={index} style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔖 Tags</Text>
              <View style={styles.categoriesContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Seats Info */}
          {event.seatsLimit && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💺 Seats</Text>
              <Text style={styles.seatsText}>
                {event.attendeesCount || 0} / {event.seatsLimit} seats filled
              </Text>
              {isFull && (
                <Text style={styles.fullText}>Event is full!</Text>
              )}
            </View>
          )}

          {/* Contact */}
          {(event.organizerEmail || event.organizerPhone) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📞 Contact</Text>
              {event.organizerEmail && (
                <Text style={styles.sectionText}>Email: {event.organizerEmail}</Text>
              )}
              {event.organizerPhone && (
                <Text style={styles.sectionText}>Phone: {event.organizerPhone}</Text>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Register Button */}
      {!isEventPast && !isRegistered && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.registerButton,
              (registering || isFull) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={registering || isFull}
          >
            {registering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>
                {isFull ? 'Event Full' : event.type === 'free' ? 'Register for Free' : `Register for ₹${event.price}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isRegistered && (
        <View style={styles.footer}>
          <View style={styles.registeredBanner}>
            <Text style={styles.registeredText}>✓ You are registered for this event</Text>
          </View>
        </View>
      )}

      {isEventPast && (
        <View style={styles.footer}>
          <View style={styles.pastBanner}>
            <Text style={styles.pastText}>This event has ended</Text>
          </View>
        </View>
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
  },
  banner: {
    width: '100%',
    height: 250,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  freeBadge: {
    backgroundColor: '#d1fae5',
  },
  paidBadge: {
    backgroundColor: '#fef3c7',
  },
  onlineBadge: {
    backgroundColor: '#dbeafe',
  },
  offlineBadge: {
    backgroundColor: '#fce7f3',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  organizer: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#3730a3',
    fontWeight: '500',
  },
  tagBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#6b7280',
  },
  seatsText: {
    fontSize: 16,
    color: '#374151',
  },
  fullText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  registerButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  registeredBanner: {
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registeredText: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pastBanner: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pastText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
});
