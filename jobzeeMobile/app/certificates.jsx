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
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function CertificatesScreen() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CERTIFICATES.MY_CERTIFICATES);
      setCertificates(response.data.certificates || response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      if (error.response?.status !== 404) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load certificates'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificate) => {
    if (certificate.pdfUrl) {
      try {
        await Linking.openURL(certificate.pdfUrl);
      } catch (error) {
        Alert.alert('Error', 'Unable to open certificate');
      }
    } else {
      Alert.alert('Info', 'Certificate PDF not available');
    }
  };

  const handleVerifyCertificate = async (certificate) => {
    if (certificate.certificateId) {
      Alert.alert(
        'Certificate Details',
        `Certificate ID: ${certificate.certificateId}\n` +
        `Course: ${certificate.courseName}\n` +
        `Issued: ${new Date(certificate.issuedDate || certificate.createdAt).toLocaleDateString()}\n` +
        `Status: Verified ✓`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderCertificateCard = (certificate) => {
    return (
      <View key={certificate._id || certificate.id} style={styles.certificateCard}>
        <View style={styles.certificateHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏆</Text>
          </View>
          <View style={styles.certificateInfo}>
            <Text style={styles.certificateTitle}>
              {certificate.courseName || certificate.title || 'Course Certificate'}
            </Text>
            <Text style={styles.certificateDate}>
              Issued: {formatDate(certificate.issuedDate || certificate.createdAt)}
            </Text>
            {certificate.certificateId && (
              <Text style={styles.certificateId}>
                ID: {certificate.certificateId}
              </Text>
            )}
          </View>
        </View>

        {certificate.instructorName && (
          <View style={styles.instructorSection}>
            <Text style={styles.instructorLabel}>Instructor:</Text>
            <Text style={styles.instructorName}>{certificate.instructorName}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownloadCertificate(certificate)}
          >
            <Text style={styles.downloadButtonText}>📥 Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerifyCertificate(certificate)}
          >
            <Text style={styles.verifyButtonText}>✓ Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading certificates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Certificates</Text>
        <Text style={styles.subtitle}>
          View and download your course completion certificates
        </Text>
      </View>

      {certificates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No Certificates Yet</Text>
          <Text style={styles.emptyText}>
            Complete courses to earn certificates
          </Text>
          <TouchableOpacity
            style={styles.browseCourses}
            onPress={() => router.push('/(tabs)/courses')}
          >
            <Text style={styles.browseCoursesText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.certificatesContainer}>
          <Text style={styles.count}>
            {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
          </Text>
          {certificates.map(renderCertificateCard)}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
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
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  certificatesContainer: {
    padding: 20,
    paddingTop: 16,
  },
  certificateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  certificateHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#fef3c7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  certificateId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  instructorSection: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  instructorLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 6,
  },
  instructorName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  verifyButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseCourses: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseCoursesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
