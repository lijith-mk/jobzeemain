import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../utils/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../../constants/config';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MentorsScreen() {
  const [mentors, setMentors] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    fetchMentors();
    fetchRecommendedMentors();
  }, []);

  const fetchRecommendedMentors = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) return;

      const response = await api.get('/api/mentors/recommended', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      
      if (data.success && data.data && data.data.length > 0) {
        setRecommendedMentors(data.data);
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Error fetching recommended mentors:', error);
      // Silently fail - recommendations are optional
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.MENTOR.ALL);
      const data = response.data;
      
      // Handle direct array response from public endpoint
      if (Array.isArray(data)) {
        setMentors(data);
      } else if (data.success) {
        setMentors(data.mentors || data.data || []);
      } else {
        setMentors([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      Alert.alert('Error', 'Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMentors();
  };

  const industries = ['All', ...new Set(mentors.map(m => m.industry).filter(Boolean))];

  const filteredMentors = mentors.filter(mentor => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      mentor.name?.toLowerCase().includes(query) ||
      mentor.skills?.some(skill => skill.toLowerCase().includes(query)) ||
      mentor.role?.toLowerCase().includes(query) ||
      mentor.company?.toLowerCase().includes(query) ||
      mentor.industry?.toLowerCase().includes(query)
    );
    const matchesIndustry = selectedIndustry === 'All' || mentor.industry === selectedIndustry;
    const matchesFree = !showFreeOnly || mentor.price === 'Free' || mentor.price === '0' || mentor.price === 0;
    
    return matchesSearch && matchesIndustry && matchesFree;
  });

  const renderMentorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.mentorCard}
      onPress={() => router.push({
        pathname: '/mentor-details',
        params: { mentorId: item._id }
      })}
    >
      <View style={styles.cardContent}>
        <Image
          source={{ uri: item.photo || 'https://via.placeholder.com/80' }}
          style={styles.mentorPhoto}
        />
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{item.name}</Text>
          
          {item.role && (
            <Text style={styles.specialization}>{item.role}</Text>
          )}
          
          {item.company && (
            <Text style={styles.company}>🏢 {item.company}</Text>
          )}
          
          {item.industry && (
            <Text style={styles.industry}>🏭 {item.industry}</Text>
          )}
          
          {item.yearsOfExperience && (
            <Text style={styles.experience}>📅 {item.yearsOfExperience} years experience</Text>
          )}
          
          {item.skills && item.skills.length > 0 && (
            <View style={styles.expertiseContainer}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseText}>{skill}</Text>
                </View>
              ))}
              {item.skills.length > 3 && (
                <Text style={styles.moreExpertise}>+{item.skills.length - 3} more</Text>
              )}
            </View>
          )}
          
          {item.city && item.country && (
            <Text style={styles.location}>📍 {item.city}, {item.country}</Text>
          )}
          
          {item.price && (
            <Text style={styles.price}>💰 Starting from ₹{String(item.price).replace(/[$₹]/g, '')}/session</Text>
          )}
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push({
            pathname: '/mentor-details',
            params: { mentorId: item._id }
          })}
        >
          <Text style={styles.bookButtonText}>View Profile & Book</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRecommendedMentor = ({ item }) => (
    <TouchableOpacity
      style={styles.recommendedCard}
      onPress={() => router.push({
        pathname: '/mentor-details',
        params: { mentorId: item.mentorId || item._id }
      })}
    >
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>⭐ {item.matchScore}%</Text>
      </View>
      <Image
        source={{ uri: item.photo || 'https://via.placeholder.com/60' }}
        style={styles.recommendedPhoto}
      />
      <Text style={styles.recommendedName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.recommendedRole} numberOfLines={1}>{item.role}</Text>
      <Text style={styles.recommendedCompany} numberOfLines={1}>{item.company}</Text>
      
      {item.commonSkills && item.commonSkills.length > 0 && (
        <Text style={styles.commonSkills} numberOfLines={1}>
          ✓ {item.commonSkills.length} Skills Match
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading mentors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Mentor</Text>
        <Text style={styles.subtitle}>Connect with experienced professionals</Text>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/my-sessions')}
          >
            <Text style={styles.quickActionText}>📅 My Sessions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, skills, role, company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filtersRow}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedIndustry}
              onValueChange={(value) => setSelectedIndustry(value)}
              style={styles.picker}
            >
              {industries.map(industry => (
                <Picker.Item key={industry} label={industry} value={industry} />
              ))}
            </Picker>
          </View>
          
          <TouchableOpacity
            style={[styles.filterChip, showFreeOnly && styles.filterChipActive]}
            onPress={() => setShowFreeOnly(!showFreeOnly)}
          >
            <Text style={[styles.filterChipText, showFreeOnly && styles.filterChipTextActive]}>
              {showFreeOnly ? '✓ ' : ''}Free Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Recommended Mentors Section */}
        {showRecommendations && recommendedMentors.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <Text style={styles.recommendedTitle}>🌟 Recommended For You</Text>
              <Text style={styles.recommendedSubtitle}>AI-Powered Matches</Text>
            </View>
            <FlatList
              horizontal
              data={recommendedMentors}
              renderItem={renderRecommendedMentor}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedList}
            />
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Browse All Mentors</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        {/* All Mentors */}
        <View style={styles.allMentorsSection}>
          <Text style={styles.sectionTitle}>
            {showRecommendations ? 'All Mentors' : 'Top Mentors'} 
            <Text style={styles.resultCount}> ({filteredMentors.length} found)</Text>
          </Text>
          
          {filteredMentors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No Mentors Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search' : 'No mentors available at the moment'}
              </Text>
            </View>
          ) : (
            filteredMentors.map((mentor) => renderMentorCard({ item: mentor }))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 45,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  recommendedSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    marginBottom: 12,
  },
  recommendedHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  recommendedSubtitle: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 2,
  },
  recommendedList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recommendedCard: {
    width: 140,
    backgroundColor: '#F9F5FF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  matchBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendedPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  recommendedRole: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  recommendedCompany: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 6,
  },
  commonSkills: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  allMentorsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  listContainer: {
    padding: 16,
  },
  mentorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  mentorPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  industry: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  experience: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 6,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
  },
  expertiseTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  expertiseText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  moreExpertise: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'center',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sessionTypesContainer: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
  },
  sessionTypesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
