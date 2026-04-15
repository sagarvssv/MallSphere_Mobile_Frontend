// services/authService.ts
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role?: string;
  token?: string;
  location?: string; // Add location to user
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  location: string; // Make location required
  profilePicture?: {
    uri: string;
    type?: string;
    name?: string;
  } | null;
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
// Render free tier returns HTML when the server is waking up (cold start),
// or when the route doesn't exist. res.json() blows up on "<" in that case.

const safeJson = async (res: Response) => {
  const text = await res.text();

  // HTML response — server is down, cold-starting, or wrong URL
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

// ─── Helper ───────────────────────────────────────────────────────────────────

const handleResponse = async (res: Response) => {
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// ─── Render cold-start ping ───────────────────────────────────────────────────
// Render free-tier instances sleep after inactivity. The first request after
// sleep can take 30–60s and returns 502/503 while waking. This utility pings
// the server and retries until it's awake (up to ~45s total).

export const waitForServer = async (
  timeoutMs = 45_000,
  intervalMs = 3_000
): Promise<void> => {
  const pingUrl = `${API_BASE_URL}/api/auth/refresh-token`; // lightweight GET
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(pingUrl, { method: 'GET', credentials: 'include' });
      // Any non-5xx response means the server is awake (even 401 is fine)
      if (res.status < 500) return;
    } catch {
      // Network error — keep retrying
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Server did not respond in time. Please try again later.');
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {

  /**
   * POST /register
   * Supports optional profile picture via multipart/form-data.
   * Now includes location field (required by backend)
   */
  register: async (userData: RegisterData) => {
    console.log('🔵 authService.register called with:', {
      username: userData.username,
      email: userData.email,
      location: userData.location,
      hasProfilePicture: !!userData.profilePicture?.uri
    });

    // Validate location is present
    if (!userData.location || userData.location.trim() === '') {
      throw new Error('Location is required');
    }

    if (userData.profilePicture?.uri) {
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('location', userData.location); // CRITICAL: Add location to FormData
      
      formData.append('profilePicture', {
        uri: userData.profilePicture.uri,
        type: userData.profilePicture.type ?? 'image/jpeg',
        name: userData.profilePicture.name ?? 'profile.jpg',
      } as any);

      console.log('📤 Sending registration with FormData (includes location)');
      
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: formData,
      });
      return handleResponse(res);
    }

    // Without profile picture
    const requestBody = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      location: userData.location, // CRITICAL: Include location in JSON
    };
    
    console.log('📤 Sending registration as JSON:', {
      ...requestBody,
      password: '***'
    });
    
    const res = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    return handleResponse(res);
  },

  /**
   * POST /verify-user-otp
   */
  verifyOtp: async (email: string, otp: string) => {
    const res = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse(res);
  },

  /**
   * POST /login
   */
  login: async (email: string, password: string) => {
    const res = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  /**
   * POST /user-logout
   */
  logout: async () => {
    const res = await fetch(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  /**
   * GET /refresh-token
   */
  refreshToken: async () => {
    const res = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  /**
   * POST /resend-otp
   */
  resendOtp: async (email: string) => {
    const res = await fetch(API_ENDPOINTS.RESEND_OTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  /**
   * POST /user-forgot-password
   */
  forgotPassword: async (email: string) => {
    const res = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  /**
   * POST /user-reset-password
   */
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

  /**
   * POST /user-change-password
   */
  changePassword: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const res = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
    return handleResponse(res);
  },

  /**
   * POST /google-login
   */
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