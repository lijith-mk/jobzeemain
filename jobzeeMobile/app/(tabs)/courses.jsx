import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';

export default function CoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.COURSES);
      setCourses(response.data.courses || response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
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

  const renderCourseCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => router.push(`/course-details?id=${item._id}`)}
    >
      {item.thumbnail && (
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.courseThumbnail}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor(item.level) },
            ]}
          >
            <Text style={styles.levelText}>
              {item.level?.toUpperCase()}
            </Text>
          </View>
          {item.isEnrolled ? (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ ENROLLED</Text>
            </View>
          ) : item.isPaid && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                {item.currency} {item.price}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.courseMeta}>
          <Text style={styles.metaText}>⏱️ {item.duration}h</Text>
          <Text style={styles.metaText}>⭐ {item.averageRating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.metaText}>👥 {item.enrollmentCount || 0}</Text>
        </View>

        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 2).map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 2 && (
              <Text style={styles.moreSkills}>+{item.skills.length - 2}</Text>
            )}
          </View>
        )}

        {item.isEnrolled && item.enrollmentProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${item.enrollmentProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(item.enrollmentProgress)}% complete</Text>
          </View>
        )}

        <View style={styles.enrollButton}>
          <Text style={styles.enrollButtonText}>
            {item.isEnrolled ? 'Continue Learning →' : item.isPaid ? 'View Details →' : 'View Course →'}
          </Text>
        </View>
      </View>
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
      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No courses available</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
  courseThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  courseContent: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  enrolledBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enrolledText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: 12,
    color: '#1e40af',
  },
  moreSkills: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#6b7280',
  },
  enrollButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
