import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../constants/config';

export default function PostJobScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    locationType: 'on-site',
    employmentType: 'full-time',
    experienceLevel: 'entry',
    salaryMin: '',
    salaryMax: '',
    skills: '',
  });

  const handlePost = async () => {
    if (!formData.title || !formData.description || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
        location: formData.location,
        locationType: formData.locationType,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      };

      if (formData.salaryMin && formData.salaryMax) {
        jobData.salary = {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: 'INR',
        };
      }

      await api.post(API_ENDPOINTS.JOBS.CREATE, jobData);
      
      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setFormData({
            title: '',
            description: '',
            requirements: '',
            responsibilities: '',
            location: '',
            locationType: 'on-site',
            employmentType: 'full-time',
            experienceLevel: 'entry',
            salaryMin: '',
            salaryMax: '',
            skills: '',
          });
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior Software Engineer"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        {/* Location */}
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bangalore, India"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
        />

        {/* Location Type */}
        <Text style={styles.label}>Location Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.locationType}
            onValueChange={(value) => setFormData({ ...formData, locationType: value })}
          >
            <Picker.Item label="On-site" value="on-site" />
            <Picker.Item label="Remote" value="remote" />
            <Picker.Item label="Hybrid" value="hybrid" />
          </Picker>
        </View>

        {/* Employment Type */}
        <Text style={styles.label}>Employment Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.employmentType}
            onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
          >
            <Picker.Item label="Full-time" value="full-time" />
            <Picker.Item label="Part-time" value="part-time" />
            <Picker.Item label="Contract" value="contract" />
            <Picker.Item label="Internship" value="internship" />
          </Picker>
        </View>

        {/* Experience Level */}
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.experienceLevel}
            onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
          >
            <Picker.Item label="Entry Level" value="entry" />
            <Picker.Item label="Mid Level" value="mid" />
            <Picker.Item label="Senior Level" value="senior" />
            <Picker.Item label="Lead" value="lead" />
          </Picker>
        </View>

        {/* Salary Range */}
        <Text style={styles.label}>Salary Range (₹/year)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Min"
            keyboardType="numeric"
            value={formData.salaryMin}
            onChangeText={(text) => setFormData({ ...formData, salaryMin: text })}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Max"
            keyboardType="numeric"
            value={formData.salaryMax}
            onChangeText={(text) => setFormData({ ...formData, salaryMax: text })}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Job Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the role..."
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
        />

        {/* Requirements */}
        <Text style={styles.label}>Requirements (one per line)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="- Bachelor's degree in CS\n- 3+ years experience\n- Knowledge of React"
          multiline
          numberOfLines={4}
          value={formData.requirements}
          onChangeText={(text) => setFormData({ ...formData, requirements: text })}
        />

        {/* Responsibilities */}
        <Text style={styles.label}>Responsibilities (one per line)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="- Develop new features\n- Code reviews\n- Mentor junior developers"
          multiline
          numberOfLines={4}
          value={formData.responsibilities}
          onChangeText={(text) => setFormData({ ...formData, responsibilities: text })}
        />

        {/* Skills */}
        <Text style={styles.label}>Required Skills (comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="React, Node.js, MongoDB, AWS"
          value={formData.skills}
          onChangeText={(text) => setFormData({ ...formData, skills: text })}
        />

        {/* Post Button */}
        <TouchableOpacity
          style={[styles.postButton, loading && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
