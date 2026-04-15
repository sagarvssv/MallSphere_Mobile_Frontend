import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER: 'user',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  IS_AUTHENTICATED: 'is_authenticated',
};

export const saveUserData = async (user: any) => {
  try {
    await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    await AsyncStorage.setItem(StorageKeys.IS_AUTHENTICATED, 'true');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const userString = await AsyncStorage.getItem(StorageKeys.USER);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(StorageKeys.USER);
    await AsyncStorage.removeItem(StorageKeys.ACCESS_TOKEN);
    await AsyncStorage.removeItem(StorageKeys.REFRESH_TOKEN);
    await AsyncStorage.removeItem(StorageKeys.IS_AUTHENTICATED);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const isAuthenticated = async () => {
  try {
    const authStatus = await AsyncStorage.getItem(StorageKeys.IS_AUTHENTICATED);
    return authStatus === 'true';
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};