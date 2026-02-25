import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function InternshipDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (id) {
      fetchInternshipDetails();
    }
  }, [id]);

  const fetchInternshipDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.INTERNSHIPS.BY_ID(id));
      setInternship(response.data.internship || response.data);
    } catch (error) {
      console.error('Error fetching internship details:', error);
      Alert.alert('Error', 'Failed to load internship details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      Alert.alert('Required', 'Please write a cover letter to continue');
      return;
    }

    setApplying(true);
    try {
      await api.post(API_ENDPOINTS.INTERNSHIPS.APPLY, {
        internshipId: id,
        coverLetter: coverLetter.trim(),
      });
      
      Alert.alert(
        'Success',
        'Your application has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)/applications'),
          },
        ]
      );
    } catch (error) {
      console.error('Error applying for internship:', error);
      Alert.alert(
        'Application Failed',
        error.response?.data?.message || 'Failed to submit application. Please try again.'
      );
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading internship details...</Text>
      </View>
    );
  }

  if (!internship) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Internship not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonTop}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonTopText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{internship.title}</Text>
          <Text style={styles.company}>{internship.company || 'Company'}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>
                {internship.location || 'Location not specified'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💰</Text>
              <Text style={styles.metaText}>
                {internship.stipend ? `₹${internship.stipend}/month` : 'Unpaid'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>
                {internship.duration || 'Duration not specified'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>
                {internship.type || 'Internship'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {internship.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Internship</Text>
            <Text style={styles.sectionText}>{internship.description}</Text>
          </View>
        )}

        {/* Skills Required */}
        {internship.skills && internship.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillsContainer}>
              {internship.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Requirements */}
        {internship.requirements && internship.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {internship.requirements.map((req, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Responsibilities */}
        {internship.responsibilities && internship.responsibilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Responsibilities</Text>
            {internship.responsibilities.map((resp, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{resp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Perks/Benefits */}
        {internship.perks && internship.perks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perks & Benefits</Text>
            {internship.perks.map((perk, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.bulletText}>{perk}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Application Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Letter *</Text>
          <Text style={styles.sectionHint}>
            Tell us why you're a great fit for this internship
          </Text>
          <TextInput
            style={styles.textArea}
            value={coverLetter}
            onChangeText={setCoverLetter}
            placeholder="Write your cover letter here..."
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, applying && styles.disabledButton]}
          onPress={handleApply}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Apply Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButtonTop: {
    marginBottom: 12,
  },
  backButtonTopText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  company: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    flex: 1,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#2563eb',
    marginRight: 8,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 150,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
