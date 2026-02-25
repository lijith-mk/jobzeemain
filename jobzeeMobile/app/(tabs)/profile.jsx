import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, employer, userType, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const profileData = userType === 'user' ? user : employer;

  const calculateProfileCompletion = () => {
    if (userType !== 'user') return 100;
    
    const checks = [
      user?.name && user?.email && user?.phone,
      user?.resume,
      user?.skills && user.skills.length >= 3,
      user?.experience !== undefined,
      user?.education?.level,
      user?.bio && user.bio.length >= 50,
      user?.location,
      user?.preferredLocations?.length > 0,
    ];
    
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profileData?.name?.charAt(0).toUpperCase() || 
             profileData?.companyName?.charAt(0).toUpperCase() || 
             'U'}
          </Text>
        </View>
        <Text style={styles.name}>
          {profileData?.name || profileData?.companyName || 'User'}
        </Text>
        <Text style={styles.email}>{profileData?.email}</Text>
        {profileData?.phone && (
          <Text style={styles.phone}>{profileData.phone}</Text>
        )}
        
        {userType === 'user' && completionPercentage < 100 && (
          <TouchableOpacity 
            style={styles.completionBanner}
            onPress={() => router.push('/profile-completion')}
          >
            <View style={styles.completionContent}>
              <Text style={styles.completionText}>
                Profile {completionPercentage}% Complete
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
            <Text style={styles.completionArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>

        {userType === 'user' && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile-completion')}
          >
            <Text style={styles.menuItemText}>📊 Profile Completion</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        )}

        {userType === 'user' && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/resume-management')}
          >
            <Text style={styles.menuItemText}>Resume Management</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        )}

        {userType === 'user' && (
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/my-courses')}
            >
              <Text style={styles.menuItemText}>My Courses</Text>
              <Text style={styles.menuItemIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/certificates')}
            >
              <Text style={styles.menuItemText}>Certificates</Text>
              <Text style={styles.menuItemIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/saved-jobs')}
            >
              <Text style={styles.menuItemText}>Saved Jobs</Text>
              <Text style={styles.menuItemIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/bookmarked-courses')}
            >
              <Text style={styles.menuItemText}>Bookmarked Courses</Text>
              <Text style={styles.menuItemIcon}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {userType === 'user' && (
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/job-recommendations')}
          >
            <Text style={styles.menuItemText}>💡 Job Recommendations</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/application-stats')}
          >
            <Text style={styles.menuItemText}>📊 Application Statistics</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Notifications</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Help & Support</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>About</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>JobZee Mobile v1.0.0</Text>
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
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#9ca3af',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
  },
  menuItemIcon: {
    fontSize: 24,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  completionContent: {
    flex: 1,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#bfdbfe',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  completionArrow: {
    fontSize: 24,
    color: '#1e40af',
    marginLeft: 8,
  },
});
