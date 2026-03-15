import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function ProfileCompletion() {
  const { user } = useAuth();

  const calculateCompletion = () => {
    const checks = [
      { key: 'basic', label: 'Basic Info', check: () => user?.name && user?.email && user?.phone, points: 10 },
      { key: 'resume', label: 'Resume Uploaded', check: () => user?.resume, points: 15 },
      { key: 'skills', label: 'Skills Added', check: () => user?.skills && user.skills.length >= 3, points: 15 },
      { key: 'experience', label: 'Experience Level', check: () => user?.experience !== undefined && user?.experience !== null, points: 10 },
      { key: 'education', label: 'Education Details', check: () => user?.education?.level, points: 10 },
      { key: 'bio', label: 'Professional Bio', check: () => user?.bio && user.bio.length >= 50, points: 10 },
      { key: 'location', label: 'Location Set', check: () => user?.location, points: 5 },
      { key: 'preferences', label: 'Job Preferences', check: () => user?.preferredLocations && user.preferredLocations.length > 0, points: 10 },
      { key: 'linkedin', label: 'LinkedIn Profile', check: () => user?.linkedIn, points: 5 },
      { key: 'portfolio', label: 'Portfolio Link', check: () => user?.portfolio, points: 5 },
      { key: 'certificates', label: 'Certificates Earned', check: () => user?.certificates && user.certificates.length > 0, points: 5 },
    ];

    const completed = checks.filter(item => item.check());
    const totalPoints = checks.reduce((sum, item) => sum + item.points, 0);
    const earnedPoints = completed.reduce((sum, item) => sum + item.points, 0);
    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    return {
      checks,
      completed,
      percentage,
      earnedPoints,
      totalPoints,
    };
  };

  const completion = calculateCompletion();

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getCompletionMessage = (percentage) => {
    if (percentage >= 90) return 'Outstanding! Your profile is comprehensive';
    if (percentage >= 70) return 'Great job! Just a few more details';
    if (percentage >= 50) return 'Good start! Keep building your profile';
    if (percentage >= 30) return 'Getting there! Add more details';
    return 'Let\'s complete your profile';
  };

  const getActionForCheck = (checkData) => {
    const actions = {
      basic: () => router.push('/edit-profile'),
      resume: () => router.push('/resume-management'),
      skills: () => router.push('/edit-profile'),
      experience: () => router.push('/edit-profile'),
      education: () => router.push('/edit-profile'),
      bio: () => router.push('/edit-profile'),
      location: () => router.push('/edit-profile'),
      preferences: () => router.push('/edit-profile'),
      linkedin: () => router.push('/edit-profile'),
      portfolio: () => router.push('/edit-profile'),
      certificates: () => router.push('/courses'),
    };

    return actions[checkData.key] || (() => router.push('/edit-profile'));
  };

  const renderCheckItem = (checkData) => {
    const isComplete = checkData.check();
    
    return (
      <TouchableOpacity
        key={checkData.key}
        style={[
          styles.checkItem,
          isComplete && styles.checkItemComplete,
        ]}
        onPress={getActionForCheck(checkData)}
      >
        <View style={styles.checkLeft}>
          <View style={[
            styles.checkbox,
            isComplete && styles.checkboxComplete,
          ]}>
            {isComplete && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkContent}>
            <Text style={[
              styles.checkLabel,
              isComplete && styles.checkLabelComplete,
            ]}>
              {checkData.label}
            </Text>
            {!isComplete && (
              <Text style={styles.checkHint}>
                Tap to {checkData.key === 'certificates' ? 'browse courses' : 'complete'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{checkData.points}pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Completion</Text>
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircleContainer}>
          <View style={[
            styles.scoreCircle,
            { borderColor: getCompletionColor(completion.percentage) }
          ]}>
            <Text style={[
              styles.scorePercent,
              { color: getCompletionColor(completion.percentage) }
            ]}>
              {completion.percentage}%
            </Text>
            <Text style={styles.scoreLabel}>Complete</Text>
          </View>
        </View>
        
        <Text style={styles.scoreMessage}>
          {getCompletionMessage(completion.percentage)}
        </Text>
        
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsText}>
            {completion.earnedPoints} / {completion.totalPoints} points earned
          </Text>
        </View>
      </View>

      {/* Benefits Banner */}
      <View style={styles.benefitsBanner}>
        <Text style={styles.benefitsIcon}>🎯</Text>
        <View style={styles.benefitsContent}>
          <Text style={styles.benefitsTitle}>Why Complete Your Profile?</Text>
          <Text style={styles.benefitsText}>
            • Increase relevant job visibility{'\n'}
            • Increase visibility to employers{'\n'}
            • Stand out from other candidates{'\n'}
            • Unlock advanced features
          </Text>
        </View>
      </View>

      {/* Completion Checklist */}
      <View style={styles.checklistContainer}>
        <Text style={styles.sectionTitle}>
          Completion Checklist ({completion.completed.length}/{completion.checks.length})
        </Text>
        
        {completion.checks.map(checkData => renderCheckItem(checkData))}
      </View>

      {/* Action Button */}
      {completion.percentage < 100 && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.actionButtonText}>
            Complete Your Profile Now
          </Text>
        </TouchableOpacity>
      )}

      {completion.percentage === 100 && (
        <View style={styles.congratsCard}>
          <Text style={styles.congratsIcon}>🎉</Text>
          <Text style={styles.congratsTitle}>Profile Complete!</Text>
          <Text style={styles.congratsText}>
            Your profile is 100% complete. You're all set to find your next opportunity!
          </Text>
        </View>
      )}
    </ScrollView>
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
  scoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCircleContainer: {
    marginBottom: 16,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scorePercent: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsInfo: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  benefitsBanner: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  benefitsIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  benefitsContent: {
    flex: 1,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  benefitsText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  checklistContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  checkItemComplete: {
    backgroundColor: '#f0fdf4',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxComplete: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkContent: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  checkLabelComplete: {
    color: '#166534',
  },
  checkHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  congratsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  congratsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  congratsText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
