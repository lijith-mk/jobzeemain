import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, GRADIENTS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, employer, userType } = useAuth();

  const profileData = userType === 'user' ? user : employer;

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section with Gradient */}
      <LinearGradient
        colors={userType === 'user' ? GRADIENTS.primary : GRADIENTS.twilight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeSection}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.userName}>
            {profileData?.name || profileData?.companyName || 'User'}
          </Text>
          <Text style={styles.subtitle}>
            {userType === 'user'
              ? 'Your dream career starts here. Find opportunities effortlessly.'
              : 'Manage your job postings and find the best talent.'}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Section with Modern Cards */}
      <View style={styles.statsContainer}>
        {userType === 'user' ? (
          <>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>📝</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F3E8FF', '#E9D5FF']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>💼</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Saved Jobs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>📚</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </LinearGradient>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>📋</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </LinearGradient>
            </View>
          </>
        )}
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
        
        {userType === 'user' ? (
          <>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/jobs')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>💼</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Browse Jobs</Text>
                  <Text style={styles.actionDescription}>
                    Find your next opportunity
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/courses')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>📚</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Explore Courses</Text>
                  <Text style={styles.actionDescription}>
                    Upskill and learn new things
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/internships')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🎓</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Browse Internships</Text>
                  <Text style={styles.actionDescription}>
                    Apply for internship opportunities
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/certificates')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🏆</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>My Certificates</Text>
                  <Text style={styles.actionDescription}>
                    View your achievements
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/post-job')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>➕</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Post a Job</Text>
                  <Text style={styles.actionDescription}>
                    Create a new job posting
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/my-jobs')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>📋</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>My Job Postings</Text>
                  <Text style={styles.actionDescription}>
                    Manage your jobs
                  </Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Info Section with Modern Design */}
      <View style={styles.infoSection}>
        <LinearGradient
          colors={['#EFF6FF', '#FFFFFF']}
          style={styles.infoGradient}
        >
          <Text style={styles.infoTitle}>✨ JobZee Mobile</Text>
          <Text style={styles.infoText}>
            Your complete job search and recruitment platform in your pocket.
          </Text>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>🚀 Always Improving</Text>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomeSection: {
    paddingTop: SPACING.xxl + 10,
    paddingBottom: SPACING.xxl + 20,
    paddingHorizontal: SPACING.lg,
  },
  welcomeContent: {
    marginTop: SPACING.md,
  },
  greeting: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl - 10,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  statGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.large,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actionsSection: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  actionCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  actionDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  actionArrow: {
    fontSize: 24,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  infoSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  infoGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.large,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  infoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  infoBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
});
