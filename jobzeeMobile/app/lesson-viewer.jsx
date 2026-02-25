import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function LessonViewerScreen() {
  const { lessonId, courseId } = useLocalSearchParams();
  const router = useRouter();
  
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      // Fetch course details which includes lessons
      const response = await api.get(API_ENDPOINTS.LEARNING.COURSE_BY_ID(courseId));
      const courseData = response.data.course || response.data;
      setCourse(courseData);
      
      // Find the specific lesson
      const lessonData = courseData.lessons?.find(l => l._id === lessonId);
      if (lessonData) {
        setLesson(lessonData);
      } else {
        Alert.alert('Error', 'Lesson not found');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      Alert.alert('Error', 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await api.post(API_ENDPOINTS.LEARNING.PROGRESS, {
        courseId: courseId,
        lessonId: lessonId,
        completed: true,
      });
      
      Alert.alert('Success', 'Lesson marked as complete!');
      // Move to next lesson
      handleNextLesson();
    } catch (error) {
      console.error('Error marking complete:', error);
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setCompleting(false);
    }
  };

  const handleNextLesson = () => {
    if (!course || !course.lessons) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
    if (currentIndex < course.lessons.length - 1) {
      const nextLesson = course.lessons[currentIndex + 1];
      router.replace(`/lesson-viewer?lessonId=${nextLesson._id}&courseId=${courseId}`);
    } else {
      Alert.alert(
        'Course Complete!',
        'Congratulations! You have completed all lessons.',
        [
          {
            text: 'View Certificate',
            onPress: () => router.push('/certificates'),
          },
          {
            text: 'Back to Course',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const handlePreviousLesson = () => {
    if (!course || !course.lessons) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
    if (currentIndex > 0) {
      const prevLesson = course.lessons[currentIndex - 1];
      router.replace(`/lesson-viewer?lessonId=${prevLesson._id}&courseId=${courseId}`);
    }
  };

  const openVideo = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open video');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentIndex = course?.lessons?.findIndex(l => l._id === lessonId) ?? -1;
  const isFirstLesson = currentIndex === 0;
  const isLastLesson = currentIndex === (course?.lessons?.length || 0) - 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {course?.title || 'Course'}
        </Text>
        <Text style={styles.lessonProgress}>
          Lesson {currentIndex + 1} of {course?.lessons?.length || 0}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        
        {lesson.duration && (
          <Text style={styles.duration}>⏱️ {lesson.duration} minutes</Text>
        )}

        {/* Video Section */}
        {lesson.videoUrl && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>📹 Video Lesson</Text>
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => openVideo(lesson.videoUrl)}
            >
              <Text style={styles.videoIcon}>▶️</Text>
              <Text style={styles.videoButtonText}>Watch Video</Text>
            </TouchableOpacity>
            <Text style={styles.videoHint}>
              Video will open in your browser/YouTube app
            </Text>
          </View>
        )}

        {/* Content Section */}
        {lesson.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Lesson Content</Text>
            <Text style={styles.contentText}>{lesson.content}</Text>
          </View>
        )}

        {/* Resources */}
        {lesson.resources && lesson.resources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📎 Resources</Text>
            {lesson.resources.map((resource, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resourceItem}
                onPress={() => Linking.openURL(resource.url)}
              >
                <Text style={styles.resourceName}>{resource.name}</Text>
                <Text style={styles.resourceLink}>Open →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Key Takeaways</Text>
          <Text style={styles.infoText}>
            Make sure you understand this lesson before moving to the next one!
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.navButton, isFirstLesson && styles.disabledButton]}
            onPress={handlePreviousLesson}
            disabled={isFirstLesson}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.completeButton, completing && styles.disabledButton]}
            onPress={handleMarkComplete}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>
                {isLastLesson ? 'Complete Course ✓' : 'Mark Complete & Next →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    paddingTop: 12,
  },
  courseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lessonProgress: {
    color: '#dbeafe',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    padding: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  videoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 12,
    gap: 12,
  },
  videoIcon: {
    fontSize: 24,
  },
  videoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoHint: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
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
  contentText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  resourceLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  navButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4,
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
