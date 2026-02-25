import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { API_ENDPOINTS } from '../constants/config';

export default function JobRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchScores, setMatchScores] = useState({});
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.JOBS.LIST);
      
      if (response.data.success) {
        const jobs = response.data.data;
        const scored = scoreJobs(jobs);
        setRecommendations(scored);
        setBackendUnavailable(false);
      }
    } catch (error) {
      // Silently fail for 404 - backend endpoint may not exist
      if (error.response?.status === 404) {
        setBackendUnavailable(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  };

  const scoreJobs = (jobs) => {
    const userSkills = user?.skills?.map(s => s.toLowerCase()) || [];
    const userExperience = user?.experience || 0;
    const userPreferredLocations = user?.preferredLocations?.map(l => l.toLowerCase()) || [];
    const userEducation = user?.education?.level?.toLowerCase() || '';

    const scoredJobs = jobs.map(job => {
      let score = 0;
      let reasons = [];

      // Skill match (highest weight)
      const jobSkills = job.requiredSkills?.map(s => s.toLowerCase()) || [];
      const matchingSkills = userSkills.filter(skill => 
        jobSkills.some(js => js.includes(skill) || skill.includes(js))
      );
      
      if (matchingSkills.length > 0) {
        const skillScore = (matchingSkills.length / jobSkills.length) * 40;
        score += skillScore;
        reasons.push(`${matchingSkills.length} matching skills`);
      }

      // Experience match
      const requiredExp = extractExperience(job.experienceLevel);
      const expDiff = Math.abs(userExperience - requiredExp);
      if (expDiff <= 1) {
        score += 25;
        reasons.push('Experience level match');
      } else if (expDiff <= 2) {
        score += 15;
        reasons.push('Similar experience level');
      }

      // Location preference
      if (job.locationType === 'remote') {
        score += 15;
        reasons.push('Remote opportunity');
      } else if (userPreferredLocations.some(loc => 
        job.location?.toLowerCase().includes(loc)
      )) {
        score += 15;
        reasons.push('Preferred location');
      }

      // Education match
      if (job.education && userEducation) {
        const educationMatch = checkEducationMatch(userEducation, job.education);
        if (educationMatch) {
          score += 10;
          reasons.push('Education requirement met');
        }
      }

      // Recent posting bonus
      const daysOld = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysOld <= 7) {
        score += 10;
        reasons.push('Recently posted');
      }

      return {
        ...job,
        matchScore: Math.round(score),
        matchReasons: reasons,
      };
    });

    // Sort by match score and filter out low scores
    return scoredJobs
      .filter(job => job.matchScore >= 20)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const extractExperience = (level) => {
    const levelMap = {
      'entry': 0,
      'junior': 1,
      'mid': 3,
      'senior': 5,
      'lead': 7,
    };
    return levelMap[level?.toLowerCase()] || 0;
  };

  const checkEducationMatch = (userEd, jobEd) => {
    const levels = ['high school', 'diploma', 'bachelor', 'master', 'phd'];
    const userLevel = levels.findIndex(l => userEd.includes(l));
    const jobLevel = levels.findIndex(l => jobEd.toLowerCase().includes(l));
    return userLevel >= jobLevel;
  };

  const getMatchColor = (score) => {
    if (score >= 70) return '#10b981'; // Excellent - green
    if (score >= 50) return '#3b82f6'; // Good - blue
    if (score >= 30) return '#f59e0b'; // Fair - orange
    return '#6b7280'; // Low - gray
  };

  const getMatchLabel = (score) => {
    if (score >= 70) return 'EXCELLENT MATCH';
    if (score >= 50) return 'GOOD MATCH';
    if (score >= 30) return 'FAIR MATCH';
    return 'POTENTIAL MATCH';
  };

  const renderJobCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => router.push(`/job-details?id=${item._id}`)}
    >
      {/* Match Score Badge */}
      <View style={[styles.matchBadge, { backgroundColor: getMatchColor(item.matchScore) }]}>
        <Text style={styles.matchScore}>{item.matchScore}%</Text>
        <Text style={styles.matchLabel}>{getMatchLabel(item.matchScore)}</Text>
      </View>

      {/* Job Details */}
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.employer && (
          <Text style={styles.companyName} numberOfLines={1}>
            {item.employer.companyName}
          </Text>
        )}
      </View>

      <View style={styles.jobMeta}>
        <Text style={styles.metaText}>📍 {item.location}</Text>
        <Text style={styles.metaText}>💼 {item.employmentType}</Text>
        <Text style={styles.metaText}>⭐ {item.experienceLevel}</Text>
      </View>

      {/* Match Reasons */}
      {item.matchReasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>Why recommended:</Text>
          {item.matchReasons.slice(0, 3).map((reason, index) => (
            <View key={index} style={styles.reasonItem}>
              <Text style={styles.reasonBullet}>•</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills Preview */}
      {item.requiredSkills && item.requiredSkills.length > 0 && (
        <View style={styles.skillsContainer}>
          {item.requiredSkills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {item.requiredSkills.length > 3 && (
            <Text style={styles.moreSkills}>+{item.requiredSkills.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.postedDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/job-details?id=${item._id}`)}
        >
          <Text style={styles.viewButtonText}>View Job</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Analyzing your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Recommendations</Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Personalized for You</Text>
          <Text style={styles.infoText}>
            Jobs matched based on your skills, experience, and preferences
          </Text>
        </View>
      </View>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>No Recommendations Yet</Text>
          <Text style={styles.emptySubtext}>
            Complete your profile with skills and experience to get personalized job recommendations
          </Text>
          <TouchableOpacity
            style={styles.completeProfileButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderJobCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.resultHeader}>
              <Text style={styles.resultText}>
                {recommendations.length} jobs recommended for you
              </Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listContent: {
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  jobHeader: {
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  reasonsContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 6,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  reasonBullet: {
    fontSize: 14,
    color: '#16a34a',
    marginRight: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillTag: {
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
  cardFooter: {
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
  viewButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
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
  completeProfileButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
