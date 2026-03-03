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
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';

export default function CoursesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('browse'); // browse, my-learning, paths
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [myLearningPaths, setMyLearningPaths] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'browse') {
      await fetchCourses();
      await fetchRecommendedCourses();
    } else if (activeTab === 'my-learning') {
      await fetchMyCourses();
      await fetchMyLearningPaths();
    } else if (activeTab === 'paths') {
      await fetchLearningPaths();
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.LEARNING.COURSES);
      setCourses(response.data.courses || response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.LEARNING.MY_COURSES);
      setMyCourses(response.data.progress || []);
    } catch (error) {
      console.error('Error fetching my courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.LEARNING.LEARNING_PATHS);
      setLearningPaths(response.data.paths || []);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyLearningPaths = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.MY_LEARNING_PATHS);
      setMyLearningPaths(response.data.paths || response.data || []);
    } catch (error) {
      console.error('Error fetching my learning paths:', error);
      // Fallback to filtering all paths
      try {
        const allPaths = await api.get(API_ENDPOINTS.LEARNING.LEARNING_PATHS);
        const enrolled = allPaths.data.paths?.filter(p => p.isEnrolled) || [];
        setMyLearningPaths(enrolled);
      } catch (err) {
        console.error('Fallback also failed:', err);
      }
    }
  };

  const fetchRecommendedCourses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.LEARNING.RECOMMENDED_COURSES);
      setRecommendedCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredData = () => {
    let data = [];
    if (activeTab === 'browse') {
      data = courses;
    } else if (activeTab === 'my-learning') {
      data = myCourses;
    } else if (activeTab === 'paths') {
      data = learningPaths;
    }

    if (!searchQuery) return data;
    
    return data.filter(item => {
      const searchText = searchQuery.toLowerCase();
      const title = (item.title || item.courseId?.title || item.name || '').toLowerCase();
      const description = (item.description || item.courseId?.description || '').toLowerCase();
      return title.includes(searchText) || description.includes(searchText);
    });
  };

  const renderMyCourseCard = ({ item }) => {
    const course = item.courseId;
    if (!course) return null;

    return (
      <TouchableOpacity 
        style={styles.courseCard}
        onPress={() => router.push(`/course-details?id=${course._id}`)}
      >
        {course.thumbnail && (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.courseThumbnail}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) }]}>
              <Text style={styles.levelText}>{course.level?.toUpperCase()}</Text>
            </View>
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ ENROLLED</Text>
            </View>
          </View>

          <Text style={styles.courseTitle} numberOfLines={2}>
            {course.title}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${item.progressPercentage || 0}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(item.progressPercentage || 0)}% complete</Text>
          </View>

          {item.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}

          <View style={styles.enrollButton}>
            <Text style={styles.enrollButtonText}>Continue Learning →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLearningPathCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.pathCard}
      onPress={() => router.push(`/learning-path?id=${item._id}`)}
    >
      <View style={styles.pathContent}>
        <View style={styles.pathHeader}>
          <Text style={styles.pathIcon}>🎯</Text>
          {item.isEnrolled && (
            <View style={styles.enrolledBadge}>
              <Text style={styles.enrolledText}>✓ ENROLLED</Text>
            </View>
          )}
        </View>

        <Text style={styles.pathTitle} numberOfLines={2}>
          {item.title || item.name}
        </Text>

        <Text style={styles.pathDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.pathMeta}>
          <Text style={styles.metaText}>📚 {item.courses?.length || 0} courses</Text>
          <Text style={styles.metaText}>⏱️ {item.estimatedDuration || 0}h</Text>
        </View>

        {item.isEnrolled && item.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${item.progress.completionPercentage || 0}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress.completedCourses || 0}/{item.courses?.length || 0} courses completed
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
              📚 Browse Courses
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-learning' && styles.activeTab]}
            onPress={() => setActiveTab('my-learning')}
          >
            <Text style={[styles.tabText, activeTab === 'my-learning' && styles.activeTabText]}>
              🎓 My Learning
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'paths' && styles.activeTab]}
            onPress={() => setActiveTab('paths')}
          >
            <Text style={[styles.tabText, activeTab === 'paths' && styles.activeTabText]}>
              🎯 Learning Paths
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'browse' ? 'courses' : activeTab === 'my-learning' ? 'my courses' : 'learning paths'}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'browse' && (
        <FlatList
          data={filteredData()}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            recommendedCourses.length > 0 ? (
              <View style={styles.recommendedSection}>
                <Text style={styles.sectionTitle}>🌟 Recommended for You</Text>
                {recommendedCourses.slice(0, 3).map((course) => (
                  renderCourseCard({ item: course })
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No courses available</Text>
              <Text style={styles.emptySubtext}>Check back later for new courses</Text>
            </View>
          }
        />
      )}

      {activeTab === 'my-learning' && (
        <View style={styles.myLearningContainer}>
          {myCourses.length === 0 && myLearningPaths.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎓</Text>
              <Text style={styles.emptyText}>No enrolled courses yet</Text>
              <Text style={styles.emptySubtext}>Browse courses to start learning</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => setActiveTab('browse')}
              >
                <Text style={styles.browseButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {filteredData().length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>📖 My Courses</Text>
                  {filteredData().map((item) => (
                    <View key={item._id}>
                      {renderMyCourseCard({ item })}
                    </View>
                  ))}
                </>
              )}

              {myLearningPaths.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>🎯 My Learning Paths</Text>
                  {myLearningPaths.map((item) => (
                    <View key={item._id}>
                      {renderLearningPathCard({ item })}
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === 'paths' && (
        <FlatList
          data={filteredData()}
          renderItem={renderLearningPathCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No learning paths available</Text>
              <Text style={styles.emptySubtext}>Check back later for new paths</Text>
            </View>
          }
        />
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
  // Tab Navigation Styles
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  // Search Bar Styles
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 15,
    color: '#111827',
  },
  searchIcon: {
    position: 'absolute',
    right: 24,
    fontSize: 18,
  },
  // Section Styles
  recommendedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  myLearningContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  // Course Card Styles
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
  completedBadge: {
    backgroundColor: '#c7f9cc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: '#14532d',
    fontSize: 12,
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
  // Learning Path Card Styles
  pathCard: {
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
  pathContent: {
    padding: 16,
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pathIcon: {
    fontSize: 28,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pathDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  pathMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  // Empty State Styles
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
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
});
