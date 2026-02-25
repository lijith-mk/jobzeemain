import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    checkIfBookmarked();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.COURSE_BY_ID(id));
      const courseData = response.data.course || response.data;
      setCourse(courseData);
      setIsEnrolled(courseData.isEnrolled || false);
    } catch (error) {
      console.error('Error fetching course:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfBookmarked = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.BOOKMARKS);
      const bookmarks = response.data.bookmarks || response.data || [];
      const isCourseBookmarked = bookmarks.some(item =>
        (item.course?._id || item._id) === id
      );
      setIsBookmarked(isCourseBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleToggleBookmark = async () => {
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await api.delete(API_ENDPOINTS.LEARNING.BOOKMARK(id));
        setIsBookmarked(false);
        Alert.alert('Success', 'Bookmark removed');
      } else {
        await api.post(API_ENDPOINTS.LEARNING.BOOKMARK(id));
        setIsBookmarked(true);
        Alert.alert('Success', 'Course bookmarked');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      if (error.response?.status === 404) {
        Alert.alert('Feature Unavailable', 'Course bookmarks feature requires backend support. This will be available soon.');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to bookmark course');
      }
    } finally {
      setBookmarking(false);
    }
  };

  const handleEnroll = async () => {
    if (course.isPaid && !course.price) {
      Alert.alert('Coming Soon', 'Payment integration coming soon!');
      return;
    }

    setEnrolling(true);
    try {
      await api.post(API_ENDPOINTS.LEARNING.ENROLL, {
        courseId: id,
      });
      
      Alert.alert('Success!', 'You have been enrolled in this course');
      setIsEnrolled(true);
      fetchCourseDetails();
    } catch (error) {
      console.error('Error enrolling:', error);
      Alert.alert(
        'Enrollment Failed',
        error.response?.data?.message || 'Failed to enroll. Please try again.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Thumbnail */}
        {course.thumbnail && (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(course.level) },
              ]}
            >
              <Text style={styles.badgeText}>
                {course.level?.toUpperCase()}
              </Text>
            </View>
            {course.isPaid && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {course.currency} {course.price}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{course.title}</Text>
          
          {course.instructor && (
            <Text style={styles.instructor}>
              👤 Instructor: {course.instructor}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱️ {course.duration}h</Text>
            <Text style={styles.metaText}>
              ⭐ {course.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.metaText}>
              👥 {course.enrollmentCount || 0} enrolled
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 About This Course</Text>
          <Text style={styles.sectionText}>{course.description}</Text>
        </View>

        {/* Skills */}
        {course.skills && course.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ What You'll Learn</Text>
            <View style={styles.skillsContainer}>
              {course.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lessons */}
        {course.lessons && course.lessons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📚 Course Content ({course.lessons.length} lessons)
            </Text>
            {course.lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson._id}
                style={[
                  styles.lessonCard,
                  !isEnrolled && styles.lessonLocked,
                ]}
                onPress={() => {
                  if (isEnrolled) {
                    router.push(`/lesson-viewer?lessonId=${lesson._id}&courseId=${id}`);
                  } else {
                    Alert.alert('Enroll First', 'Please enroll in this course to access lessons');
                  }
                }}
                disabled={!isEnrolled}
              >
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.lessonContent}>
                  <Text style={[styles.lessonTitle, !isEnrolled && styles.lockedText]}>
                    {lesson.title}
                  </Text>
                  {lesson.duration && (
                    <Text style={styles.lessonDuration}>
                      ⏱️ {lesson.duration} min
                    </Text>
                  )}
                </View>
                {!isEnrolled && (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Prerequisites</Text>
            {course.prerequisites.map((prereq, index) => (
              <Text key={index} style={styles.bulletPoint}>
                • {prereq}
              </Text>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Enroll/Bookmark Buttons */}
      {!isEnrolled ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookmarkButton, bookmarking && styles.disabledButton]}
            onPress={handleToggleBookmark}
            disabled={bookmarking}
          >
            {bookmarking ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={styles.bookmarkButtonText}>
                {isBookmarked ? '🔖 Saved' : '🤍 Bookmark'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.enrollButton, enrolling && styles.disabledButton]}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.enrollButtonText}>
                  {course.isPaid ? `Enroll for ${course.currency} ${course.price}` : 'Enroll for Free'}
                </Text>
                {!course.isPaid && (
                  <Text style={styles.freeTag}>FREE</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              if (course.lessons && course.lessons.length > 0) {
                router.push(`/lesson-viewer?lessonId=${course.lessons[0]._id}&courseId=${id}`);
              }
            }}
          >
            <Text style={styles.startButtonText}>Continue Learning →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },
  scrollView: {
    flex: 1,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  instructor: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lessonLocked: {
    opacity: 0.6,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  lockedText: {
    color: '#9ca3af',
  },
  lessonDuration: {
    fontSize: 13,
    color: '#6b7280',
  },
  lockIcon: {
    fontSize: 18,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    gap: 12,
  },
  bookmarkButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  bookmarkButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  enrollButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  freeTag: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
