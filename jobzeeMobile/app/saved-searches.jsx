import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_SEARCHES_KEY = '@saved_job_searches';

export default function SavedSearches() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        setSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySearch = (search) => {
    // Navigate to jobs with these filters
    // You would pass these as query params or use a global state
    router.push('/jobs');
    Alert.alert('Search Applied', `Filters applied: ${search.name}`);
  };

  const handleDeleteSearch = (searchId) => {
    Alert.alert(
      'Delete Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = searches.filter(s => s.id !== searchId);
              await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
              setSearches(updated);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete search');
            }
          },
        },
      ]
    );
  };

  const getFilterSummary = (filters) => {
    const parts = [];
    
    if (filters.searchQuery) {
      parts.push(`"${filters.searchQuery}"`);
    }
    if (filters.locationType && filters.locationType !== 'all') {
      parts.push(filters.locationType.charAt(0).toUpperCase() + filters.locationType.slice(1));
    }
    if (filters.employmentType && filters.employmentType !== 'all') {
      parts.push(filters.employmentType);
    }
    if (filters.experienceLevel && filters.experienceLevel !== 'all') {
      parts.push(filters.experienceLevel.charAt(0).toUpperCase() + filters.experienceLevel.slice(1));
    }

    return parts.length > 0 ? parts.join(' • ') : 'No specific filters';
  };

  const renderSearchCard = ({ item }) => (
    <View style={styles.searchCard}>
      <TouchableOpacity
        style={styles.searchContent}
        onPress={() => handleApplySearch(item)}
      >
        <View style={styles.searchHeader}>
          <Text style={styles.searchName}>{item.name}</Text>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        
        <Text style={styles.filterSummary}>
          {getFilterSummary(item.filters)}
        </Text>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          {item.filters.searchQuery && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>"{item.filters.searchQuery}"</Text>
            </View>
          )}
          {item.filters.locationType && item.filters.locationType !== 'all' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>📍 {item.filters.locationType}</Text>
            </View>
          )}
          {item.filters.employmentType && item.filters.employmentType !== 'all' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>💼 {item.filters.employmentType}</Text>
            </View>
          )}
          {item.filters.experienceLevel && item.filters.experienceLevel !== 'all' && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>⭐ {item.filters.experienceLevel}</Text>
            </View>
          )}
        </View>

        <Text style={styles.savedDate}>
          Saved on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <View style={styles.searchActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleApplySearch(item)}
        >
          <Text style={styles.actionButtonText}>Apply Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteSearch(item.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Searches</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Save your favorite search combinations to quickly find relevant jobs
        </Text>
      </View>

      {/* Searches List */}
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : searches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyText}>No Saved Searches</Text>
          <Text style={styles.emptySubtext}>
            Save your job searches from the Jobs tab to access them quickly here
          </Text>
          <View style={styles.howToCard}>
            <Text style={styles.howToTitle}>How to save a search:</Text>
            <Text style={styles.howToStep}>1. Go to the Jobs tab</Text>
            <Text style={styles.howToStep}>2. Apply your desired filters</Text>
            <Text style={styles.howToStep}>3. Tap the "Save Search" button</Text>
            <Text style={styles.howToStep}>4. Give it a name</Text>
          </View>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/jobs')}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={searches}
          renderItem={renderSearchCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: '#2563eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  howToCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  howToTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  howToStep: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
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
  listContent: {
    padding: 16,
  },
  searchCard: {
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
  searchContent: {
    marginBottom: 12,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  searchIcon: {
    fontSize: 24,
  },
  filterSummary: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },
  filterPillText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  savedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});
