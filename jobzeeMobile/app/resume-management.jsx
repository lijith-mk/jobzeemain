import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function ResumeManagementScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasResume = user?.resume || user?.resumeUrl;

  const pickDocument = async () => {
    try {
      // Note: expo-document-picker needs to be installed
      // Run: npx expo install expo-document-picker
      
      const DocumentPicker = require('expo-document-picker');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel' || result.canceled) {
        return;
      }

      // Get the file from result
      const file = result.assets ? result.assets[0] : result;
      
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Resume must be less than 5MB');
        return;
      }

      await uploadResume(file);
    } catch (error) {
      console.error('Error picking document:', error);
      if (error.message?.includes('Cannot find module')) {
        Alert.alert(
          'Setup Required',
          'Please install expo-document-picker:\nnpx expo install expo-document-picker',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const uploadResume = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name || 'resume.pdf',
      });

      const response = await api.post(API_ENDPOINTS.UPLOAD.USER_RESUME, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user context with new resume URL
      const updatedUser = { ...user, resume: response.data.resumeUrl || response.data.url };
      await updateUser(updatedUser);

      Alert.alert('Success', 'Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.message || 'Failed to upload resume. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleViewResume = async () => {
    if (hasResume) {
      const resumeUrl = user.resume || user.resumeUrl;
      try {
        await Linking.openURL(resumeUrl);
      } catch (error) {
        Alert.alert('Error', 'Unable to open resume');
      }
    }
  };

  const handleDeleteResume = () => {
    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete your resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete('/upload/user/resume');
              const updatedUser = { ...user, resume: null, resumeUrl: null };
              await updateUser(updatedUser);
              Alert.alert('Success', 'Resume deleted successfully');
            } catch (error) {
              console.error('Error deleting resume:', error);
              Alert.alert('Error', 'Failed to delete resume');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Resume Management</Text>
        <Text style={styles.subtitle}>
          Keep your resume up to date for job applications
        </Text>
      </View>

      {/* Resume Status Card */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📄</Text>
        </View>
        
        {hasResume ? (
          <>
            <View style={styles.resumeInfo}>
              <Text style={styles.statusTitle}>Resume Uploaded</Text>
              <Text style={styles.statusText}>
                Your resume is ready for applications
              </Text>
            </View>

            {/* Actions for uploaded resume */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewResume}
              >
                <Text style={styles.viewButtonText}>👁️ View Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.replaceButton}
                onPress={pickDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <Text style={styles.replaceButtonText}>🔄 Replace</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteResume}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.resumeInfo}>
              <Text style={styles.statusTitle}>No Resume Uploaded</Text>
              <Text style={styles.statusText}>
                Upload your resume to apply for jobs faster
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={pickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.uploadButtonText}>📤 Upload Resume</Text>
                  <Text style={styles.uploadButtonSubtext}>PDF, max 5MB</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Resume Tips</Text>
        
        <View style={styles.tip}>
          <Text style={styles.tipNumber}>1.</Text>
          <Text style={styles.tipText}>
            Keep your resume updated with your latest experience and skills
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipNumber}>2.</Text>
          <Text style={styles.tipText}>
            Use a professional format and clear section headings
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipNumber}>3.</Text>
          <Text style={styles.tipText}>
            Highlight achievements with measurable results
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipNumber}>4.</Text>
          <Text style={styles.tipText}>
            Tailor your resume for each job application
          </Text>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipNumber}>5.</Text>
          <Text style={styles.tipText}>
            Keep it concise - ideally 1-2 pages
          </Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Your resume will be automatically attached when you apply for jobs through the app.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
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
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dbeafe',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  resumeInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  replaceButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  replaceButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadButtonSubtext: {
    color: '#e0e7ff',
    fontSize: 13,
  },
  tipsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 8,
    width: 20,
  },
  tipText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    flex: 1,
  },
});
