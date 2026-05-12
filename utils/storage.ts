import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USER: 'user',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  IS_AUTHENTICATED: 'is_authenticated',
};

// Updated: Now accepts tokens as parameters
export const saveUserData = async (user: any, accessToken?: string, refreshToken?: string) => {
  try {
    await AsyncStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    await AsyncStorage.setItem(StorageKeys.IS_AUTHENTICATED, 'true');
    
    // Save tokens if provided
    if (accessToken) {
      await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
    }
    
    console.log('✅ User data and tokens saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

// Add a dedicated function to save tokens
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem(StorageKeys.ACCESS_TOKEN, accessToken);
    await AsyncStorage.setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
    await AsyncStorage.setItem(StorageKeys.IS_AUTHENTICATED, 'true');
    console.log('✅ Tokens saved successfully');
  } catch (error) {
    console.error('Error saving tokens:', error);
  }
};

// Get tokens separately
export const getTokens = async () => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN),
      AsyncStorage.getItem(StorageKeys.REFRESH_TOKEN),
    ]);
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting tokens:', error);
    return { accessToken: null, refreshToken: null };
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
    await AsyncStorage.multiRemove([
      StorageKeys.USER,
      StorageKeys.ACCESS_TOKEN,
      StorageKeys.REFRESH_TOKEN,
      StorageKeys.IS_AUTHENTICATED,
    ]);
    console.log('🗑️ All user data cleared');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const isAuthenticated = async () => {
  try {
    const [authStatus, accessToken] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.IS_AUTHENTICATED),
      AsyncStorage.getItem(StorageKeys.ACCESS_TOKEN),
    ]);
    
    // Check both auth status AND access token exists
    const isValid = authStatus === 'true' && !!accessToken;
    console.log('🔍 Auth check:', { authStatus, hasToken: !!accessToken, isValid });
    return isValid;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};