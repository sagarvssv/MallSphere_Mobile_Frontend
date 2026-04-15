// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, AuthUser, RegisterData } from '../services/auth';
import { STORAGE_KEYS } from '../constants/storageKeys';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Add this interface for Google login data
interface GoogleLoginData {
  email: string;
  name: string;
  picture: string;
  googleId: string;
  idToken: string;
}

// ─── Persist / clear helpers ──────────────────────────────────────────────────

const persistUser = async (user: AuthUser) => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.USER, JSON.stringify(user)],
    [STORAGE_KEYS.IS_LOGGED_IN, 'true'],
  ]);
};

const clearPersistedUser = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.USER,
    STORAGE_KEYS.IS_LOGGED_IN,
  ]);
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) =>
    setState(prev => ({ ...prev, isLoading }));

  const setError = (error: string | null) =>
    setState(prev => ({ ...prev, error }));

  const clearError = useCallback(() => setError(null), []);

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('🔵 useAuth.register - Starting registration with:', {
        username: data.username,
        email: data.email,
        location: data.location,
        hasProfilePicture: !!data.profilePicture?.uri
      });
      
      // Validate required fields
      if (!data.username || !data.email || !data.password) {
        throw new Error('Username, email, and password are required');
      }
      
      if (!data.location || data.location.trim() === '') {
        throw new Error('Location is required');
      }
      
      // Call auth service with data (location is now included in RegisterData)
      const response = await authService.register(data);
      
      console.log('✅ Register success:', response.message);
      
      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify',
        params: { 
          email: data.email,
          userId: response?.user?.id || '',
          isRegistration: 'true'
        },
      });
      
      return response;
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      console.error('❌ useAuth.register - Error:', message);
      setError(message);
      Alert.alert('Registration Failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ─── Verify OTP ─────────────────────────────────────────────────────────────

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      clearError();
      const response = await authService.verifyOtp(email, otp);
      Alert.alert('Success', 'Account verified! Please log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
      return response;
    } catch (err: any) {
      const message = err.message || 'OTP verification failed';
      setError(message);
      Alert.alert('Verification Failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ─── Resend OTP ─────────────────────────────────────────────────────────────

  const resendOtp = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await authService.resendOtp(email);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      return response;
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      clearError();

      const response = await authService.login(email, password);
      const user: AuthUser = response.user;

      // Persist user data so TokenRefreshHandler can rehydrate on next app open
      await persistUser(user);

      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      console.log('Login success:', user);
      return response;
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      Alert.alert('Login Failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch {
      console.warn('Logout API call failed, clearing local state anyway');
    } finally {
      await clearPersistedUser();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
      router.replace('/(auth)/login');
    }
  }, [router]);

  // ─── Forgot Password ────────────────────────────────────────────────────────

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      return response;
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Reset Password ─────────────────────────────────────────────────────────

  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string, confirmPassword: string) => {
      try {
        setLoading(true);
        const response = await authService.resetPassword(email, otp, newPassword, confirmPassword);
        Alert.alert('Password Reset', 'Your password has been reset. Please log in.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
        return response;
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Password reset failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ─── Change Password ────────────────────────────────────────────────────────

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string, confirmPassword: string) => {
      try {
        setLoading(true);
        const response = await authService.changePassword(oldPassword, newPassword, confirmPassword);
        Alert.alert('Success', 'Your password has been changed.');
        return response;
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to change password');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─── Google Login ───────────────────────────────────────────────────────────
  // ✅ UPDATED: Now accepts GoogleLoginData object
  const googleLogin = useCallback(async (googleData: GoogleLoginData) => {
    try {
      setLoading(true);
      clearError();

      console.log('🔵 Google Login - Starting with:', {
        email: googleData.email,
        name: googleData.name,
        hasIdToken: !!googleData.idToken
      });

      // Extract idToken and send to backend
      const response = await authService.googleLogin(googleData.idToken);
      const user: AuthUser = response.user;

      await persistUser(user);

      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      console.log('✅ Google Login success:', user.email);
      return response;
    } catch (err: any) {
      const message = err.message || 'Google login failed';
      console.error('❌ Google Login failed:', message);
      setError(message);
      Alert.alert('Google Login Failed', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Refresh Token ──────────────────────────────────────────────────────────

  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
    } catch {
      await clearPersistedUser();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  }, []);

  // ─── Exposed API ────────────────────────────────────────────────────────────

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    googleLogin,
    refreshToken,
    clearError,
  };
};