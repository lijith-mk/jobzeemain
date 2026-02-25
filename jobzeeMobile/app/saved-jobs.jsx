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

export default function SavedJobsScreen() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SAVED_JOBS.LIST);
      setSavedJobs(response.data.savedJobs || response.data || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load saved jobs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    Alert.alert(
      'Remove Job',
      'Remove this job from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.SAVED_JOBS.UNSAVE(jobId));
              setSavedJobs(savedJobs.filter(item => item.job?._id !== jobId));
              Alert.alert('Success', 'Job removed from saved list');
            } catch (error) {
              console.error('Error unsaving job:', error);
              Alert.alert('Error', 'Failed to remove job');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSavedJobs();
  };

  const renderJobCard = ({ item }) => {
    const job = item.job || item;
    
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => router.push(`/job-details?id=${job._id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.icon}>📍</Text>
              <Text style={styles.detailText}>{job.location || 'Remote'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.icon}>💰</Text>
              <Text style={styles.detailText}>
                {job.salary ? `₹${job.salary.toLocaleString()}` : 'Not disclosed'}
              </Text>
            </View>
          </View>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.icon}>💼</Text>
              <Text style={styles.detailText}>{job.type || 'Full-time'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.icon}>📊</Text>
              <Text style={styles.detailText}>
                {job.experienceLevel || 'Any level'}
              </Text>
            </View>
          </View>

          {job.skills && job.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {job.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {job.skills.length > 3 && (
                <Text style={styles.moreSkills}>+{job.skills.length - 3} more</Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.unsaveButton}
          onPress={() => handleUnsaveJob(job._id)}
        >
          <Text style={styles.unsaveButtonText}>❌ Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading saved jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Jobs</Text>
        <Text style={styles.headerSubtitle}>
          {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
        </Text>
      </View>

      {/* Jobs List */}
      <FlatList
        data={savedJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id || item.job?._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>No Saved Jobs</Text>
            <Text style={styles.emptyText}>
              Save jobs you're interested in to view them here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Text style={styles.browseButtonText}>Browse Jobs</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
  cardContent: {
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 12,
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
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#9ca3af',
    alignSelf: 'center',
    marginLeft: 4,
  },
  unsaveButton: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  unsaveButtonText: {
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
