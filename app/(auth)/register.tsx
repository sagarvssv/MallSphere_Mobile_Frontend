// app/(auth)/register.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import RegisterForm from '../../components/auth/RegisterForm';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, googleLogin, isLoading } = useAuth();

  const handleRegister = async (userData: any) => {
    try {
      console.log('Registering user:', { 
        username: userData.username,
        email: userData.email,
        password: '***',
        hasProfilePicture: !!userData.profilePicture,
        location: userData.location
      });

      const response = await register(
        {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          location: userData.location
        },
        userData.profilePicture
      );
      
      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify',
        params: { 
          email: userData.email,
          userId: response?.user?.id || '',
          isRegistration: 'true'
        }
      });
      
    } catch (err: any) {
      console.log('Registration error in screen:', err.message);
      Alert.alert('Registration Failed', err.message || 'Could not create account');
    }
  };

  const handleGoogleSignUp = async (userInfo: { idToken: string; email: string; name: string; picture: string }) => {
    try {
      console.log('Google sign-up with user:', userInfo.email);
      
      // Call googleLogin with the complete user info
      const response = await googleLogin({
        idToken: userInfo.idToken,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      });
      
      if (response) {
        // Navigate to home screen on successful login/signup
        router.replace('/(tabs)');
      }
      
    } catch (err: any) {
      console.log('Google sign-up error:', err.message);
      // Error is already handled in googleLogin with Alert
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.innerContainer}>
        <RegisterForm
          onSubmit={handleRegister}
          loading={isLoading}
          onLogin={() => router.push('/(auth)/login')}
          onGoogleSignUp={handleGoogleSignUp}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
});