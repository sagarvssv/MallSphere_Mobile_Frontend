import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Header from '../../components/common/Header';
import { Colors } from '../../constants/colors';
import { validateOTP } from '../../utils/validators';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOtp, resendOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  const email = params.email as string;
  const userId = params.userId as string;
  const isRegistration = params.isRegistration as string;

  useEffect(() => {
    // Debug log to verify params
    console.log('Verify OTP params:', { email, userId, isRegistration });
    
    if (!email) {
      Alert.alert('Error', 'Email is required for verification', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer, email]);

  const handleVerifyOtp = async () => {
    const otpError = validateOTP(otp);
    if (otpError) {
      setError(otpError);
      return;
    }

    if (!email) {
      setError('Email is required');
      Alert.alert('Error', 'Email is required for verification');
      return;
    }

    try {
      setError('');
      await verifyOtp(email, otp);
      
      // On successful verification, navigate to main app or login
      if (isRegistration === 'true') {
        router.replace('/(tabs)'); // Navigate to main app
      } else {
        router.replace('/(auth)/login'); // Navigate to login for password reset
      }
      
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required to resend OTP');
      return;
    }

    try {
      setCanResend(false);
      setTimer(60);
      await resendOtp(email);
      Alert.alert('Success', 'A new verification code has been sent to your email');
    } catch (err: any) {
      setCanResend(true);
      Alert.alert(
        'Resend Failed',
        err.message || 'Failed to resend OTP',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  const handleGoToRegister = () => {
    router.replace('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack title="Verify Email" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code sent to:
            </Text>
            <Text style={styles.emailText}>{email || 'your email'}</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.otpSection}>
            <Text style={styles.otpLabel}>Verification Code</Text>
            <Input
              placeholder="Enter 6-digit code"
              value={otp}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(numericText);
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
              autoFocus
            />
            <Text style={styles.otpHint}>
              Enter the 6-digit code from your email
            </Text>
          </View>

          <Button
            title={isLoading ? 'Verifying...' : 'Verify Email'}
            onPress={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
            loading={isLoading}
            style={styles.verifyButton}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend in {timer}s
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleGoToLogin}>
              <Text style={styles.footerLink}>Back to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGoToRegister}>
              <Text style={styles.footerLink}>Register Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: Colors.errorLight || '#FFE5E5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error || '#FF0000',
    marginBottom: 24,
  },
  errorText: {
    color: Colors.error || '#FF0000',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpSection: {
    marginBottom: 32,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    height: 60,
    backgroundColor: Colors.surface || '#F5F5F5',
    borderWidth: 2,
    borderColor: Colors.border || '#E0E0E0',
    borderRadius: 12,
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  verifyButton: {
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    color: Colors.textTertiary || '#999999',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});