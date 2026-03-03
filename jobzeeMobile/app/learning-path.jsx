import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { API_ENDPOINTS } from '../constants/config';
import { api } from '../utils/api';

export default function LearningPath() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [path, setPath] = useState(null);
  const [pathProgress, setPathProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchPathDetails();
  }, [id]);

  const fetchPathDetails = async () => {
    try {
      // Fetch all learning paths and find the matching one
      const response = await api.get(API_ENDPOINTS.LEARNING.LEARNING_PATHS);
      const allPaths = response.data.paths || response.data || [];
      const foundPath = allPaths.find(p => p._id === id);

      if (!foundPath) {
        throw new Error('Learning path not found');
      }

      setPath(foundPath);

      // Always check enrollment by trying to fetch progress
      // If progress exists, user is enrolled
      try {
        const progressResponse = await api.get(
          `${API_ENDPOINTS.LEARNING.LEARNING_PATHS}/${id}/progress`
        );
        if (progressResponse.data) {
          setPathProgress(progressResponse.data);
          setIsEnrolled(true);
        }
      } catch (error) {
        // If 404 or error, user is not enrolled
        console.log('User not enrolled in this path');
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Error fetching learning path:', error);
      Alert.alert('Error', 'Failed to load learning path details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      if (!id) {
        throw new Error('Invalid learning path ID');
      }

      console.log('Enrolling in path:', id);
      const response = await api.post(API_ENDPOINTS.LEARNING.ENROLL_LEARNING_PATH, { 
        pathId: id 
      });
      console.log('Enrollment response:', response.data);

      // Set enrolled state first
      setIsEnrolled(true);
      
      // Fetch progress details
      try {
        const progressResponse = await api.get(
          `${API_ENDPOINTS.LEARNING.LEARNING_PATHS}/${id}/progress`
        );
        setPathProgress(progressResponse.data);
      } catch (error) {
        console.log('Could not fetch progress after enrollment:', error);
      }

      Alert.alert('Success', 'Successfully enrolled in learning path!');

      Alert.alert('Success', 'Successfully enrolled in learning path!');
      setIsEnrolled(true);
      await fetchPathDetails();
    } catch (error) {
      console.error('Error enrolling:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to enroll in learning path';
      Alert.alert('Error', errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </>
    );
  }

  if (!path) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Learning path not found</Text>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: path.title || 'Learning Path' }} />
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.pathIcon}>🎯</Text>
          <Text style={styles.title}>{path.title}</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(path.level) }]}>
            <Text style={styles.levelText}>{path.level?.toUpperCase()}</Text>
          </View>
          <Text style={styles.description}>{path.description}</Text>
        </View>

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>📚</Text>
            <Text style={styles.metaLabel}>Courses</Text>
            <Text style={styles.metaValue}>{path.courses?.length || 0}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValue}>{path.estimatedDuration || 0}h</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaLabel}>Enrolled</Text>
            <Text style={styles.metaValue}>{path.enrollmentCount || 0}</Text>
          </View>
        </View>

        {/* Progress Section (if enrolled) */}
        {isEnrolled && pathProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(pathProgress.progress?.progressPercentage || 0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pathProgress.progress?.progressPercentage || 0}%` },
                  ]}
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressStat}>
                  ✅ {pathProgress.completedCount || 0} of {pathProgress.totalCourses || path.courses?.length || 0} completed
                </Text>
                <Text style={styles.progressStat}>
                  🔓 {pathProgress.unlockedCount || 0} courses unlocked
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Courses Section */}
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>📚 Courses in this Path</Text>
          {path.courses && path.courses.length > 0 ? (
            (pathProgress?.courses || path.courses).map((pathCourse, index) => {
              // If pathProgress exists, use its courses array with status information
              // Otherwise use the path's courses array
              const course = pathCourse.courseId || pathCourse;
              
              // Determine unlock status
              let isUnlocked, isCompleted;
              if (pathProgress?.courses) {
                // Use progress data status
                isUnlocked = pathCourse.isUnlocked || pathCourse.status !== 'locked';
                isCompleted = pathCourse.status === 'completed';
              } else {
                // Fallback: first course is unlocked, others based on completion count
                isUnlocked = index === 0 || (pathProgress?.completedCount || 0) >= index;
                isCompleted = false;
              }

              return (
                <TouchableOpacity
                  key={course._id || index}
                  style={[
                    styles.courseCard,
                    !isUnlocked && styles.lockedCard,
                  ]}
                  onPress={() => {
                    if (isEnrolled && isUnlocked) {
                      router.push(`/course-details?id=${course._id}`);
                    }
                  }}
                  disabled={!isEnrolled || !isUnlocked}
                >
                  <View style={styles.courseNumber}>
                    <Text style={styles.courseNumberText}>{index + 1}</Text>
                  </View>

                  {course.thumbnail ? (
                    <Image
                      source={{ uri: course.thumbnail }}
                      style={styles.courseThumbnail}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.courseContent}>
                    <View style={styles.courseHeader}>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>✓ COMPLETED</Text>
                        </View>
                      )}
                      {!isUnlocked && (
                        <View style={styles.lockedBadge}>
                          <Text style={styles.lockedText}>🔒 LOCKED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseDescription} numberOfLines={2}>
                      {course.description}
                    </Text>

                    <View style={styles.courseMeta}>
                      <Text style={styles.metaText}>⏱️ {course.duration}h</Text>
                      <Text style={styles.metaText}>
                        ⭐ {course.averageRating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>

                    {!isUnlocked && (
                      <Text style={styles.unlockText}>
                        Complete previous course to unlock
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No courses in this path yet</Text>
          )}
        </View>

        {/* Enroll Button (if not enrolled) */}
        {!isEnrolled && (
          <View style={styles.enrollSection}>
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.enrollButtonText}>Enroll in Learning Path</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pathIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metaIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressStats: {
    gap: 6,
  },
  progressStat: {
    fontSize: 13,
    color: '#6b7280',
  },
  coursesSection: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  lockedCard: {
    opacity: 0.6,
  },
  courseNumber: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  courseNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  courseThumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: '#e5e7eb',
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lockedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockedText: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  unlockText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  enrollSection: {
    padding: 16,
  },
  enrollButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
