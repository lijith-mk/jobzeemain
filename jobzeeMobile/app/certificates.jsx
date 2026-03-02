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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { API_ENDPOINTS, API_CONFIG } from '../constants/config';

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
    try {
      console.log('Initiating certificate download for:', certificate.certificateId);
      console.log('Certificate URL:', certificate.certificateUrl);
      
      // Show loading alert
      Alert.alert('Downloading', 'Please wait while we download your certificate...');
      
      // Get the auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      // Determine download URL
      let downloadUrl;
      if (certificate.certificateUrl) {
        // If it's a relative path, prepend the base URL
        downloadUrl = certificate.certificateUrl.startsWith('http') 
          ? certificate.certificateUrl 
          : `${API_CONFIG.BASE_URL}${certificate.certificateUrl}`;
      } else {
        // Use the download endpoint
        downloadUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CERTIFICATES.DOWNLOAD(certificate.certificateId)}`;
      }
      
      console.log('Downloading from:', downloadUrl);
      
      // Create a local file path
      const fileName = `certificate_${certificate.certificateId}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Download the file with authentication headers
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('Download completed:', downloadResult.status);
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Share/open the file
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Certificate',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert(
            'Success',
            'Certificate downloaded successfully!',
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error('Certificate download error:', error);
      Alert.alert(
        'Download Failed',
        'Unable to download the certificate. Please check your internet connection and try again.',
        [
          { text: 'OK' },
          { 
            text: 'Retry', 
            onPress: () => handleDownloadCertificate(certificate) 
          }
        ]
      );
    }
  };

  const handleVerifyCertificate = async (certificate) => {
    let message = `Certificate ID: ${certificate.certificateId}\n`;
    message += `Course: ${certificate.courseName}\n`;
    message += `Issued: ${new Date(certificate.issuedDate || certificate.createdAt).toLocaleDateString()}\n`;
    
    if (certificate.blockchainTxHash) {
      message += `\n🔗 Blockchain Verified\n`;
      message += `Network: ${certificate.blockchainNetwork || 'Polygon'}\n`;
      message += `Tx Hash: ${certificate.blockchainTxHash.substring(0, 10)}...${certificate.blockchainTxHash.substring(certificate.blockchainTxHash.length - 8)}\n`;
      message += `\nThis certificate is permanently recorded on the blockchain and can be independently verified.`;
    } else {
      message += `\n✓ Certificate Verified\n`;
      message += `Hash: ${certificate.certificateHash?.substring(0, 16) || 'N/A'}...`;
    }
    
    Alert.alert(
      'Certificate Details',
      message,
      [{ text: 'OK' }]
    );
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
      <View style={styles.certificateCard}>
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
            {certificate.blockchainTxHash && (
              <View style={styles.blockchainBadge}>
                <Text style={styles.blockchainText}>🔗 Blockchain Verified</Text>
              </View>
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
          {certificates.map((cert, index) => (
            <View key={cert._id || cert.certificateId || index}>
              {renderCertificateCard(cert)}
            </View>
          ))}
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
  blockchainBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  blockchainText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
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
