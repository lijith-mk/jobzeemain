import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';

const SEARCH_HISTORY_KEY = '@job_search_history';
const SAVED_SEARCHES_KEY = '@saved_job_searches';
const MAX_HISTORY_ITEMS = 20;

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    locationType: 'all',
    employmentType: 'all',
    experienceLevel: 'all',
  });

  useEffect(() => {
    fetchJobs();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, jobs, filters]);

  const loadSearchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveToHistory = async (searchTerm) => {
    if (!searchTerm.trim()) return;

    try {
      const trimmedTerm = searchTerm.trim();
      
      // Remove if already exists to avoid duplicates
      const filtered = searchHistory.filter(
        item => item.searchTerm.toLowerCase() !== trimmedTerm.toLowerCase()
      );

      // Add new search at the beginning
      const newHistory = [
        {
          id: Date.now().toString(),
          searchTerm: trimmedTerm,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only MAX_HISTORY_ITEMS

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveToHistory(searchQuery);
      setShowSearchHistory(false);
      setSearchInputFocused(false);
    }
  };

  const handleHistoryItemPress = (searchTerm) => {
    setSearchQuery(searchTerm);
    setShowSearchHistory(false);
    setSearchInputFocused(false);
    saveToHistory(searchTerm);
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.employer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location type filter
    if (filters.locationType !== 'all') {
      filtered = filtered.filter(job => job.locationType === filters.locationType);
    }

    // Employment type filter
    if (filters.employmentType !== 'all') {
      filtered = filtered.filter(job => job.employmentType === filters.employmentType);
    }

    // Experience level filter
    if (filters.experienceLevel !== 'all') {
      filtered = filtered.filter(job => job.experienceLevel === filters.experienceLevel);
    }

    setFilteredJobs(filtered);
  };

  const resetFilters = () => {
    setFilters({
      locationType: 'all',
      employmentType: 'all',
      experienceLevel: 'all',
    });
    setShowFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.locationType !== 'all') count++;
    if (filters.employmentType !== 'all') count++;
    if (filters.experienceLevel !== 'all') count++;
    return count;
  };

  const handleSaveSearch = () => {
    if (searchQuery.trim() === '' && getActiveFilterCount() === 0) {
      Alert.alert('No Search Criteria', 'Please add search terms or filters before saving');
      return;
    }

    Alert.prompt(
      'Save Search',
      'Give this search a name:',
      async (name) => {
        if (name && name.trim()) {
          try {
            const stored = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
            const savedSearches = stored ? JSON.parse(stored) : [];

            const newSearch = {
              id: Date.now().toString(),
              name: name.trim(),
              filters: {
                searchQuery,
                locationType: filters.locationType,
                employmentType: filters.employmentType,
                experienceLevel: filters.experienceLevel,
              },
              createdAt: new Date().toISOString(),
            };

            const updatedSearches = [newSearch, ...savedSearches];
            await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
            
            Alert.alert('Success', 'Search saved successfully!');
          } catch (error) {
            Alert.alert('Error', 'Failed to save search');
          }
        }
      }
    );
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.JOBS.ALL);
      setJobs(response.data.jobs || response.data || []);
      setFilteredJobs(response.data.jobs || response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getLocationTypeColor = (type) => {
    switch (type) {
      case 'remote':
        return '#10b981';
      case 'hybrid':
        return '#f59e0b';
      case 'on-site':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const renderJobCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => router.push(`/job-details?id=${item._id}`)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View
          style={[
            styles.locationTypeBadge,
            { backgroundColor: getLocationTypeColor(item.locationType) },
          ]}
        >
          <Text style={styles.locationTypeText}>
            {item.locationType?.toUpperCase() || 'N/A'}
          </Text>
        </View>
      </View>

      {item.employer && (
        <Text style={styles.companyName} numberOfLines={1}>
          {item.employer.companyName}
        </Text>
      )}

      <View style={styles.jobMeta}>
        <Text style={styles.metaText}>📍 {item.location}</Text>
        <Text style={styles.metaText}>💼 {item.employmentType}</Text>
      </View>

      {item.salary && (
        <Text style={styles.salary}>
          💰 ₹{item.salary.min?.toLocaleString()} - ₹{item.salary.max?.toLocaleString()}
        </Text>
      )}

      {item.skills && item.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {item.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.jobFooter}>
        <Text style={styles.postedDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.applyButton}>
          <Text style={styles.applyButtonText}>View Details →</Text>
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
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              setSearchInputFocused(true);
              if (searchHistory.length > 0) {
                setShowSearchHistory(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow taps on history items
              setTimeout(() => {
                setSearchInputFocused(false);
                setShowSearchHistory(false);
              }, 200);
            }}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.historyIconButton}
            onPress={() => router.push('/search-history')}
          >
            <Text style={styles.historyIcon}>🕐</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>
            🔍 Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={styles.savedSearchesButton}
            onPress={() => router.push('/saved-searches')}
          >
            <Text style={styles.savedSearchesButtonText}>🔖 Saved</Text>
          </TouchableOpacity>
          
          {(searchQuery.trim() !== '' || getActiveFilterCount() > 0) && (
            <TouchableOpacity
              style={styles.saveSearchButton}
              onPress={handleSaveSearch}
            >
              <Text style={styles.saveSearchButtonText}>💾 Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Searches Dropdown */}
      {showSearchHistory && searchHistory.length > 0 && (
        <View style={styles.searchHistoryDropdown}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyHeaderText}>Recent Searches</Text>
            <TouchableOpacity onPress={() => router.push('/search-history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleHistoryItemPress(item.searchTerm)}
            >
              <Text style={styles.historyItemIcon}>🔍</Text>
              <Text style={styles.historyItemText} numberOfLines={1}>
                {item.searchTerm}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || getActiveFilterCount() > 0 
                ? 'No jobs found matching your criteria' 
                : 'No jobs available'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Jobs</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll}>
              {/* Location Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Location Type</Text>
                <View style={styles.filterOptions}>
                  {['all', 'remote', 'hybrid', 'on-site'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.locationType === type && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters({ ...filters, locationType: type })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.locationType === type && styles.filterOptionTextActive,
                        ]}
                      >
                        {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Employment Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Employment Type</Text>
                <View style={styles.filterOptions}>
                  {['all', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.employmentType === type && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters({ ...filters, employmentType: type })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.employmentType === type && styles.filterOptionTextActive,
                        ]}
                      >
                        {type === 'all' ? 'All' : type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Experience Level Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Experience Level</Text>
                <View style={styles.filterOptions}>
                  {['all', 'entry', 'mid', 'senior', 'executive'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.filterOption,
                        filters.experienceLevel === level && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilters({ ...filters, experienceLevel: level })}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.experienceLevel === level && styles.filterOptionTextActive,
                        ]}
                      >
                        {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  historyIconButton: {
    padding: 8,
  },
  historyIcon: {
    fontSize: 20,
  },
  filterButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  savedSearchesButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  savedSearchesButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  saveSearchButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  filterScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  locationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
    marginBottom: 4,
  },
  salary: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
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
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  postedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
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
  searchHistoryDropdown: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  historyItemIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  historyItemText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
});
