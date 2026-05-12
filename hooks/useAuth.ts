// hooks/useAuth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { authService, AuthUser, RegisterData } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface GoogleLoginData {
  email: string;
  name: string;
  picture: string;
  googleId: string;
  idToken: string;
}

// ─── Persist / clear helpers ──────────────────────────────────────────────────

const persistUser = async (user: AuthUser) => {
  // Store user without sensitive tokens in separate storage
  const { accessToken, refreshToken, ...userWithoutTokens } = user;
  
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.USER, JSON.stringify(userWithoutTokens)],
    [STORAGE_KEYS.IS_LOGGED_IN, 'true'],
  ]);
  
  // Store tokens separately
  if (accessToken) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    console.log('✅ Access token stored in AsyncStorage');
  }
  if (refreshToken) {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    console.log('✅ Refresh token stored in AsyncStorage');
  }
};

const clearPersistedUser = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.USER,
    STORAGE_KEYS.IS_LOGGED_IN,
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
  ]);
  console.log('✅ All auth data cleared from AsyncStorage');
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

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

  // ─── Check existing session on mount ────────────────────────────────────────

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('🔍 Checking existing auth session...');
        
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        
        console.log('📦 Stored tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          isLoggedIn: isLoggedIn === 'true'
        });
        
        if (accessToken && userStr && isLoggedIn === 'true') {
          const userWithoutTokens = JSON.parse(userStr);
          
          // Verify token is still valid (optional: check expiration)
          const user: AuthUser = {
            ...userWithoutTokens,
            accessToken,
            refreshToken: refreshToken || undefined,
          };
          
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ Restored auth session for:', user.email);
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('❌ Error restoring auth state:', error);
        await clearPersistedUser();
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkAuthState();
  }, []);

  // ─── Register ───────────────────────────────────────────────────────────────

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      clearError();
      if (!data.username || !data.email || !data.password) {
        throw new Error('Username, email, and password are required');
      }
      if (!data.location || data.location.trim() === '') {
        throw new Error('Location is required');
      }
      const response = await authService.register(data);
      console.log('✅ Register success:', response.message);
      router.push({
        pathname: '/(auth)/verify',
        params: {
          email: data.email,
          userId: response?.user?.id || '',
          isRegistration: 'true',
        },
      });
      return response;
    } catch (err: any) {
      const message = err.message || 'Registration failed';
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

      // Store user with tokens
      const user: AuthUser = {
        ...response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      await persistUser(user);
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      console.log('✅ Login success:', user.email);
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
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
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
    async (
      email: string,
      otp: string,
      newPassword: string,
      confirmPassword: string
    ) => {
      try {
        setLoading(true);
        const response = await authService.resetPassword(
          email, otp, newPassword, confirmPassword
        );
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
    async (
      oldPassword: string,
      newPassword: string,
      confirmPassword: string
    ) => {
      try {
        setLoading(true);
        const response = await authService.changePassword(
          oldPassword, newPassword, confirmPassword
        );
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

  const googleLogin = useCallback(async (googleData: GoogleLoginData) => {
    try {
      setLoading(true);
      clearError();

      console.log('🔵 Google Login starting:', googleData.email);
      console.log('🔑 idToken present:', !!googleData.idToken);

      const response = await authService.googleLogin(googleData.idToken);

      console.log('📦 Google login response:', {
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        userEmail: response.user?.email
      });

      // Store user with tokens
      const user: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username || googleData.name,
        role: response.user.role,
        profilePicture: response.user.profilePicture || googleData.picture,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };

      await persistUser(user);
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));

      console.log('✅ Google Login success:', user.email);
      console.log('✅ Auth state updated, token stored');
      
      return response;
    } catch (err: any) {
      const message = err.message || 'Google login failed';
      console.error('❌ Google login error:', message);
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
      setLoading(true);
      const newToken = await authService.refreshToken();
      
      if (newToken && state.user) {
        // Update user with new token
        const updatedUser = {
          ...state.user,
          accessToken: newToken,
        };
        
        await persistUser(updatedUser);
        setState(prev => ({
          ...prev,
          user: updatedUser,
        }));
        
        console.log('✅ Token refreshed successfully');
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await clearPersistedUser();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      router.replace('/(auth)/login');
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.user, router]);

  // Return loading state until initial auth check is complete
  if (!isInitialized) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
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
  }

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