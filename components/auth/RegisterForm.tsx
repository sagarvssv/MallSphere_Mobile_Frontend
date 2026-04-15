// components/auth/RegisterForm.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import Input from '../ui/Input';
import { validateEmail, validateUsername, validatePassword } from '../../utils/validators';

interface RegisterFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  onLogin: () => void;
  onGoogleSignUp: () => void;
}

// City data for Dubai and Abu Dhabi
const DUBAI_CITIES = [
  'India',
  'Dubai',
  'Downtown Dubai',
  'Dubai Marina',
  'Jumeirah',
  'Palm Jumeirah',
  'Business Bay',
  'Deira',
  'Bur Dubai',
  'Al Barsha',
  'Jumeirah Lake Towers (JLT)',
  'Dubai Silicon Oasis',
  'Arabian Ranches',
  'Emirates Hills',
  'Dubai Hills Estate',
  'Mirdif',
  'Al Qusais',
];

const ABU_DHABI_CITIES = [
  'Abu Dhabi',
  'Downtown Abu Dhabi',
  'Al Reem Island',
  'Yas Island',
  'Saadiyat Island',
  'Al Maryah Island',
  'Khalifa City',
  'Mohamed Bin Zayed City',
  'Al Raha Beach',
  'Al Shamkha',
  'Masdar City',
  'Al Ain',
  'Al Ghadeer',
  'Al Shahama',
  'Baniyas',
  'Musaffah',
];

const ALL_CITIES = [...DUBAI_CITIES, ...ABU_DHABI_CITIES].sort();

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
  const [selectedCity, setSelectedCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomCitySelected, setIsCustomCitySelected] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Filter cities based on search query
  const filteredCities = ALL_CITIES.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pickImage = async () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission Required', 'Camera permission is needed'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) setProfilePicture(result.assets[0]);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission Required', 'Gallery permission is needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) setProfilePicture(result.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setLocation(city);
    setIsCustomCitySelected(false);
    setCustomCity('');
    setShowCityDropdown(false);
    setSearchQuery('');
    clearError('location');
  };

  const handleOtherCity = () => {
    setIsCustomCitySelected(true);
    setSelectedCity('');
    setLocation('');
    setShowCityDropdown(false);
    setSearchQuery('');
  };

  const handleCustomCityChange = (text: string) => {
    setCustomCity(text);
    setLocation(text);
    if (text.trim()) {
      clearError('location');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    else { const e = validateUsername(username); if (e) newErrors.username = e; }
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else { const e = validatePassword(password); if (e) newErrors.password = e; }
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!location.trim()) newErrors.location = 'Please select or enter your city';
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

  const clearError = (field: string) => setErrors(prev => ({ ...prev, [field]: '' }));

  // Reusable field builder
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
                {/* Camera badge */}
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

              {/* Location Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TouchableOpacity
                  style={[styles.locationButton, errors.location ? styles.inputWrapperError : null]}
                  onPress={() => setShowCityDropdown(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.inputIcon}>
                    <Ionicons name="location-outline" size={18} color="#AEAEB2" />
                  </View>
                  <Text style={[styles.locationText, !location && styles.locationPlaceholder]}>
                    {location || 'Select or enter your city'}
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

              {/* Custom city input (shown when "Other" is selected) */}
              {isCustomCitySelected && (
                <View style={styles.customCityContainer}>
                  <View style={[styles.inputWrapper, errors.location ? styles.inputWrapperError : null]}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="create-outline" size={18} color="#AEAEB2" />
                    </View>
                    <Input
                      placeholder="Enter your city name"
                      value={customCity}
                      onChangeText={handleCustomCityChange}
                      style={styles.input}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              {/* Submit */}
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

              {/* Google */}
              <TouchableOpacity
                style={[styles.googleButton, loading && styles.googleButtonDisabled]}
                onPress={onGoogleSignUp}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
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

      {/* City Selection Modal */}
      <Modal
        visible={showCityDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setShowCityDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <MaterialIcons name="search" size={20} color="#AEAEB2" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#AEAEB2"
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="cancel" size={18} color="#AEAEB2" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => handleCitySelect(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#1C1C1E" />
                  <Text style={styles.cityName}>{item}</Text>
                  {selectedCity === item && (
                    <MaterialIcons name="check" size={20} color="#27AE60" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No cities found</Text>
                </View>
              )}
            />

            {/* Other Option */}
            <TouchableOpacity
              style={styles.otherOption}
              onPress={handleOtherCity}
            >
              <MaterialIcons name="add-location" size={20} color="#1C1C1E" />
              <Text style={styles.otherOptionText}>Other (Enter custom city)</Text>
            </TouchableOpacity>
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

  // ─── Avatar ───────────────────────────────────────────────────────────────────
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

  // ─── Form ─────────────────────────────────────────────────────────────────────
  form: { gap: 14 },

  // ─── Fields ───────────────────────────────────────────────────────────────────
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

  // ─── Password strength ────────────────────────────────────────────────────────
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

  // ─── Location Field ───────────────────────────────────────────────────────────
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
  customCityContainer: {
    marginTop: -4,
  },

  // ─── Submit ───────────────────────────────────────────────────────────────────
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

  // ─── Divider ──────────────────────────────────────────────────────────────────
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  dividerText: { fontSize: 12, color: '#AEAEB2' },

  // ─── Google ───────────────────────────────────────────────────────────────────
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingVertical: 15,
    gap: 10,
  },
  googleButtonDisabled: { opacity: 0.5 },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleButtonText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },

  // ─── Footer ───────────────────────────────────────────────────────────────────
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

  // ─── Modal Styles ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: '#1C1C1E',
    paddingVertical: 4,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cityName: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#AEAEB2',
  },
  otherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F8F8F8',
  },
  otherOptionText: {
    fontSize: 15,
    color: '#1C1C1E',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default RegisterForm;