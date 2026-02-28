import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function BookSessionScreen() {
  const {
    mentorId,
    mentorName,
    sessionTypeId,
    sessionTitle,
    sessionDuration,
    sessionPrice,
  } = useLocalSearchParams();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchMentorAvailability();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDate]);

  const fetchMentorAvailability = async () => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.MENTOR.AVAILABILITY}?mentorId=${mentorId}`
      );
      const data = response.data;
      if (data.success && data.availability) {
        setAvailableDays(data.availability);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.SESSIONS.AVAILABILITY}?mentorId=${mentorId}&date=${selectedDate}`
      );
      const data = response.data;
      if (data.success) {
        setBookedSlots(data.bookedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getAvailableSlotsForDate = (dateString) => {
    const dayOfWeek = getDayOfWeek(dateString);
    const dayAvailability = availableDays.find(avail => avail.day === dayOfWeek);
    
    if (!dayAvailability || !dayAvailability.slots) {
      return [];
    }

    // Filter out booked slots
    return dayAvailability.slots.filter(slot => !bookedSlots.includes(slot));
  };

  useEffect(() => {
    if (selectedDate) {
      const slots = getAvailableSlotsForDate(selectedDate);
      setAvailableSlots(slots);
      // Reset selected time if it's no longer available
      if (selectedTime && !slots.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, bookedSlots, availableDays]);

  const handleBookSession = async () => {
    if (!selectedDate) {
      Alert.alert('Missing Information', 'Please select a date');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Missing Information', 'Please select a time slot');
      return;
    }

    // Validate that date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      Alert.alert('Invalid Date', 'Cannot book sessions in the past');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(API_ENDPOINTS.SESSIONS.BOOK, {
        mentorId,
        sessionTypeId,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        notes,
      });

      const data = response.data;

      if (data.success) {
        Alert.alert(
          'Session Booked Successfully!',
          data.message || 'Your session has been booked. Please complete payment to confirm.',
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/my-bookings'),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Booking Failed', data.message || 'Failed to book session');
      }
    } catch (error) {
      console.error('Error booking session:', error);
      Alert.alert('Error', 'Failed to book session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Allow booking up to 3 months ahead
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Book a Session</Text>
          <Text style={styles.subtitle}>with {mentorName}</Text>
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <View style={styles.detailsCard}>
            <Text style={styles.sessionTitle}>{sessionTitle}</Text>
            <Text style={styles.sessionInfo}>⏱ Duration: {sessionDuration} minutes</Text>
            <Text style={styles.sessionInfo}>💰 Price: ₹{String(sessionPrice).replace(/[$₹]/g, '')}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date *</Text>
          <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2024-12-25)</Text>
          <TextInput
            style={styles.input}
            placeholder={getMinDate()}
            value={selectedDate}
            onChangeText={setSelectedDate}
          />
          <Text style={styles.helperText}>
            Booking available from {getMinDate()} to {getMaxDate()}
          </Text>
          
          {selectedDate && (
            <Text style={styles.selectedDateInfo}>
              Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          )}
        </View>

        {/* Time Slot Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time Slot *</Text>
            {availableSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <Text style={styles.noSlotsText}>
                  No available slots for this date. Please select another date.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsContainer}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotButton,
                      selectedTime === slot && styles.slotButtonSelected,
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text
                      style={[
                        styles.slotButtonText,
                        selectedTime === slot && styles.slotButtonTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {bookedSlots.length > 0 && (
              <Text style={styles.bookedSlotsInfo}>
                Already booked: {bookedSlots.join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any specific topics or questions you'd like to discuss..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Book Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBookSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.noteText}>
            * After booking, you'll need to complete payment to confirm your session.
          </Text>
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
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
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
  selectedDateInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  slotButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  slotButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  slotButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noSlotsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  bookedSlotsInfo: {
    marginTop: 12,
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
