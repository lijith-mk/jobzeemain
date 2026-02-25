import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Employer fields
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    address: '',
    city: '',
    state: '',
    country: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (userType === 'user') {
      if (!formData.name || !formData.email || !formData.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    } else {
      // Employer validation - match backend requirements
      if (!formData.companyName || !formData.companyEmail || !formData.companyPhone || 
          !formData.password || !formData.contactPersonName || !formData.contactPersonTitle ||
          !formData.contactPersonEmail || !formData.contactPersonPhone || !formData.industry ||
          !formData.companySize || !formData.foundedYear || !formData.address || 
          !formData.city || !formData.state || !formData.country) {
        Alert.alert('Error', 'Please fill in all required fields marked with *');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Password strength validation for employer (backend requirement)
    if (userType === 'employer') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        Alert.alert('Error', 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
        return;
      }
    } else if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = userType === 'user'
        ? {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }
        : {
            companyName: formData.companyName,
            companyEmail: formData.companyEmail,
            companyPhone: formData.companyPhone,
            password: formData.password,
            contactPersonName: formData.contactPersonName,
            contactPersonTitle: formData.contactPersonTitle,
            contactPersonEmail: formData.contactPersonEmail,
            contactPersonPhone: formData.contactPersonPhone,
            industry: formData.industry,
            companySize: formData.companySize,
            foundedYear: parseInt(formData.foundedYear),
            headquarters: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              country: formData.country,
            },
            website: formData.website,
          };

      await register(data, userType);
      Alert.alert('Success', 'Registration successful!');
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join JobZee today</Text>
        </View>

        {/* User Type Selector */}
        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'user' && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType('user')}
          >
            <Text
              style={[
                styles.userTypeText,
                userType === 'user' && styles.userTypeTextActive,
              ]}
            >
              Job Seeker
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === 'employer' && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType('employer')}
          >
            <Text
              style={[
                styles.userTypeText,
                userType === 'employer' && styles.userTypeTextActive,
              ]}
            >
              Employer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {userType === 'user' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          ) : (
            <>
              {/* Company Information */}
              <Text style={styles.sectionTitle}>Company Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="company@example.com"
                  value={formData.companyEmail}
                  onChangeText={(text) => setFormData({ ...formData, companyEmail: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  value={formData.companyPhone}
                  onChangeText={(text) => setFormData({ ...formData, companyPhone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Industry *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Technology, Healthcare"
                  value={formData.industry}
                  onChangeText={(text) => setFormData({ ...formData, industry: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Company Size *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+"
                  value={formData.companySize}
                  onChangeText={(text) => setFormData({ ...formData, companySize: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Founded Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY (e.g., 2020)"
                  value={formData.foundedYear}
                  onChangeText={(text) => setFormData({ ...formData, foundedYear: text })}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://company.com (optional)"
                  value={formData.website}
                  onChangeText={(text) => setFormData({ ...formData, website: text })}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Contact Person Information */}
              <Text style={styles.sectionTitle}>Contact Person</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Person Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  value={formData.contactPersonName}
                  onChangeText={(text) => setFormData({ ...formData, contactPersonName: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Person Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., HR Manager, CEO"
                  value={formData.contactPersonTitle}
                  onChangeText={(text) => setFormData({ ...formData, contactPersonTitle: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Person Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="contact@example.com"
                  value={formData.contactPersonEmail}
                  onChangeText={(text) => setFormData({ ...formData, contactPersonEmail: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Person Phone *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  value={formData.contactPersonPhone}
                  onChangeText={(text) => setFormData({ ...formData, contactPersonPhone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Headquarters Information */}
              <Text style={styles.sectionTitle}>Headquarters</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State/Province"
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder={userType === 'employer' 
                ? "Min 8 chars (uppercase, lowercase, number, special)" 
                : "Create a password (min 6 characters)"}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoComplete="password-new"
            />
            {userType === 'employer' && (
              <Text style={styles.helperText}>
                Must include uppercase, lowercase, number, and special character (@$!%*?&)
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  userTypeButtonActive: {
    backgroundColor: '#fff',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  userTypeTextActive: {
    color: '#2563eb',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 16,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
});
