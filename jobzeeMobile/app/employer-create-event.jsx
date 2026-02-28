import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function EmployerCreateEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleCreate = async () => {
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

      await api.post(API_ENDPOINTS.EVENTS.CREATE, data);
      Alert.alert('Success', 'Event created successfully and sent for approval', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>Create Event</Text>
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

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Note: Your event will be sent for admin approval before it becomes visible to users.
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
  createButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
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
