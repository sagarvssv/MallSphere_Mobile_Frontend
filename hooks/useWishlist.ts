// hooks/useWishlist.ts
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { ToggleWishlistResponse, WishlistItem, wishlistService } from '../services/wishlistService';

interface WishlistState {
  items: WishlistItem[];
  count: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export const useWishlist = () => {
  const [state, setState] = useState<WishlistState>({
    items: [],
    count: 0,
    isLoading: false,
    isRefreshing: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) =>
    setState(prev => ({ ...prev, isLoading }));

  const setRefreshing = (isRefreshing: boolean) =>
    setState(prev => ({ ...prev, isRefreshing }));

  const setError = (error: string | null) =>
    setState(prev => ({ ...prev, error }));

  // Filter out invalid items (where offerId is null)
  const filterValidItems = (items: WishlistItem[]): WishlistItem[] => {
    return items.filter(item => {
      const isValid = item?.offerId !== null && item?.offerId !== undefined;
      if (!isValid) {
        console.log(`⚠️ Filtering out invalid wishlist item with null offerId`);
      }
      return isValid;
    });
  };

  // Fetch Wishlist - FIXED with null safety
  const fetchWishlist = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await wishlistService.getWishlist();
      
      // Filter out invalid items
      const validItems = filterValidItems(response.data || []);
      const validCount = validItems.length;

      setState(prev => ({
        ...prev,
        items: validItems,
        count: validCount,
        error: null,
      }));

      console.log(`✅ Wishlist fetched: ${validCount} valid items (filtered out ${(response.data?.length || 0) - validCount} invalid)`);

      return { ...response, data: validItems, count: validCount };
    } catch (err: any) {
      const message = err.message || 'Failed to fetch wishlist';
      setError(message);
      console.error('Wishlist fetch error:', message);
      
      setState(prev => ({
        ...prev,
        items: [],
        count: 0,
      }));
      
      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Toggle Wishlist (Add/Remove)
  const toggleWishlist = useCallback(async (offerId: string): Promise<ToggleWishlistResponse | null> => {
    if (!offerId) {
      console.error('❌ No offerId provided to toggleWishlist');
      return null;
    }

    const previousItems = [...state.items];
    const previousCount = state.count;
    const isCurrentlyInWishlist = state.items.some(item => item?.offerId?._id === offerId);
    
    try {
      setError(null);
      
      if (isCurrentlyInWishlist) {
        console.log('🔄 Optimistically removing from wishlist');
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item?.offerId?._id !== offerId),
          count: Math.max(0, prev.count - 1),
        }));
      } else {
        console.log('🔄 Optimistically adding to wishlist');
        setState(prev => ({ ...prev, isLoading: true }));
      }

      const response = await wishlistService.toggleWishlist(offerId);

      if (response.action === 'removed') {
        console.log('✅ Item removed from wishlist');
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item?.offerId?._id !== offerId),
          count: Math.max(0, prev.count - 1),
          isLoading: false,
        }));
      } else if (response.action === 'added') {
        console.log('✅ Item added to wishlist, refetching to get full data');
        await fetchWishlist(false);
      }

      return response;
    } catch (err: any) {
      console.error('❌ Toggle wishlist error:', err);
      const message = err.message || 'Failed to update wishlist';
      setError(message);
      
      setState(prev => ({
        ...prev,
        items: previousItems,
        count: previousCount,
        isLoading: false,
      }));
      
      Alert.alert('Wishlist Error', message);
      return null;
    }
  }, [state.items, fetchWishlist]);

  // Check if item is in wishlist - FIXED with null safety
  const isInWishlist = useCallback(
    (offerId: string): boolean => {
      if (!offerId) return false;
      return state.items.some(item => item?.offerId?._id === offerId);
    },
    [state.items]
  );

  // Get wishlist count
  const getWishlistCount = useCallback((): number => {
    return state.count;
  }, [state.count]);

  // Refresh wishlist
  const refreshWishlist = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchWishlist(false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchWishlist]);

  // Clear wishlist (on logout)
  const clearWishlist = useCallback(() => {
    setState({
      items: [],
      count: 0,
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  }, []);

  return {
    items: state.items,
    count: state.count,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    fetchWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    refreshWishlist,
    clearWishlist,
  };
};