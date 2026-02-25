import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function InternshipApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInternshipApplications();
  }, []);

  const fetchInternshipApplications = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INTERNSHIP_APPLICATIONS.MY_APPLICATIONS);
      setApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.error('Error fetching internship applications:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load applications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdrawApplication = (applicationId) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.INTERNSHIP_APPLICATIONS.WITHDRAW(applicationId));
              Alert.alert('Success', 'Application withdrawn successfully');
              fetchInternshipApplications();
            } catch (error) {
              console.error('Error withdrawing application:', error);
              Alert.alert('Error', 'Failed to withdraw application');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInternshipApplications();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'reviewing':
        return '#3b82f6';
      case 'shortlisted':
        return '#8b5cf6';
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'reviewing':
        return '👀';
      case 'shortlisted':
        return '⭐';
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderApplicationCard = ({ item }) => {
    const internship = item.internship || {};
    const canWithdraw = item.status === 'pending' || item.status === 'reviewing';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{internship.title || 'Internship'}</Text>
            <Text style={styles.company}>{internship.company || 'Company'}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusIcon(item.status)} {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.detailText}>
              {internship.location || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.icon}>💰</Text>
            <Text style={styles.detailText}>
              {internship.stipend ? `₹${internship.stipend}/month` : 'Unpaid'}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.icon}>⏱️</Text>
            <Text style={styles.detailText}>
              {internship.duration || 'Duration not specified'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.icon}>📅</Text>
            <Text style={styles.detailText}>
              Applied: {formatDate(item.createdAt || item.appliedAt)}
            </Text>
          </View>
        </View>

        {item.coverLetter && (
          <View style={styles.coverLetterSection}>
            <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
            <Text style={styles.coverLetterText} numberOfLines={3}>
              {item.coverLetter}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/internship-details?id=${internship._id}`)}
          >
            <Text style={styles.viewButtonText}>View Internship</Text>
          </TouchableOpacity>
          {canWithdraw && (
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={() => handleWithdrawApplication(item._id)}
            >
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => router.push('/(tabs)/applications')}
          >
            <Text style={styles.tabText}>Jobs</Text>
          </TouchableOpacity>
          <View style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Internships</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {applications.length} {applications.length === 1 ? 'application' : 'applications'}
        </Text>
      </View>

      {/* Applications List */}
      <FlatList
        data={applications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Applications Yet</Text>
            <Text style={styles.emptyText}>
              Apply for internships to track your applications here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/internships')}
            >
              <Text style={styles.browseButtonText}>Browse Internships</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  company: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    flex: 1,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  coverLetterSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  coverLetterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  withdrawButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  browseButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
