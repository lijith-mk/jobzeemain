import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, employer, userType } = useAuth();

  const profileData = userType === 'user' ? user : employer;

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.userName}>
          {profileData?.name || profileData?.companyName || 'User'}!
        </Text>
        <Text style={styles.subtitle}>
          {userType === 'user' 
            ? 'Ready to find your dream job?' 
            : 'Manage your job postings'}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {userType === 'user' ? (
          <>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Saved Jobs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {userType === 'user' ? (
          <>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Text style={styles.actionIcon}>💼</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Browse Jobs</Text>
                <Text style={styles.actionDescription}>
                  Find your next opportunity
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/courses')}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Explore Courses</Text>
                <Text style={styles.actionDescription}>
                  Upskill and learn new things
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>🎓</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>My Certificates</Text>
                <Text style={styles.actionDescription}>
                  View your achievements
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/post-job')}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Post a Job</Text>
                <Text style={styles.actionDescription}>
                  Create a new job posting
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/my-jobs')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>My Job Postings</Text>
                <Text style={styles.actionDescription}>
                  Manage your jobs
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📱 JobZee Mobile</Text>
        <Text style={styles.infoText}>
          Your complete job search and recruitment platform in your pocket.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: '#2563eb',
    padding: 24,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 18,
    color: '#dbeafe',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
