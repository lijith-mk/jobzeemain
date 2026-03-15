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
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function MentorDetailsScreen() {
  const { mentorId } = useLocalSearchParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);

  useEffect(() => {
    fetchMentorDetails();
    fetchSessionTypes();
  }, [mentorId]);

  const fetchMentorDetails = async () => {
    try {
      const endpoint = typeof API_ENDPOINTS.MENTOR.BY_ID === 'function' 
        ? API_ENDPOINTS.MENTOR.BY_ID(mentorId)
        : `/mentors/${mentorId}`;
      
      const response = await api.get(endpoint);
      const data = response.data;
      
      // Handle direct object response from public endpoint
      if (data._id || data.name) {
        setMentor(data);
        if (data.availability) {
          setAvailability(data.availability || []);
        }
      } else if (data.success) {
        setMentor(data.mentor || data.data);
        if (data.mentor?.availability || data.data?.availability) {
          setAvailability(data.mentor?.availability || data.data?.availability || []);
        }
      } else if (data.message) {
        Alert.alert('Error', data.message);
        router.back();
      }
    } catch (error) {
      console.error('Error fetching mentor details:', error);
      Alert.alert('Error', 'Failed to load mentor details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionTypes = async () => {
    try {
      const response = await api.get(`/api/mentor-sessions/public/${mentorId}`);
      const data = response.data;
      
      if (data.success) {
        setSessionTypes(data.data || []);
      } else if (Array.isArray(data)) {
        setSessionTypes(data);
      }
    } catch (error) {
      console.error('Error fetching session types:', error);
      // Silently fail - session types are optional
    }
  };

  const handleBookSession = (sessionType) => {
    // Navigate to booking screen with session details
    router.push({
      pathname: '/book-session',
      params: {
        mentorId: mentor._id,
        mentorName: mentor.name,
        sessionTypeId: sessionType._id,
        sessionTitle: sessionType.title,
        sessionDuration: sessionType.duration,
        sessionPrice: sessionType.price,
        sessionDescription: sessionType.description || '',
      }
    });
  };

  const handleLinkedIn = () => {
    if (mentor?.linkedinUrl) {
      Linking.openURL(mentor.linkedinUrl);
    } else if (mentor?.linkedIn) {
      Linking.openURL(mentor.linkedIn);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading mentor details...</Text>
      </View>
    );
  }

  if (!mentor) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Mentor not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={{ uri: mentor.photo || 'https://via.placeholder.com/120' }}
          style={styles.profilePhoto}
        />
        <Text style={styles.name}>{mentor.name}</Text>
        {mentor.specialization && (
          <Text style={styles.specialization}>{mentor.specialization}</Text>
        )}
        {mentor.company && (
          <Text style={styles.company}>🏢 {mentor.company}</Text>
        )}
        {(mentor.city && mentor.country) && (
          <Text style={styles.location}>📍 {mentor.city}, {mentor.country}</Text>
        )}
        {mentor.yearsOfExperience && (
          <Text style={styles.experience}>📅 {mentor.yearsOfExperience} years of experience</Text>
        )}
        
        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          {(mentor.linkedinUrl || mentor.linkedIn) && (
            <TouchableOpacity style={styles.contactButton} onPress={handleLinkedIn}>
              <Text style={styles.contactButtonText}>🔗 LinkedIn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About Section */}
      {(mentor.bio || mentor.motivation) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{mentor.motivation || mentor.bio}</Text>
        </View>
      )}

      {/* Skills/Expertise Section */}
      {((mentor.skills && mentor.skills.length > 0) || (mentor.expertise && mentor.expertise.length > 0)) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.expertiseContainer}>
            {(mentor.skills || mentor.expertise || []).map((exp, index) => (
              <View key={index} style={styles.expertiseTag}>
                <Text style={styles.expertiseText}>{exp}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Session Types & Pricing */}
      {sessionTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Available Sessions & Pricing</Text>
          {sessionTypes.map((sessionType, index) => (
            <View key={index} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionTitle}>{sessionType.title}</Text>
                {sessionType.price === 0 ? (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                ) : (
                  <Text style={styles.sessionPrice}>₹{String(sessionType.price).replace(/[$₹]/g, '')}</Text>
                )}
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDuration}>⏱ {sessionType.duration} minutes</Text>
              </View>
              
              {sessionType.description && (
                <Text style={styles.sessionDescription}>{sessionType.description}</Text>
              )}
              
              <TouchableOpacity
                style={styles.bookSessionButton}
                onPress={() => handleBookSession(sessionType)}
              >
                <Text style={styles.bookSessionButtonText}>Book This Session</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Availability Schedule */}
      {availability.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Weekly Availability</Text>
          <Text style={styles.helperText}>Showing available time slots per week</Text>
          {availability.map((avail, index) => (
            <View key={index} style={styles.availabilityItem}>
              <Text style={styles.dayText}>{avail.day}</Text>
              <View style={styles.slotsContainer}>
                {avail.slots && avail.slots.length > 0 ? (
                  avail.slots.map((slot, slotIndex) => (
                    <View key={slotIndex} style={styles.slotTag}>
                      <Text style={styles.slotText}>{slot}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noSlotsText}>No slots available</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state if no sessions */}
      {sessionTypes.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.noSessionsText}>
            No sessions available for booking at the moment.
          </Text>
          <TouchableOpacity
            style={styles.backToMentorsButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToMentorsText}>← Browse Other Mentors</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  experience: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  contactButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  contactButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  expertiseText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
  },
  availabilityItem: {
    marginBottom: 16,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  slotText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  noSlotsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  sessionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    
  freeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  freeBadgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: 'bold',
  },fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  sessionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  sessionDetails: {
    marginBottom: 8,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionDescription: {
    marginBottom: 16,
  },
  backToMentorsButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  backToMentorsText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  bookSessionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  bookSessionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noSessionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
