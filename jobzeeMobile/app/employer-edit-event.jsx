import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function EmployerEditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'free',
    price: '',
    seatsLimit: '',
    mode: 'online',
    meetingLink: '',
    venueAddress: '',
    startDateTime: '',
    endDateTime: '',
    bannerUrl: '',
    categories: '',
    tags: '',
    visibility: 'public',
    organizerCompanyName: '',
    organizerEmail: '',
    organizerPhone: '',
  });

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.EMPLOYER_BY_ID(id));
      const event = response.data.event || response.data;
      
      // Format dates for input
      const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'free',
        price: event.price ? String(event.price) : '',
        seatsLimit: event.seatsLimit ? String(event.seatsLimit) : '',
        mode: event.mode || 'online',
        meetingLink: event.meetingLink || '',
        venueAddress: event.venueAddress || '',
        startDateTime: formatDateTime(event.startDateTime),
        endDateTime: formatDateTime(event.endDateTime),
        bannerUrl: event.bannerUrl || '',
        categories: event.categories ? event.categories.join(', ') : '',
        tags: event.tags ? event.tags.join(', ') : '',
        visibility: event.visibility || 'public',
        organizerCompanyName: event.organizerCompanyName || '',
        organizerEmail: event.organizerEmail || '',
        organizerPhone: event.organizerPhone || '',
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to load event data');
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    // Validation
    if (!formData.title || !formData.description || !formData.startDateTime || !formData.endDateTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.type === 'paid' && (!formData.price || Number(formData.price) <= 0)) {
      Alert.alert('Error', 'Please enter a valid price for paid events');
      return;
    }

    if (formData.mode === 'online' && !formData.meetingLink) {
      Alert.alert('Error', 'Please provide a meeting link for online events');
      return;
    }

    if (formData.mode === 'offline' && !formData.venueAddress) {
      Alert.alert('Error', 'Please provide a venue address for offline events');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        price: formData.type === 'paid' ? Number(formData.price) : 0,
        seatsLimit: formData.seatsLimit ? Number(formData.seatsLimit) : null,
        categories: formData.categories ? formData.categories.split(',').map(c => c.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      await api.put(API_ENDPOINTS.EVENTS.UPDATE(id), data);
      Alert.alert('Success', 'Event updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading event data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Event</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Event Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event title"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter event description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Type *</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.option, formData.type === 'free' && styles.optionActive]}
                onPress={() => setFormData({ ...formData, type: 'free', price: '' })}
              >
                <Text style={[styles.optionText, formData.type === 'free' && styles.optionTextActive]}>
                  Free
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, formData.type === 'paid' && styles.optionActive]}
                onPress={() => setFormData({ ...formData, type: 'paid' })}
              >
                <Text style={[styles.optionText, formData.type === 'paid' && styles.optionTextActive]}>
                  Paid
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Price (if paid) */}
          {formData.type === 'paid' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Mode */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Mode *</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.option, formData.mode === 'online' && styles.optionActive]}
                onPress={() => setFormData({ ...formData, mode: 'online', venueAddress: '' })}
              >
                <Text style={[styles.optionText, formData.mode === 'online' && styles.optionTextActive]}>
                  Online
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, formData.mode === 'offline' && styles.optionActive]}
                onPress={() => setFormData({ ...formData, mode: 'offline', meetingLink: '' })}
              >
                <Text style={[styles.optionText, formData.mode === 'offline' && styles.optionTextActive]}>
                  Offline
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Meeting Link (if online) */}
          {formData.mode === 'online' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Meeting Link *</Text>
              <TextInput
                style={styles.input}
                placeholder="https://zoom.us/j/..."
                value={formData.meetingLink}
                onChangeText={(text) => setFormData({ ...formData, meetingLink: text })}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Venue Address (if offline) */}
          {formData.mode === 'offline' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Venue Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter venue address"
                value={formData.venueAddress}
                onChangeText={(text) => setFormData({ ...formData, venueAddress: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Start Date & Time */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Date & Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM (e.g., 2026-03-15 10:00)"
              value={formData.startDateTime}
              onChangeText={(text) => setFormData({ ...formData, startDateTime: text })}
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD HH:MM</Text>
          </View>

          {/* End Date & Time */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>End Date & Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM (e.g., 2026-03-15 18:00)"
              value={formData.endDateTime}
              onChangeText={(text) => setFormData({ ...formData, endDateTime: text })}
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD HH:MM</Text>
          </View>

          {/* Seats Limit */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Seats Limit (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter maximum seats (leave empty for unlimited)"
              value={formData.seatsLimit}
              onChangeText={(text) => setFormData({ ...formData, seatsLimit: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Banner URL */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Banner URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/banner.jpg"
              value={formData.bannerUrl}
              onChangeText={(text) => setFormData({ ...formData, bannerUrl: text })}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Categories */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Categories (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma separated (e.g., Technology, Career)"
              value={formData.categories}
              onChangeText={(text) => setFormData({ ...formData, categories: text })}
            />
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma separated (e.g., hiring, networking)"
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
            />
          </View>

          {/* Organizer Contact (optional) */}
          <Text style={styles.sectionTitle}>Organizer Contact (Optional)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty to use your company name"
              value={formData.organizerCompanyName}
              onChangeText={(text) => setFormData({ ...formData, organizerCompanyName: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty to use your company email"
              value={formData.organizerEmail}
              onChangeText={(text) => setFormData({ ...formData, organizerEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty to use your company phone"
              value={formData.organizerPhone}
              onChangeText={(text) => setFormData({ ...formData, organizerPhone: text })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Event</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Note: Changes will be sent for admin approval before becoming visible.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
