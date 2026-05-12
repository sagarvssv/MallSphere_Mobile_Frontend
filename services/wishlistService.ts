// services/wishlistService.ts
import { API_ENDPOINTS } from '../constants/api';
import { getAuthHeaders } from './auth'; // ✅ reuse helper

export interface WishlistOffer {
  _id: string;
  offerTitle?: string;
  offerDescription?: string;
  offerImages?: string | string[];
  offerValue?: number;
  offerType?: string;
  offerEndDate?: string;
  stallName?: string;
  stallCategory?: string;
  mallId?: string;
  mallName?: string;
  sellerId?: {
    _id: string;
    shopName: string;
  };
  title?: string;
  description?: string;
  image?: string;
  price?: number;
  discount?: string;
  storeId?: string;
  storeName?: string;
  category?: string;
  location?: string;
  validUntil?: string;
}

export interface WishlistItem {
  _id: string;
  userId: string;
  offerId: WishlistOffer;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistResponse {
  success: boolean;
  count: number;
  data: WishlistItem[];
}

export interface ToggleWishlistResponse {
  success: boolean;
  action: 'added' | 'removed';
  data?: {
    _id: string;
    userId: string;
    offerId: string;
  };
}

class WishlistService {

  async getWishlist(): Promise<WishlistResponse> {
    try {
      const url = API_ENDPOINTS.GET_WISHLIST;
      console.log('📡 Fetching wishlist from:', url);

      const headers = await getAuthHeaders(); // ✅ Bearer token

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      console.log('📊 Wishlist response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Wishlist fetch error:', errorText);

        if (response.status === 401 || response.status === 403) {
          console.log('⚠️ Not authenticated, returning empty wishlist');
          return { success: true, count: 0, data: [] };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Wishlist fetched: ${data.count || 0} items`);

      if (data.data?.length > 0) {
        console.log('📦 Sample item fields:', Object.keys(data.data[0].offerId || {}));
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching wishlist:', error);
      return { success: true, count: 0, data: [] };
    }
  }

  async toggleWishlist(offerId: string): Promise<ToggleWishlistResponse> {
    try {
      const url = API_ENDPOINTS.TOGGLE_WISHLIST(offerId);
      console.log('🔄 Toggling wishlist for offer:', offerId);

      const headers = await getAuthHeaders(); // ✅ Bearer token

      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });

      console.log('📊 Toggle response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Toggle wishlist error:', errorText);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Please login to add items to wishlist');
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Wishlist ${data.action} for offer:`, offerId);
      return data;
    } catch (error) {
      console.error('❌ Error toggling wishlist:', error);
      throw error;
    }
  }

  async isInWishlist(offerId: string): Promise<boolean> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.data.some(item => item.offerId._id === offerId);
    } catch {
      return false;
    }
  }

  async getWishlistCount(): Promise<number> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.count || 0;
    } catch {
      return 0;
    }
  }
}

export const wishlistService = new WishlistService();