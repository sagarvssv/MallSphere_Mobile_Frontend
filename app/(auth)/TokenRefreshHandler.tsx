import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/auth';
import { STORAGE_KEYS } from '../../constants/storageKeys';

export default function TokenRefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('TokenRefreshHandler: Initializing auth...');

        // We only store user data + a logged-in flag in AsyncStorage.
        // The actual access/refresh tokens are httpOnly cookies managed by
        // the server — we never touch them directly from JS.
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);

        if (!userData || !isLoggedIn) {
          console.log('TokenRefreshHandler: No session found, staying on auth screen.');
          return;
        }

        console.log('TokenRefreshHandler: Session found, attempting silent token refresh...');

        // The httpOnly refreshToken cookie is sent automatically with credentials:'include'.
        // If it's still valid, the server renews the accessToken cookie silently.
        await authService.refreshToken();

        console.log('TokenRefreshHandler: Token refresh succeeded, navigating to app...');
        const user = JSON.parse(userData);
        router.replace({
          pathname: '/(tabs)',
          params: {
            user: userData,
            username: user.username || '',
            email: user.email || '',
            profilePicture: user.profilePicture || '',
          },
        });
      } catch (error: any) {
        // refreshToken failed → session expired, force fresh login
        console.log('TokenRefreshHandler: Refresh failed, clearing session.', error?.message);
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER,
          STORAGE_KEYS.IS_LOGGED_IN,
        ]);
        router.replace('/(auth)/login');
      }
    };

    initializeAuth();
  }, []);

  return null;
}