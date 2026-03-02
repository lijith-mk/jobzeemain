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

export default function MyCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.MY_COURSES);
      // Backend returns { progress } - array of CourseProgress with populated courseId
      const progressData = response.data.progress || [];
      // Extract courses and merge with progress info
      const coursesWithProgress = progressData.map(prog => ({
        ...prog.courseId,
        progress: prog.progressPercentage || 0,
        completedLessonsCount: prog.completedLessons?.length || 0,
        currentLessonId: prog.currentLessonId,
        enrolledAt: prog.enrolledAt,
        status: prog.status
      }));
      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching my courses:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load courses');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyCourses();
  };

  const calculateProgress = (course) => {
    // Use progress from CourseProgress model
    return course.progress || 0;
  };

  const getNextLesson = (course) => {
    // Since lessons aren't included in my-courses response,
    // we'll use currentLessonId or navigate to course details
    return course.currentLessonId ? { _id: course.currentLessonId } : null;
  };

  const renderProgressBar = (progress) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    );
  };

  const renderCourseCard = ({ item }) => {
    const progress = calculateProgress(item);
    const nextLesson = getNextLesson(item);
    const isCompleted = progress === 100;

    return (
      <View style={styles.card}>
        {/* Course Header */}
        <TouchableOpacity
          onPress={() => router.push(`/course-details?id=${item._id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.instructorRow}>
              <Text style={styles.icon}>👨‍🏫</Text>
              <Text style={styles.instructor}>
                {item.instructor?.name || 'Instructor'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📚</Text>
              <Text style={styles.metaText}>
                {item.status || 'enrolled'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>
                {item.duration ? `${item.duration}h` : 'Self-paced'}
              </Text>
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ Completed</Text>
              </View>
            )}
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            {renderProgressBar(progress)}
          </View>
        </TouchableOpacity>

        {/* Action Button */}
        {isCompleted ? (
          <TouchableOpacity
            style={styles.certificateButton}
            onPress={() => router.push('/certificates')}
          >
            <Text style={styles.certificateButtonText}>🏆 View Certificate</Text>
          </TouchableOpacity>
        ) : nextLesson ? (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push(`/lesson-viewer?lessonId=${nextLesson._id}&courseId=${item._id}`)}
          >
            <Text style={styles.continueButtonText}>
              Continue Learning →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push(`/course-details?id=${item._id}`)}
          >
            <Text style={styles.startButtonText}>Start Course →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your courses...</Text>
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
        <Text style={styles.headerTitle}>My Courses</Text>
        <Text style={styles.headerSubtitle}>
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} enrolled
        </Text>
      </View>

      {/* Courses List */}
      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No Courses Yet</Text>
            <Text style={styles.emptyText}>
              Start learning by enrolling in courses
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/courses')}
            >
              <Text style={styles.browseButtonText}>Browse Courses</Text>
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
  cardHeader: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  instructor: {
    fontSize: 14,
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  certificateButton: {
    backgroundColor: '#fbbf24',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  certificateButtonText: {
    color: '#78350f',
    fontSize: 15,
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
