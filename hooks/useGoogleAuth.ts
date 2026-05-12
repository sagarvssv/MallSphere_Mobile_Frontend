// hooks/useGoogleAuth.ts
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  id_token?: string;
}

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ['email', 'profile'],
    // ❌ Removed forceCodeForRefreshToken — blocks idToken
  });
  console.log('✅ Google Sign-In configured');
};

export function useGoogleAuth(onSuccess: (userInfo: GoogleUserInfo) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
    const init = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        setIsReady(true);
        console.log('✅ Google Sign-In ready');
      } catch (error) {
        console.error('❌ Play Services error:', error);
        setIsReady(false);
      }
    };
    init();
  }, []);

  const promptAsync = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();

      // ✅ v16+ returns { type, data }
      const response = await GoogleSignin.signIn();
      console.log('📦 Response type:', response.type);

      if (response.type === 'cancelled') {
        console.log('👤 User cancelled');
        return { type: 'dismiss' };
      }

      if (response.type !== 'success') {
        console.warn('⚠️ Unexpected response type:', response.type);
        return { type: 'error' };
      }

      // ✅ v16+ user is inside response.data
      const { user, idToken } = response.data;

      console.log('✅ Google success:', user.email);
      console.log('🔑 idToken present:', !!idToken);

      if (!idToken) {
        throw new Error('No idToken received — check webClientId is correct');
      }

      onSuccess({
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        picture: user.photo ?? '',
        given_name: user.givenName ?? '',
        family_name: user.familyName ?? '',
        id_token: idToken,
      });

      return { type: 'success' };

    } catch (error: any) {
      console.error('❌ Google auth error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { type: 'dismiss' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { type: 'error', error: 'Already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { type: 'error', error: 'Play Services not available' };
      }

      return { type: 'error', error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      console.log('✅ Signed out from Google');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  return { promptAsync, signOut, isLoading, isReady };
}