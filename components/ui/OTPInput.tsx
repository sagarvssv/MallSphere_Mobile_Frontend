import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import RegisterForm from '../../components/auth/RegisterForm';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const handleRegister = async (userData: any) => {
    try {
      console.log('Registering user:', { 
        username: userData.username,
        email: userData.email,
        password: '***',
        hasProfilePicture: !!userData.profilePicture 
      });

      // Call the register function from useAuth
      const response = await register(
        {
          username: userData.username,
          email: userData.email,
          password: userData.password
        },
        userData.profilePicture
      );
      
      // After successful registration, navigate to OTP verification screen
      // Pass the email or user ID to the OTP screen
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { 
          email: userData.email,
          userId: response?.user?.id || '',
          isRegistration: 'true'
        }
      });
      
    } catch (err: any) {
      console.log('Registration error in screen:', err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    console.log('Google sign-up clicked');
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