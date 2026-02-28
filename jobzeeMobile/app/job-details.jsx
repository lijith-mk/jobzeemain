import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';
import { useAuth } from '../context/AuthContext';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userType } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    if (userType === 'user') {
      checkIfSaved();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.JOBS.BY_ID(id));
      setJob(response.data.job || response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SAVED_JOBS.LIST);
      const savedJobs = response.data.savedJobs || response.data || [];
      const isJobSaved = savedJobs.some(item => 
        (item.job?._id || item._id) === id
      );
      setIsSaved(isJobSaved);
    } catch (error) {
      // Silently fail - just assume not saved
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    setSavingJob(true);
    try {
      if (isSaved) {
        await api.delete(API_ENDPOINTS.SAVED_JOBS.UNSAVE(id));
        setIsSaved(false);
        Alert.alert('Success', 'Job removed from saved list');
      } else {
        await api.post(API_ENDPOINTS.SAVED_JOBS.SAVE(id));
        setIsSaved(true);
        Alert.alert('Success', 'Job saved successfully');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      Alert.alert('Required', 'Please write a cover letter');
      return;
    }

    setApplying(true);
    try {
      await api.post(API_ENDPOINTS.JOBS.APPLY, {
        jobId: id,
        coverLetter: coverLetter.trim(),
      });
      
      Alert.alert(
        'Success!',
        'Your application has been submitted successfully',
        [
          {
            text: 'View Applications',
            onPress: () => router.push('/(tabs)/applications'),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );
      setShowApplicationForm(false);
      setCoverLetter('');
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert(
        'Application Failed',
        error.response?.data?.message || 'Failed to submit application. Please try again.'
      );
    } finally {
      setApplying(false);
    }
  };

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'remote':
        return '#10b981';
      case 'hybrid':
        return '#f59e0b';
      case 'on-site':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Job not found</Text>
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          {job.employer && (
            <Text style={styles.company}>{job.employer.companyName}</Text>
          )}
          
          <View style={styles.badges}>
            <View
              style={[
                styles.locationBadge,
                { backgroundColor: getLocationTypeColor(job.locationType) },
              ]}
            >
              <Text style={styles.badgeText}>
                {job.locationType?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.badgeText}>
                {job.employmentType?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.sectionText}>{job.location}</Text>
        </View>

        {job.salary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Salary</Text>
            <Text style={styles.sectionText}>
              ₹{job.salary.min?.toLocaleString()} - ₹{job.salary.max?.toLocaleString()} / {job.salary.period}
            </Text>
          </View>
        )}

        {job.experienceLevel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Experience Level</Text>
            <Text style={styles.sectionText}>
              {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <Text style={styles.sectionText}>{job.description}</Text>
        </View>

        {job.requirements && job.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Requirements</Text>
            {job.requirements.map((req, index) => (
              <Text key={index} style={styles.bulletPoint}>
                • {req}
              </Text>
            ))}
          </View>
        )}

        {job.responsibilities && job.responsibilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Responsibilities</Text>
            {job.responsibilities.map((resp, index) => (
              <Text key={index} style={styles.bulletPoint}>
                • {resp}
              </Text>
            ))}
          </View>
        )}

        {job.skills && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ Required Skills</Text>
            <View style={styles.skillsContainer}>
              {job.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Benefits</Text>
            {job.benefits.map((benefit, index) => (
              <Text key={index} style={styles.bulletPoint}>
                • {benefit}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Posted</Text>
          <Text style={styles.sectionText}>
            {new Date(job.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Application Form */}
        {showApplicationForm && userType === 'user' && (
          <View style={styles.applicationForm}>
            <Text style={styles.formTitle}>📝 Cover Letter</Text>
            <Text style={styles.formHint}>
              Tell the employer why you're a great fit for this position
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={8}
              placeholder="Write your cover letter here..."
              value={coverLetter}
              onChangeText={setCoverLetter}
              textAlignVertical="top"
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply and Save Buttons */}
      {userType === 'user' && !showApplicationForm && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, savingJob && styles.disabledButton]}
            onPress={handleToggleSave}
            disabled={savingJob}
          >
            {savingJob ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isSaved ? '❤️ Saved' : '🤍 Save'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowApplicationForm(true)}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Application */}
      {showApplicationForm && userType === 'user' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowApplicationForm(false);
              setCoverLetter('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, applying && styles.disabledButton]}
            onPress={handleApply}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    color: '#2563eb',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  locationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6b7280',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginLeft: 8,
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
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  applicationForm: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 150,
    backgroundColor: '#f9fafb',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  saveButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
