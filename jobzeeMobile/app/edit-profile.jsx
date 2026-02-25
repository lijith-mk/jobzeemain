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
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, employer, userType, updateUser, updateEmployer } = useAuth();
  
  const profileData = userType === 'user' ? user : employer;
  
  const [formData, setFormData] = useState({
    name: profileData?.name || profileData?.companyName || '',
    email: profileData?.email || '',
    phone: profileData?.phone || '',
    location: profileData?.location || '',
    bio: profileData?.bio || profileData?.description || '',
    skills: profileData?.skills?.join(', ') || '',
    experience: profileData?.experience || '',
    education: profileData?.education || '',
    website: profileData?.website || '',
    linkedin: profileData?.linkedin || '',
    github: profileData?.github || '',
  });
  
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Required', 'Email is required');
      return;
    }

    setSaving(true);
    try {
      const endpoint = userType === 'user' 
        ? '/auth/profile' 
        : '/employers/profile';
      
      const dataToSend = {
        ...(userType === 'user' ? {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          location: formData.location.trim(),
          bio: formData.bio.trim(),
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          experience: formData.experience.trim(),
          education: formData.education.trim(),
          linkedin: formData.linkedin.trim(),
          github: formData.github.trim(),
        } : {
          companyName: formData.name.trim(),
          phone: formData.phone.trim(),
          location: formData.location.trim(),
          description: formData.bio.trim(),
          website: formData.website.trim(),
        }),
      };

      const response = await api.put(endpoint, dataToSend);
      
      // Update context
      if (userType === 'user') {
        await updateUser(response.data.user || response.data);
      } else {
        await updateEmployer(response.data.employer || response.data);
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>
          Update your information
        </Text>

        {/* Name/Company Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {userType === 'user' ? 'Full Name' : 'Company Name'} *
          </Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder={userType === 'user' ? 'Enter your name' : 'Enter company name'}
          />
        </View>

        {/* Email (read-only) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, styles.readOnly]}
            value={formData.email}
            editable={false}
          />
          <Text style={styles.hint}>Email cannot be changed</Text>
        </View>

        {/* Phone */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(value) => handleChange('location', value)}
            placeholder="City, Country"
          />
        </View>

        {/* Bio/Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {userType === 'user' ? 'Bio' : 'Company Description'}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(value) => handleChange('bio', value)}
            placeholder={userType === 'user' ? 'Tell us about yourself' : 'Describe your company'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* User-specific fields */}
        {userType === 'user' && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Skills</Text>
              <TextInput
                style={styles.input}
                value={formData.skills}
                onChangeText={(value) => handleChange('skills', value)}
                placeholder="JavaScript, React, Node.js (comma-separated)"
              />
              <Text style={styles.hint}>Separate skills with commas</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Experience</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.experience}
                onChangeText={(value) => handleChange('experience', value)}
                placeholder="Your work experience"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Education</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.education}
                onChangeText={(value) => handleChange('education', value)}
                placeholder="Your educational background"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>LinkedIn</Text>
              <TextInput
                style={styles.input}
                value={formData.linkedin}
                onChangeText={(value) => handleChange('linkedin', value)}
                placeholder="https://linkedin.com/in/username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>GitHub</Text>
              <TextInput
                style={styles.input}
                value={formData.github}
                onChangeText={(value) => handleChange('github', value)}
                placeholder="https://github.com/username"
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {/* Employer-specific fields */}
        {userType === 'employer' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(value) => handleChange('website', value)}
              placeholder="https://yourcompany.com"
              autoCapitalize="none"
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    padding: 20,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  readOnly: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
