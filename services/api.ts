// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://mallsperebackend-uh9h.onrender.com/api/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role: string;
  token?: string;
  location?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      const headers: HeadersInit = {};
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };

      if (body) {
        if (isFormData) {
          config.body = body;
          // Debug FormData
          console.log('📤 FormData contents:');
          for (let pair of (body as FormData).entries()) {
            console.log(`  ${pair[0]}:`, pair[1] instanceof File || pair[1]?.uri ? `File(${pair[1].name || 'image'})` : pair[1]);
          }
        } else {
          config.body = JSON.stringify(body);
          console.log('📤 JSON Body:', JSON.stringify(body, null, 2));
        }
      }

      console.log(`🌐 API Call: ${method} ${url}`);
      const response = await fetch(url, config);
      
      if (response.status === 401 && refreshToken) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, method, body, isFormData);
        }
      }

      const data = await response.json();
      console.log('📥 API Response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.log('❌ API Error:', data);
        return {
          success: false,
          message: data.message || `Request failed with status ${response.status}`,
          error: data.error
        };
      }

      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error: any) {
      console.error('❌ API Request Error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
        error: error.message
      };
    }
  }

  async register(
    userData: { 
      username: string; 
      email: string; 
      password: string;
      location: string; // Make required since backend expects it
    }, 
    profilePicture?: any
  ): Promise<ApiResponse<{ user: User }>> {
    try {
      console.log('🔵 === REGISTRATION DEBUG START ===');
      console.log('📝 UserData:', {
        username: userData.username,
        email: userData.email,
        location: userData.location,
        passwordLength: userData.password?.length
      });
      console.log('🖼️ Profile picture:', profilePicture ? 'Yes' : 'No');
      
      // Validate location is present
      if (!userData.location || userData.location.trim() === '') {
        console.error('❌ Location is missing!');
        return {
          success: false,
          message: 'Location is required',
          error: 'Location field is empty'
        };
      }

      if (profilePicture) {
        // Handle multipart/form-data for profile picture
        const formData = new FormData();
        formData.append('username', userData.username);
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('location', userData.location); // Make sure location is added
        
        // Add profile picture
        const imageUri = profilePicture.uri;
        const imageType = profilePicture.mimeType || profilePicture.type || 'image/jpeg';
        const imageName = profilePicture.fileName || profilePicture.uri.split('/').pop() || 'profile.jpg';
        
        formData.append('profilePicture', {
          uri: imageUri,
          type: imageType,
          name: imageName,
        } as any);

        console.log('📤 Sending registration with FormData');
        const response = await this.request<{ user: User }>('/register', 'POST', formData, true);
        return response;
      } else {
        // Without profile picture
        const requestData = {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          location: userData.location // Must include location
        };
        
        console.log('📤 Sending registration as JSON');
        const response = await this.request<{ user: User }>('/register', 'POST', requestData);
        return response;
      }
    } catch (error: any) {
      console.error('❌ Registration error in API service:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
        error: error.message
      };
    }
  }

  async verifyOtp(email: string, otp: string): Promise<ApiResponse> {
    return this.request('/verify-user-otp', 'POST', { email, otp });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; message: string }>> {
    const response = await this.request<{ user: User; message: string }>('/login', 'POST', { email, password });
    
    if (response.success && response.data?.user?.token) {
      await AsyncStorage.setItem('accessToken', response.data.user.token);
      await AsyncStorage.setItem('refreshToken', response.data.user.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.accessToken) {
          await AsyncStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', data.refreshToken);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/user-logout', 'POST');
    
    if (response.success) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
    
    return response;
  }

  async resendOtp(email: string): Promise<ApiResponse> {
    return this.request('/resend-otp', 'POST', { email });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/user-forgot-password', 'POST', { email });
  }

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string): Promise<ApiResponse> {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      
      const response = await this.request('/user-reset-password', 'POST', {
        email,
        otp,
        newPassword,
        confirmPassword
      });
      
      return response;
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.message || 'Password reset failed',
        error: error.message
      };
    }
  }

  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse> {
    return this.request('/user-change-password', 'POST', {
      oldPassword,
      newPassword,
      confirmPassword
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    const user = await this.getCurrentUser();
    return !!(token && user);
  }

  async updateUserData(userData: Partial<User>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Update user data error:', error);
    }
  }
}

export const apiService = new ApiService();