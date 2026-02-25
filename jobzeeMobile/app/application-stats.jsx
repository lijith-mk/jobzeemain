import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

const { width } = Dimensions.get('window');

export default function ApplicationStats() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.APPLICATIONS.MY_APPLICATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const apps = response.data.data;
        setApplications(apps);
        calculateStats(apps);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps) => {
    const total = apps.length;
    
    // Status breakdown
    const statusCounts = {
      pending: apps.filter(a => a.status === 'pending').length,
      reviewing: apps.filter(a => a.status === 'reviewing').length,
      shortlisted: apps.filter(a => a.status === 'shortlisted').length,
      accepted: apps.filter(a => a.status === 'accepted').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
      withdrawn: apps.filter(a => a.status === 'withdrawn').length,
    };

    // Response rate (not pending anymore)
    const responded = total - statusCounts.pending;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    // Success rate (accepted / total)
    const successRate = total > 0 ? Math.round((statusCounts.accepted / total) * 100) : 0;

    // Interview rate (shortlisted + accepted / total)
    const interviewed = statusCounts.shortlisted + statusCounts.accepted;
    const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;

    // Applications by month
    const monthlyStats = getMonthlyStats(apps);

    // Average days to response
    const avgResponseTime = calculateAvgResponseTime(apps);

    // Most applied job types
    const jobTypes = getMostAppliedTypes(apps);

    setStats({
      total,
      statusCounts,
      responseRate,
      successRate,
      interviewRate,
      monthlyStats,
      avgResponseTime,
      jobTypes,
    });
  };

  const getMonthlyStats = (apps) => {
    const months = {};
    apps.forEach(app => {
      const date = new Date(app.appliedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count,
      }));
  };

  const calculateAvgResponseTime = (apps) => {
    const respondedApps = apps.filter(a => 
      ['reviewing', 'shortlisted', 'accepted', 'rejected'].includes(a.status) &&
      a.updatedAt
    );

    if (respondedApps.length === 0) return 'N/A';

    const totalDays = respondedApps.reduce((sum, app) => {
      const applied = new Date(app.appliedAt);
      const responded = new Date(app.updatedAt);
      const days = Math.floor((responded - applied) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    const avg = Math.round(totalDays / respondedApps.length);
    return `${avg} days`;
  };

  const getMostAppliedTypes = (apps) => {
    const types = {};
    apps.forEach(app => {
      const type = app.job?.employmentType || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      reviewing: '#3b82f6',
      shortlisted: '#8b5cf6',
      accepted: '#10b981',
      rejected: '#ef4444',
      withdrawn: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const renderStatCard = (title, value, subtitle, color = '#2563eb') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderStatusBar = (status, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const color = getStatusColor(status);

    return (
      <View key={status} style={styles.statusBarContainer}>
        <View style={styles.statusBarHeader}>
          <Text style={styles.statusBarLabel}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
          <Text style={styles.statusBarCount}>{count}</Text>
        </View>
        <View style={styles.statusBarTrack}>
          <View 
            style={[
              styles.statusBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Statistics</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No Applications Yet</Text>
          <Text style={styles.emptySubtext}>
            Start applying to jobs to see your application statistics and insights
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/jobs')}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Statistics</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {renderStatCard('Total Applications', stats.total, 'All time', '#2563eb')}
          {renderStatCard('Response Rate', `${stats.responseRate}%`, 'Not pending', '#3b82f6')}
          {renderStatCard('Interview Rate', `${stats.interviewRate}%`, 'Shortlisted', '#8b5cf6')}
          {renderStatCard('Success Rate', `${stats.successRate}%`, 'Accepted', '#10b981')}
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Breakdown</Text>
        <View style={styles.statusBreakdown}>
          {Object.entries(stats.statusCounts)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => renderStatusBar(status, count, stats.total))}
        </View>
      </View>

      {/* Additional Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>⏱️ Avg Response Time</Text>
            <Text style={styles.insightValue}>{stats.avgResponseTime}</Text>
          </View>
        </View>

        {stats.jobTypes.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Most Applied Job Types</Text>
            {stats.jobTypes.map((item, index) => (
              <View key={index} style={styles.insightRow}>
                <Text style={styles.insightLabel}>
                  {index + 1}. {item.type}
                </Text>
                <Text style={styles.insightValue}>{item.count} apps</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Monthly Trend */}
      {stats.monthlyStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Trend</Text>
          <View style={styles.trendCard}>
            {stats.monthlyStats.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <Text style={styles.trendMonth}>{item.month}</Text>
                <View style={styles.trendBar}>
                  <View 
                    style={[
                      styles.trendBarFill,
                      { width: `${(item.count / Math.max(...stats.monthlyStats.map(m => m.count))) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.trendCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips to Improve</Text>
        <View style={styles.tipsList}>
          {stats.responseRate < 50 && (
            <Text style={styles.tipItem}>
              • Apply to jobs that match your skills better for higher response rates
            </Text>
          )}
          {stats.total < 10 && (
            <Text style={styles.tipItem}>
              • Increase your applications to improve your chances
            </Text>
          )}
          {stats.successRate < 10 && stats.total > 5 && (
            <Text style={styles.tipItem}>
              • Consider updating your resume or profile to stand out
            </Text>
          )}
          <Text style={styles.tipItem}>
            • Follow up on pending applications after 7-10 days
          </Text>
          <Text style={styles.tipItem}>
            • Tailor your application for each position
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: '#2563eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statusBreakdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBarContainer: {
    marginBottom: 16,
  },
  statusBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusBarCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBarTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    width: 80,
  },
  trendBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  trendCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    width: 30,
    textAlign: 'right',
  },
  tipsSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
