// services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { STORAGE_KEYS } from '../constants/storageKeys';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role?: string;
  location?: string;
  accessToken: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  location: string;
  profilePicture?: {
    uri: string;
    type?: string;
    name?: string;
  } | null;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

// ✅ FIXED: tokens are stored separately, not inside the user object
export const getStoredToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getStoredToken();
  console.log('🔑 Auth token present:', !!token);
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ─── Safe JSON parser ─────────────────────────────────────────────────────────

const safeJson = async (res: Response) => {
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Server is starting up, please try again in a few seconds.');
    }
    if (res.status === 404) {
      throw new Error(`Endpoint not found (${res.url}). Check your API base URL.`);
    }
    throw new Error(`Unexpected server response (status ${res.status}). The server may be unavailable.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid response from server: ${text.slice(0, 100)}`);
  }
};

const handleResponse = async (res: Response) => {
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// ─── Render cold-start ping ───────────────────────────────────────────────────

export const waitForServer = async (
  timeoutMs = 45_000,
  intervalMs = 3_000
): Promise<void> => {
  const pingUrl = `${API_BASE_URL}/auth/refresh-token`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(pingUrl, { method: 'GET', credentials: 'include' });
      if (res.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Server did not respond in time. Please try again later.');
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {

  register: async (userData: RegisterData) => {
    console.log('🔵 authService.register called');

    if (!userData.location || userData.location.trim() === '') {
      throw new Error('Location is required');
    }

    if (userData.profilePicture?.uri) {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('location', userData.location);
      formData.append('profilePicture', {
        uri: userData.profilePicture.uri,
        type: userData.profilePicture.type ?? 'image/jpeg',
        name: userData.profilePicture.name ?? 'profile.jpg',
      } as any);
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: formData,
      });
      return handleResponse(res);
    }

    const res = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        location: userData.location,
      }),
    });
    return handleResponse(res);
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(res);
  },

  login: async (email: string, password: string) => {
    const res = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  logout: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // ✅ FIXED: send refresh token as a cookie (backend reads req.cookies.refreshToken)
  refreshToken: async () => {
    const refreshTokenValue = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const res = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshTokenValue}`,  // ✅ mimics browser cookie
      },
      credentials: 'include',
    });

    const data = await handleResponse(res);

    // ✅ Update stored tokens if the server sends new ones in the response body
    if (data.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      console.log('✅ Access token refreshed and stored');
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      console.log('✅ Refresh token renewed and stored');
    }

    return data;
  },

  resendOtp: async (email: string) => {
    const res = await fetch(API_ENDPOINTS.RESEND_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const res = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });
    return handleResponse(res);
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const headers = await getAuthHeaders();
    const res = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
    return handleResponse(res);
  },

  googleLogin: async (idToken: string) => {
    const res = await fetch(API_ENDPOINTS.GOOGLE_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });
    return handleResponse(res);
  },
};