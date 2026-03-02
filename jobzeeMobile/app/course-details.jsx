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
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificateEligibility, setCertificateEligibility] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
    checkIfBookmarked();
  }, [id]);

  useEffect(() => {
    // Check eligibility when progress status changes to completed
    if (progress && progress.status === 'completed') {
      checkCertificateEligibility();
    }
  }, [progress?.status]);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.COURSE_BY_ID(id));
      const courseData = response.data.course || response.data;
      const lessonsData = response.data.lessons || [];
      
      setCourse(courseData);
      setLessons(lessonsData);
      
      // Backend returns 'progress' object if user is enrolled
      const progressData = response.data.progress;
      const enrolled = !!progressData;
      setIsEnrolled(enrolled);
      setProgress(progressData);
    } catch (error) {
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
      // Silently fail - just assume not bookmarked
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
      Alert.alert('Feature Unavailable', 'Course bookmarks feature is not available yet.');
    } finally {
      setBookmarking(false);
    }
  };

  const handleEnroll = async () => {
    // For paid courses, redirect to payment page
    if (course.isPaid && course.price > 0) {
      router.push(`/course-payment?courseId=${id}&title=${encodeURIComponent(course.title)}&price=${course.price}&currency=${course.currency || 'INR'}`);
      return;
    }

    // For free courses, enroll directly
    setEnrolling(true);
    try {
      await api.post(API_ENDPOINTS.LEARNING.ENROLL, {
        courseId: id,
      });
      
      Alert.alert('Success!', 'You have been enrolled in this course');
      setIsEnrolled(true);
      await fetchCourseDetails();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Already enrolled')) {
        setIsEnrolled(true);
        Alert.alert('Already Enrolled', 'You are already enrolled in this course!');
        await fetchCourseDetails();
      } else {
        Alert.alert(
          'Enrollment Failed',
          error.response?.data?.message || 'Failed to enroll. Please try again.'
        );
      }
    } finally {
      setEnrolling(false);
    }
  };

  const checkCertificateEligibility = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CERTIFICATES.ELIGIBILITY(id));
      setCertificateEligibility(response.data);
      console.log('Certificate eligibility:', response.data);
    } catch (error) {
      console.error('Error checking certificate eligibility:', error);
      // Set eligibility to null if check fails
      setCertificateEligibility(null);
    }
  };

  const handleGenerateCertificate = async () => {
    // Check if certificate is already issued
    if (certificateEligibility?.details?.certificateId) {
      Alert.alert(
        'Certificate Already Issued',
        'You already have a certificate for this course.',
        [
          {
            text: 'View Certificate',
            onPress: () => router.push('/certificates'),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }
    
    // Check eligibility first
    if (certificateEligibility && !certificateEligibility.eligible) {
      // Show detailed error message about what's missing
      let message = certificateEligibility.message || 'You are not eligible for a certificate yet.';
      
      if (certificateEligibility.details) {
        const details = certificateEligibility.details;
        
        if (details.remainingLessons && details.remainingLessons > 0) {
          message += `\n\n📚 Remaining Lessons: ${details.remainingLessons}`;
        }
        
        if (details.failedQuizzes && details.failedQuizzes.length > 0) {
          message += `\n\n📋 Mandatory Quizzes Not Passed:`;
          details.failedQuizzes.forEach((quiz, index) => {
            if (index < 3) { // Show max 3 quizzes
              message += `\n• ${quiz.title || 'Quiz'}: ${quiz.reason}`;
              if (quiz.score !== undefined) {
                message += ` (Score: ${quiz.score}%, Required: ${quiz.passingScore}%)`;
              }
            }
          });
          if (details.failedQuizzes.length > 3) {
            message += `\n... and ${details.failedQuizzes.length - 3} more`;
          }
        }
        
        if (details.totalMandatoryQuizzes) {
          message += `\n\n✅ Passed: ${details.passedMandatoryQuizzes || 0}/${details.totalMandatoryQuizzes} mandatory quizzes`;
        }
      }
      
      Alert.alert('Certificate Not Available', message);
      return;
    }
    
    setGeneratingCertificate(true);
    try {
      const response = await api.post(API_ENDPOINTS.CERTIFICATES.GENERATE, {
        courseId: id,
      });
      
      Alert.alert(
        'Certificate Generated!',
        'Your certificate has been generated successfully. You can view it in the Certificates section.',
        [
          {
            text: 'View Certificate',
            onPress: () => router.push('/certificates'),
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ]
      );
      
      // Refresh course details to update certificate status
      await fetchCourseDetails();
    } catch (error) {
      console.error('Error generating certificate:', error);
      
      // Log response details for debugging
      if (error.response) {
        console.log('Certificate generation error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      // Check if certificate was actually created (backend returns 403 but includes certificate details)
      if (error.response?.data?.details?.certificateId) {
        // Certificate exists - treat as success
        Alert.alert(
          'Certificate Ready!',
          'Your certificate has been generated. You can view it in the Certificates section.',
          [
            {
              text: 'View Certificate',
              onPress: () => router.push('/certificates'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        
        // Refresh course details and eligibility
        await fetchCourseDetails();
        await checkCertificateEligibility();
        return;
      }
      
      if (error.response?.status === 409) {
        Alert.alert(
          'Certificate Already Exists',
          'You already have a certificate for this course. View it in the Certificates section.',
          [
            {
              text: 'View Certificates',
              onPress: () => router.push('/certificates'),
            },
            { text: 'OK' },
          ]
        );
      } else if (error.response?.status === 403) {
        // Server-side eligibility check failed - refresh eligibility
        await checkCertificateEligibility();
        
        let message = error.response?.data?.message || 'You are not eligible for a certificate yet.';
        
        // If server provides details, add them
        if (error.response?.data?.details) {
          const details = error.response.data.details;
          if (details.failedQuizzes && details.failedQuizzes.length > 0) {
            message += `\n\n📋 Failed Quizzes:`;
            details.failedQuizzes.forEach((quiz, index) => {
              if (index < 3) {
                message += `\n• ${quiz.title || 'Quiz'}`;
              }
            });
          }
        }
        
        Alert.alert('Not Eligible', message);
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to generate certificate. Please try again.'
        );
      }
    } finally {
      setGeneratingCertificate(false);
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
              👤 Instructor: {typeof course.instructor === 'object' ? course.instructor.name : course.instructor}
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

          {/* Completion Status */}
          {progress && progress.status === 'completed' && (
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>
                ✅ Completed • {progress.progressPercentage}% {progress.completedAt ? `• ${new Date(progress.completedAt).toLocaleDateString()}` : ''}
              </Text>
            </View>
          )}

          {/* Certificate Eligibility Status */}
          {progress && progress.status === 'completed' && certificateEligibility && (
            <View style={styles.eligibilitySection}>
              {/* Check if certificate is already issued */}
              {certificateEligibility.details?.certificateId ? (
                <View style={styles.eligibleBadge}>
                  <Text style={styles.eligibleText}>
                    ✅ Certificate Issued
                  </Text>
                  <Text style={styles.eligibilityDetails}>
                    View your certificate in the Certificates section
                  </Text>
                </View>
              ) : certificateEligibility.eligible ? (
                <View style={styles.eligibleBadge}>
                  <Text style={styles.eligibleText}>
                    🎓 Ready for Certificate
                  </Text>
                  {certificateEligibility.details?.totalMandatoryQuizzes > 0 && (
                    <Text style={styles.eligibilityDetails}>
                      All {certificateEligibility.details.totalMandatoryQuizzes} mandatory quizzes passed
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.notEligibleBadge}>
                  <Text style={styles.notEligibleText}>
                    ⚠️ Certificate Requirements
                  </Text>
                  {certificateEligibility.details?.remainingLessons > 0 && (
                    <Text style={styles.eligibilityDetails}>
                      • Complete {certificateEligibility.details.remainingLessons} more lessons
                    </Text>
                  )}
                  {certificateEligibility.details?.failedQuizzes && certificateEligibility.details.failedQuizzes.length > 0 && (
                    <Text style={styles.eligibilityDetails}>
                      • Pass {certificateEligibility.details.failedQuizzes.length} mandatory quiz{certificateEligibility.details.failedQuizzes.length > 1 ? 'zes' : ''}
                    </Text>
                  )}
                  {certificateEligibility.details?.totalMandatoryQuizzes > 0 && (
                    <Text style={styles.eligibilityDetails}>
                      Passed: {certificateEligibility.details.passedMandatoryQuizzes || 0}/{certificateEligibility.details.totalMandatoryQuizzes} quizzes
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
          
          {/* Progress Bar for enrolled courses */}
          {progress && progress.status !== 'completed' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress.progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress.progressPercentage}% Complete</Text>
            </View>
          )}
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
        {lessons && lessons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📚 Course Content ({lessons.length} lessons)
            </Text>
            {lessons.map((lesson, index) => (
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
          {progress && progress.status === 'completed' ? (
            <View style={styles.footerRow}>
              {progress.certificateIssued || progress.certificateUrl ? (
                <TouchableOpacity
                  style={styles.certificateButton}
                  onPress={() => router.push('/certificates')}
                >
                  <Text style={styles.certificateButtonText}>🏆 View Certificate</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.certificateButton, generatingCertificate && styles.disabledButton]}
                  onPress={handleGenerateCertificate}
                  disabled={generatingCertificate}
                >
                  {generatingCertificate ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.certificateButtonText}>🏆 Generate Certificate</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  if (lessons && lessons.length > 0) {
                    router.push(`/lesson-viewer?lessonId=${lessons[0]._id}&courseId=${id}`);
                  }
                }}
              >
                <Text style={styles.reviewButtonText}>📖 Review Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                if (lessons && lessons.length > 0) {
                  const nextLesson = progress?.currentLessonId || lessons[0]._id;
                  router.push(`/lesson-viewer?lessonId=${nextLesson}&courseId=${id}`);
                }
              }}
            >
              <Text style={styles.startButtonText}>Continue Learning →</Text>
            </TouchableOpacity>
          )}
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
  completionBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  completionText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  eligibilitySection: {
    marginTop: 12,
  },
  eligibleBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  eligibleText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notEligibleBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  notEligibleText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  eligibilityDetails: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  certificateButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  certificateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
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
