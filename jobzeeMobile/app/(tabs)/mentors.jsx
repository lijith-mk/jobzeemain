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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../../constants/config';

export default function MentorsScreen() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.MENTOR.ALL}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMentors(data.mentors || data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load mentors');
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      Alert.alert('Error', 'Failed to load mentors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMentors();
  };

  const filteredMentors = mentors.filter(mentor => {
    const query = searchQuery.toLowerCase();
    return (
      mentor.name?.toLowerCase().includes(query) ||
      mentor.expertise?.some(exp => exp.toLowerCase().includes(query)) ||
      mentor.specialization?.toLowerCase().includes(query)
    );
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
          
          {item.specialization && (
            <Text style={styles.specialization}>{item.specialization}</Text>
          )}
          
          {item.company && (
            <Text style={styles.company}>🏢 {item.company}</Text>
          )}
          
          {item.experience && (
            <Text style={styles.experience}>📅 {item.experience} years experience</Text>
          )}
          
          {item.expertise && item.expertise.length > 0 && (
            <View style={styles.expertiseContainer}>
              {item.expertise.slice(0, 3).map((exp, index) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseText}>{exp}</Text>
                </View>
              ))}
              {item.expertise.length > 3 && (
                <Text style={styles.moreExpertise}>+{item.expertise.length - 3} more</Text>
              )}
            </View>
          )}
          
          {item.city && item.country && (
            <Text style={styles.location}>📍 {item.city}, {item.country}</Text>
          )}
          
          {item.sessionTypes && item.sessionTypes.length > 0 && (
            <View style={styles.sessionTypesContainer}>
              <Text style={styles.sessionTypesLabel}>Available sessions:</Text>
              {item.sessionTypes.map((session, index) => (
                <Text key={index} style={styles.sessionType}>
                  • {session.title} - {session.duration}min - ₹{session.price}
                </Text>
              ))}
            </View>
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
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, expertise, or specialization..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredMentors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>No Mentors Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'No mentors available at the moment'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMentors}
          renderItem={renderMentorCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  experience: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
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
