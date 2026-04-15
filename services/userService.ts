// services/userService.ts
import { API_ENDPOINTS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  loacation: string,
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// ─── User Service ─────────────────────────────────────────────────────────────

export const userService = {

  /**
   * GET /api/auth/user-profile
   * Fetches the currently authenticated user's profile.
   * Requires accessToken cookie.
   */
  getProfile: async (): Promise<UserProfileResponse> => {
    const res = await fetch(API_ENDPOINTS.USER_PROFILE, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // sends the accessToken cookie
    });
    return handleResponse(res);
  },
};