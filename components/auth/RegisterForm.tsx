import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { validateEmail, validatePassword, validateUsername } from '../../utils/validators';
import Input from '../ui/Input';

// Only these 4 locations
const LOCATIONS = ['Dubai', 'Abu Dhabi', 'Hyderabad', 'Bangalore'];

interface RegisterFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  onLogin: () => void;
  onGoogleSignUp: (userInfo: { idToken: string; email: string; name: string; picture: string }) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading,
  onLogin,
  onGoogleSignUp,
}) => {
  const [profilePicture, setProfilePicture] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Location states
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Initialize Google Sign-In
  const { promptAsync, isReady: isGoogleReady } = useGoogleAuth(async (userInfo) => {
    setIsGoogleLoading(true);
    try {
      // Pass complete user info to parent
      await onGoogleSignUp({
        idToken: userInfo.id_token,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      });
    } catch (error) {
      console.error('Google sign up error:', error);
      // Error is already handled in parent
    } finally {
      setIsGoogleLoading(false);
    }
  });

  const pickImage = async () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { 
            Alert.alert('Permission Required', 'Camera permission is needed'); 
            return; 
          }
          const result = await ImagePicker.launchCameraAsync({ 
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.8 
          });
          if (!result.canceled) setProfilePicture(result.assets[0]);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { 
            Alert.alert('Permission Required', 'Gallery permission is needed'); 
            return; 
          }
          const result = await ImagePicker.launchImageLibraryAsync({ 
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true, 
            aspect: [1, 1], 
            quality: 0.8 
          });
          if (!result.canceled) setProfilePicture(result.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowLocationDropdown(false);
    clearError('location');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    else { 
      const e = validateUsername(username); 
      if (e) newErrors.username = e; 
    }
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else { 
      const e = validatePassword(password); 
      if (e) newErrors.password = e; 
    }
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!location.trim()) newErrors.location = 'Please select your city';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    await onSubmit({ 
      username: username.trim(), 
      email: email.trim().toLowerCase(), 
      password, 
      profilePicture,
      location: location.trim()
    });
  };

  const handleGooglePress = async () => {
    if (!isGoogleReady) {
      Alert.alert('Not Ready', 'Google Sign-In is initializing. Please try again.');
      return;
    }
    
    if (isGoogleLoading || loading) return;
    
    const result = await promptAsync();
    if (result.type === 'error') {
      Alert.alert('Error', result.error || 'Google Sign-In failed. Please try again.');
    }
  };

  const clearError = (field: string) => setErrors(prev => ({ ...prev, [field]: '' }));

  // Reusable field renderer
  const renderField = ({
    label,
    placeholder,
    value,
    onChangeText,
    errorKey,
    icon,
    keyboardType,
    returnKeyType,
    onSubmitEditing,
    inputRef,
    secureTextEntry,
    showToggle,
    showState,
    onToggleShow,
  }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrapper, errors[errorKey] ? styles.inputWrapperError : null]}>
        <View style={styles.inputIcon}>{icon}</View>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChangeText={(t: string) => { onChangeText(t); clearError(errorKey); }}
          keyboardType={keyboardType}
          autoCapitalize="none"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secureTextEntry && !showState}
          style={styles.input}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={showState ? 'eye' : 'eye-off'} size={17} color="#AEAEB2" />
          </TouchableOpacity>
        )}
      </View>
      {errors[errorKey] ? (
        <View style={styles.fieldError}>
          <MaterialIcons name="error-outline" size={12} color="#C0392B" />
          <Text style={styles.fieldErrorText}>{errors[errorKey]}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>

            {/* Avatar picker */}
            <TouchableOpacity style={styles.avatarArea} onPress={pickImage} activeOpacity={0.85}>
              <View style={styles.avatarRing}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture.uri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="add-a-photo" size={26} color="#AEAEB2" />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <MaterialIcons name="photo-camera" size={13} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.avatarLabel}>
                {profilePicture ? 'Change Photo' : 'Add Profile Photo'}
              </Text>
              <Text style={styles.avatarSublabel}>Optional</Text>
            </TouchableOpacity>

            {/* Form fields */}
            <View style={styles.form}>
              {renderField({
                label: 'Username',
                placeholder: 'Choose a username',
                value: username,
                onChangeText: setUsername,
                errorKey: 'username',
                icon: <Ionicons name="person-outline" size={18} color="#AEAEB2" />,
                returnKeyType: 'next',
                onSubmitEditing: () => emailRef.current?.focus(),
              })}

              {renderField({
                label: 'Email Address',
                placeholder: 'you@example.com',
                value: email,
                onChangeText: setEmail,
                errorKey: 'email',
                icon: <MaterialIcons name="email" size={18} color="#AEAEB2" />,
                keyboardType: 'email-address',
                returnKeyType: 'next',
                inputRef: emailRef,
                onSubmitEditing: () => passwordRef.current?.focus(),
              })}

              {renderField({
                label: 'Password',
                placeholder: 'Create a secure password',
                value: password,
                onChangeText: setPassword,
                errorKey: 'password',
                icon: <MaterialIcons name="lock-outline" size={18} color="#AEAEB2" />,
                returnKeyType: 'next',
                inputRef: passwordRef,
                onSubmitEditing: () => confirmPasswordRef.current?.focus(),
                secureTextEntry: true,
                showToggle: true,
                showState: showPassword,
                onToggleShow: () => setShowPassword(!showPassword),
              })}

              {/* Password strength indicator */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((level) => {
                    const score = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
                    const active = level <= score;
                    const color = score <= 1 ? '#E74C3C' : score === 2 ? '#E67E22' : score === 3 ? '#F1C40F' : '#27AE60';
                    return <View key={level} style={[styles.strengthBar, active && { backgroundColor: color }]} />;
                  })}
                  <Text style={styles.strengthLabel}>
                    {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : password.length >= 6 ? 'Fair' : 'Weak'}
                  </Text>
                </View>
              )}

              {renderField({
                label: 'Confirm Password',
                placeholder: 'Re-enter your password',
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                errorKey: 'confirmPassword',
                icon: <MaterialIcons name="lock" size={18} color="#AEAEB2" />,
                returnKeyType: 'done',
                inputRef: confirmPasswordRef,
                onSubmitEditing: handleSubmit,
                secureTextEntry: true,
                showToggle: true,
                showState: showConfirmPassword,
                onToggleShow: () => setShowConfirmPassword(!showConfirmPassword),
              })}

              {/* Location Field - Simple dropdown with 4 options */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TouchableOpacity
                  style={[styles.locationButton, errors.location ? styles.inputWrapperError : null]}
                  onPress={() => setShowLocationDropdown(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.inputIcon}>
                    <Ionicons name="location-outline" size={18} color="#AEAEB2" />
                  </View>
                  <Text style={[styles.locationText, !location && styles.locationPlaceholder]}>
                    {location || 'Select your city'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#AEAEB2" />
                </TouchableOpacity>
                {errors.location ? (
                  <View style={styles.fieldError}>
                    <MaterialIcons name="error-outline" size={12} color="#C0392B" />
                    <Text style={styles.fieldErrorText}>{errors.location}</Text>
                  </View>
                ) : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </Text>
                {!loading && (
                  <View style={styles.submitArrow}>
                    <MaterialIcons name="arrow-forward" size={18} color="#1C1C1E" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign Up Button */}
              <TouchableOpacity
                style={[styles.googleButton, (loading || isGoogleLoading) && styles.googleButtonDisabled]}
                onPress={handleGooglePress}
                disabled={loading || isGoogleLoading}
                activeOpacity={0.88}
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>
                  {isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}
                </Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={onLogin} disabled={loading} activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Location Selection Modal - Only 4 options */}
      <Modal
        visible={showLocationDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setShowLocationDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LOCATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#1C1C1E" />
                  <Text style={styles.cityName}>{item}</Text>
                  {location === item && (
                    <MaterialIcons name="check" size={20} color="#27AE60" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },
  inner: { flex: 1, gap: 20 },

  // Avatar styles
  avatarArea: { alignItems: 'center', paddingVertical: 8 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  avatarSublabel: { fontSize: 11, color: '#AEAEB2', marginTop: 2 },

  // Form styles
  form: { gap: 14 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', letterSpacing: 0.1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputWrapperError: { borderColor: '#FCCACA', backgroundColor: '#FFFAFA' },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  eyeButton: { padding: 4 },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -2 },
  fieldErrorText: { fontSize: 11, color: '#C0392B', fontWeight: '500' },

  // Password strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -6,
    paddingHorizontal: 2,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F0F0F0',
  },
  strengthLabel: { fontSize: 11, color: '#8A8A8E', fontWeight: '500', marginLeft: 4 },

  // Location field
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  locationPlaceholder: {
    color: '#AEAEB2',
  },

  // Submit button
  submitButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 10,
  },
  submitButtonDisabled: { backgroundColor: '#C8C8C8' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  submitArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  dividerText: { fontSize: 12, color: '#AEAEB2' },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 12,
  },
  googleButtonDisabled: { opacity: 0.5 },
  googleButtonText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
    gap: 2,
  },
  footerText: { fontSize: 14, color: '#8A8A8E' },
  footerLink: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: '#DCDCDC',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  checkIcon: {
    marginLeft: 8,
  },
});

export default RegisterForm;