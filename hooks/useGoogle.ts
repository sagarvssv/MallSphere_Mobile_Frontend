// hooks/useGoogleAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  id_token?: string;
}

export function useGoogleAuth(onSuccess: (userInfo: GoogleUserInfo) => void) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // Build the correct redirect URI based on environment
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: isExpoGo, // Only use proxy in Expo Go
    scheme: 'malloffersfrontend',
    path: 'oauthredirect',
  });

  // Debug logs
  console.log('🔐 Redirect URI:', redirectUri);
  console.log('📱 Platform:', Platform.OS);
  console.log('📦 Is Expo Go:', isExpoGo);
  console.log('🤖 Android Client ID:', process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ? 'Present' : 'Missing');
  console.log('🍎 iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'Present' : 'Missing');
  console.log('🌐 Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Present' : 'Missing');
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use platform-specific client IDs
    androidClientId: Platform.OS === 'android' 
      ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID 
      : undefined,
    iosClientId: Platform.OS === 'ios' 
      ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID 
      : undefined,
    // Fallback web client ID
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // Critical: Add redirect URI
    redirectUri: redirectUri,
    scopes: ['profile', 'email'],
  });

  const fetchUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
    try {
      console.log('📡 Fetching user info from Google...');
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch user info:', response.status);
        throw new Error('Failed to fetch user info');
      }
      
      const userData = await response.json();
      console.log('✅ User info fetched successfully:', userData.email);
      return userData;
    } catch (error) {
      console.error('❌ Error fetching user info:', error);
      throw error;
    }
  };

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        setIsLoading(true);
        console.log('✅ Google auth success!');
        
        try {
          const { access_token, id_token } = response.params;
          console.log('🔑 Tokens received:', { 
            hasAccessToken: !!access_token, 
            hasIdToken: !!id_token 
          });
          
          const userInfo = await fetchUserInfo(access_token);
          
          console.log('👤 Passing user info to onSuccess callback');
          onSuccess({
            ...userInfo,
            id_token,
          });
        } catch (error) {
          console.error('❌ Google auth error:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === 'error') {
        console.error('❌ Google auth error response:', response.error);
        
        // Log specific error details
        if (response.error?.code === 'access_denied') {
          console.log('👤 User cancelled or access denied');
        } else if (response.error?.code === 'invalid_request') {
          console.log('⚠️ Invalid request - check redirect URI configuration');
          console.log('Expected redirect URI should be:', redirectUri);
        }
        
        setIsLoading(false);
      } else if (response?.type === 'dismiss') {
        console.log('👤 Google auth dismissed by user');
        setIsLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response]);

  return {
    promptAsync,
    isLoading,
    isReady: !!request,
  };
}