import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { waitForServer } from '../../services/auth';
import LoginForm from '../../components/auth/LoginForm';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { useGoogleAuth } from '../../hooks/useGoogle';

export default function LoginScreen() {
  const router = useRouter();
  const {
    login,
    googleLogin,
    isLoading,
    user,
    isAuthenticated,
    clearError,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const [serverWaking, setServerWaking] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace({
        pathname: '/(tabs)',
        params: {
          user: JSON.stringify(user),
          username: user.username || '',
          email: user.email || '',
          profilePicture: user.profilePicture || '',
        },
      });
    }
  }, [isAuthenticated, user]);

  const handleLogin = async (email: string, password: string) => {
    try {
      clearError();
      await login(email, password);
    } catch (err: any) {
      const message: string = err.message ?? '';
      const isWaking =
        message.includes('starting up') ||
        message.includes('unavailable') ||
        message.includes('Unexpected server response') ||
        message.includes('502') ||
        message.includes('503');

      if (isWaking) {
        setServerWaking(true);
        try {
          await waitForServer();
          setServerWaking(false);
          await login(email, password);
        } catch {
          setServerWaking(false);
          Alert.alert('Server Unavailable', 'The server is taking too long. Please try again.');
        }
      }
      throw err;
    }
  };

  const handleGoogleLogin = async (userInfo: any) => {
    setGoogleLoading(true);
    try {
      await googleLogin({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.id,
        idToken: userInfo.id_token,
      });
    } catch (error: any) {
      Alert.alert(
        'Google Sign In Failed',
        error.message || 'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const { promptAsync, isLoading: googleAuthLoading } = useGoogleAuth(handleGoogleLogin);

  const openForgotPassword = () => {
    setForgotPasswordModal(true);
    setResetStep('email');
    setResetEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeForgotPasswordModal = () => {
    setForgotPasswordModal(false);
    setResetStep('email');
    setResetEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendResetOtp = async () => {
    if (!resetEmail.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) { Alert.alert('Error', 'Please enter a valid email'); return; }
    try {
      setResetLoading(true);
      await forgotPassword(resetEmail);
      setResetStep('otp');
    } finally { setResetLoading(false); }
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) { Alert.alert('Error', 'Please enter the 6-digit OTP'); return; }
    setResetStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    try {
      setResetLoading(true);
      await resetPassword(resetEmail, otp, newPassword, confirmPassword);
      closeForgotPasswordModal();
    } finally { setResetLoading(false); }
  };

  const handleResendOtp = async () => {
    try {
      setResetLoading(true);
      await forgotPassword(resetEmail);
      Alert.alert('OTP Resent', 'A new OTP has been sent to your email.');
    } finally { setResetLoading(false); }
  };

  const renderForgotPasswordModal = () => (
    <Modal
      visible={forgotPasswordModal}
      animationType="slide"
      transparent
      onRequestClose={closeForgotPasswordModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {resetStep === 'email' && 'Forgot Password'}
              {resetStep === 'otp' && 'Verify OTP'}
              {resetStep === 'newPassword' && 'Reset Password'}
            </Text>
            <TouchableOpacity onPress={closeForgotPasswordModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {resetStep === 'email' && (
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Enter your email and we'll send an OTP to reset your password.
              </Text>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                style={styles.modalInput}
              />
              <Button
                title={resetLoading ? 'Sending…' : 'Send OTP'}
                onPress={handleSendResetOtp}
                loading={resetLoading}
                disabled={resetLoading || !resetEmail.trim()}
                style={styles.modalButton}
              />
            </View>
          )}

          {resetStep === 'otp' && (
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>Enter the 6-digit OTP sent to:</Text>
              <Text style={styles.emailText}>{resetEmail}</Text>
              <Input
                label="OTP Code"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.modalInput}
              />
              <Button
                title="Verify OTP"
                onPress={handleVerifyOtp}
                disabled={otp.length !== 6}
                style={styles.modalButton}
              />
              <TouchableOpacity style={styles.resendLink} onPress={handleResendOtp} disabled={resetLoading}>
                <Text style={[styles.resendLinkText, resetLoading && styles.disabledText]}>
                  Didn't receive code? Resend OTP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => setResetStep('email')} disabled={resetLoading}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {resetStep === 'newPassword' && (
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>Create a new password for your account.</Text>
              <View style={styles.passwordContainer}>
                <Input
                  label="New Password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoFocus
                  style={styles.modalInput}
                />
                <TouchableOpacity style={styles.passwordEyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
                  <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <Input
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.modalInput}
                />
                <TouchableOpacity style={styles.passwordEyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Button
                title={resetLoading ? 'Resetting…' : 'Reset Password'}
                onPress={handleResetPassword}
                loading={resetLoading}
                disabled={resetLoading || !newPassword || !confirmPassword}
                style={styles.modalButton}
              />
              <TouchableOpacity style={styles.backLink} onPress={() => setResetStep('otp')} disabled={resetLoading}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <View style={styles.logoWrap}>
              <MaterialIcons name="local-mall" size={36} color={Colors.white} />
            </View>
            <Text style={styles.brandName}>MallSphere</Text>
            <Text style={styles.brandTagline}>Discover deals near you</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {serverWaking && (
              <View style={styles.wakingBanner}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.wakingText}>Server is waking up…</Text>
              </View>
            )}

            <LoginForm
              onSubmit={handleLogin}
              loading={isLoading || serverWaking}
              onForgotPassword={openForgotPassword}
              onRegister={() => router.push('/(auth)/register')}
              onGoogleLogin={() => promptAsync()}
              googleLoading={googleLoading || googleAuthLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderForgotPasswordModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 0.3,
  },
  brandTagline: {
    fontSize: 14,
    color: '#8A8A8E',
    marginTop: 4,
    fontWeight: '400',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8A8A8E',
    marginBottom: 24,
  },
  wakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  wakingText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalBody: { gap: 16 },
  modalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  modalInput: { marginBottom: 4 },
  modalButton: { marginTop: 4 },
  resendLink: { alignSelf: 'center', paddingVertical: 8 },
  resendLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  disabledText: { color: Colors.textSecondary },
  backLink: { alignSelf: 'center', paddingVertical: 8 },
  backLinkText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  passwordContainer: { position: 'relative' },
  passwordEyeIcon: { position: 'absolute', right: 12, top: 38, zIndex: 1 },
});