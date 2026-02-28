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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';
import { COLORS, GRADIENTS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';

export default function MyJobsScreen() {
  const { employer } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.JOBS.BY_EMPLOYER);
      setJobs(response.data.jobs || response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  const handleDelete = (jobId) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.JOBS.DELETE(jobId));
              Alert.alert('Success', 'Job deleted successfully');
              fetchMyJobs();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return ['#10B981', '#059669'];
      case 'closed':
        return ['#EF4444', '#DC2626'];
      case 'draft':
        return ['#F59E0B', '#D97706'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'active':
        return GRADIENTS.success;
      case 'closed':
        return ['#FEE2E2', '#FECACA'];
      case 'draft':
        return ['#FEF3C7', '#FDE68A'];
      default:
        return ['#F3F4F6', '#E5E7EB'];
    }
  };

  const getTotalApplications = () => {
    return jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
  };

  const getActiveJobsCount = () => {
    return jobs.filter(job => job.status === 'active').length;
  };

  const renderJobCard = ({ item }) => (
    <TouchableOpacity style={styles.jobCard} activeOpacity={0.9}>
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.jobCardGradient}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.companyName}>{employer?.companyName}</Text>
          </View>
          <View style={styles.statusBadgeContainer}>
            <LinearGradient
              colors={getStatusColor(item.status)}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>
                {item.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💼</Text>
            <Text style={styles.metaText}>{item.employmentType}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🏢</Text>
            <Text style={styles.metaText}>{item.locationType?.toUpperCase()}</Text>
          </View>
        </View>

        {item.salary && (
          <View style={styles.salaryContainer}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.salaryBadge}
            >
              <Text style={styles.salaryIcon}>💰</Text>
              <Text style={styles.salary}>
                ₹{item.salary.min?.toLocaleString()} - ₹{item.salary.max?.toLocaleString()}
              </Text>
            </LinearGradient>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>{item.applications?.length || 0}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </LinearGradient>
          </View>
          <View style={styles.stat}>
            <LinearGradient
              colors={['#F3E8FF', '#E9D5FF']}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>{item.views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </LinearGradient>
          </View>
          <View style={styles.stat}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>
                {Math.floor((Date.now() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24))}d
              </Text>
              <Text style={styles.statLabel}>Posted</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>🗑️ Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section with Stats */}
      <LinearGradient
        colors={GRADIENTS.twilight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSection}
      >
        <Text style={styles.headerTitle}>My Job Postings 📋</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatNumber}>{jobs.length}</Text>
            <Text style={styles.headerStatLabel}>Total Jobs</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatNumber}>{getActiveJobsCount()}</Text>
            <Text style={styles.headerStatLabel}>Active</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatNumber}>{getTotalApplications()}</Text>
            <Text style={styles.headerStatLabel}>Applications</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#EFF6FF', '#FFFFFF']}
              style={styles.emptyGradient}
            >
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No job postings yet</Text>
              <Text style={styles.emptySubtext}>
                Post your first job to start receiving applications from talented candidates
              </Text>
              <TouchableOpacity style={styles.emptyButton} activeOpacity={0.8}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>➕ Post a Job</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerSection: {
    paddingTop: SPACING.xxl + 10,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    marginBottom: SPACING.md,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  headerStatLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.xs,
  },
  headerStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  jobCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  jobCardGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  jobTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  companyName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  statusBadgeContainer: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.medium,
  },
  statusText: {
    color: COLORS.textInverse,
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  salaryContainer: {
    marginBottom: SPACING.md,
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.medium,
    alignSelf: 'flex-start',
  },
  salaryIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  salary: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  stat: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  statGradient: {
    padding: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  jobFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  actionButtonGradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: SPACING.md,
    marginTop: SPACING.xxl,
  },
  emptyGradient: {
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.large,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  emptyButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  emptyButtonText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
});
