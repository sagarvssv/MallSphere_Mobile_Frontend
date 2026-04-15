// constants/api.ts
export const API_BASE_URL = 'https://mallsperebackend-psbx.onrender.com/api';

export const API_BASE = {
  AUTH: `${API_BASE_URL}/auth`,
  WISHLIST: `${API_BASE_URL}/whishlist`,
  USER: `${API_BASE_URL}/auth`,
};

export const API_ENDPOINTS = {
  // Auth
  REGISTER:        `${API_BASE.AUTH}/register`,
  VERIFY_OTP:      `${API_BASE.AUTH}/verify-user-otp`,
  LOGIN:           `${API_BASE.AUTH}/login`,
  LOGOUT:          `${API_BASE.AUTH}/user-logout`,
  REFRESH_TOKEN:   `${API_BASE.AUTH}/refresh-token`,
  RESEND_OTP:      `${API_BASE.AUTH}/resend-otp`,
  FORGOT_PASSWORD: `${API_BASE.AUTH}/user-forgot-password`,
  RESET_PASSWORD:  `${API_BASE.AUTH}/user-reset-password`,
  CHANGE_PASSWORD: `${API_BASE.AUTH}/user-change-password`,
  GOOGLE_LOGIN:    `${API_BASE.AUTH}/google-login`,

  // User Profile
  USER_PROFILE:    `${API_BASE.USER}/user-profile`,

  // Offers
  GET_OFFERS_BY_LOCATION: (location: string, page: number = 1, limit: number = 10) => 
    `${API_BASE.USER}/get-offers-based-on-user-location?location=${encodeURIComponent(location)}&page=${page}&limit=${limit}`,
  
  GET_OFFERS_BY_MALL: (mallName: string, page: number = 1, limit: number = 10) => 
    `${API_BASE.AUTH}/get-offers-based-on-mall/${encodeURIComponent(mallName)}?page=${page}&limit=${limit}`,
  
  GET_ALL_MALLS: (location?: string, page: number = 1, limit: number = 10) => 
    `${API_BASE.AUTH}/get-all-malls?${location ? `location=${encodeURIComponent(location)}&` : ''}page=${page}&limit=${limit}`,

  // Events - Using root endpoint (not under /auth)
  GET_ALL_EVENTS: (params?: { page?: number; limit?: number; search?: string; location?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.location) queryParams.append('location', params.location);
    // Endpoint is at root level: /get-all-events-user-dashboard
    const url = `${API_BASE_URL}/get-all-events-user-dashboard?${queryParams.toString()}`;
    console.log('Events API URL:', url);
    return url;
  },

  GET_FLASH_DEALS: (page: number = 1, limit: number = 10) => 
    `${API_BASE_URL}/auth/get-flash-deal-user-dashboard?page=${page}&limit=${limit}`,

  // Wishlist
  TOGGLE_WISHLIST: (offerId: string) => `${API_BASE.WISHLIST}/toggle-whishlist/${offerId}`,
  GET_WISHLIST:    `${API_BASE.WISHLIST}/get-whishlist`,
} as const;