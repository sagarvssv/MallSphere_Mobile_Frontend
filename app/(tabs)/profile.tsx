// app/(tabs)/profile.tsx - Stats section removed

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

// ─── Inline profile fetch — no external hook, no import chain risk ────────────
const USER_PROFILE_URL =
  'https://mallsperebackend-psbx.onrender.com/api/auth/user-profile';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const res = await fetch(USER_PROFILE_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const text = await res.text();
  if (text.trimStart().startsWith('<')) throw new Error('Server unavailable');
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data.data ?? data;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout, changePassword, isLoading: authLoading } = useAuth();

  // Profile state — fetched from API
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Edit fields
  const [editing, setEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(
    user?.profilePicture
  );
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ─── Fetch profile on mount ─────────────────────────────────────────────────

  useEffect(() => {
    setProfileLoading(true);
    fetchUserProfile()
      .then(p => {
        console.log('Profile fetched:', p);
        setProfile(p);
        setUsername(p.username ?? user?.username ?? '');
        setEmail(p.email ?? user?.email ?? '');
        if (!profilePicture && p.profilePicture) setProfilePicture(p.profilePicture);
      })
      .catch((error) => {
        console.error('Profile fetch error:', error);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  // ─── Image picker ───────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setProfilePicture(result.assets[0].uri);
  };

  // ─── Save profile ───────────────────────────────────────────────────────────

  const handleSaveProfile = useCallback(() => {
    Alert.alert('Success', 'Profile updated successfully');
    setEditing(false);
  }, [username, email, profilePicture]);

  // ─── Change password ────────────────────────────────────────────────────────

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // useAuth already shows the error alert
    } finally {
      setPasswordLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, changePassword]);

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  // ─── Derived display values ─────────────────────────────────────────────────

  const displayName = profile?.username || user?.username || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarUri = profilePicture || profile?.profilePicture || user?.profilePicture;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={editing ? pickImage : undefined}
            activeOpacity={editing ? 0.7 : 1}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>{avatarLetter}</Text>
              </View>
            )}
            {editing && (
              <View style={styles.cameraOverlay}>
                <MaterialIcons name="photo-camera" size={20} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>

          {profileLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{displayEmail}</Text>
            </>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(prev => !prev)}
          >
            <Text style={styles.editButtonText}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Form */}
        {editing && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Save Changes"
              onPress={handleSaveProfile}
              style={styles.saveButton}
              disabled={authLoading}
            />
          </View>
        )}

        {/* Change Password */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry
          />
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password (min. 8 chars)"
            secureTextEntry
          />
          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
          />
          <Button
            title={passwordLoading ? 'Changing...' : 'Change Password'}
            onPress={handleChangePassword}
            style={styles.saveButton}
            disabled={passwordLoading}
          />
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={24} color={Colors.text} />
            <Text style={styles.settingText}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="help" size={24} color={Colors.text} />
            <Text style={styles.settingText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  profileHeader: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    backgroundColor: Colors.white 
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 16 
  },
  profileImagePlaceholder: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    backgroundColor: Colors.primary, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginBottom: 16,
  },
  profileImageText: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: Colors.white 
  },
  cameraOverlay: {
    position: 'absolute', 
    bottom: 16, 
    right: 0,
    backgroundColor: Colors.primary, 
    borderRadius: 12, 
    padding: 4,
  },
  profileName: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 4 
  },
  profileEmail: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    marginBottom: 16 
  },
  editButton: {
    paddingHorizontal: 24, 
    paddingVertical: 8,
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: Colors.primary,
  },
  editButtonText: { 
    color: Colors.primary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  formSection: { 
    backgroundColor: Colors.white, 
    padding: 16, 
    marginTop: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 16 
  },
  saveButton: { 
    marginTop: 16 
  },
  settingsSection: { 
    backgroundColor: Colors.white, 
    marginTop: 16 
  },
  settingItem: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border,
  },
  settingText: { 
    flex: 1, 
    fontSize: 16, 
    color: Colors.text, 
    marginLeft: 16 
  },
  logoutButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: Colors.white, 
    padding: 16, 
    marginTop: 16, 
    marginBottom: 32,
  },
  logoutText: { 
    color: Colors.error, 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
});