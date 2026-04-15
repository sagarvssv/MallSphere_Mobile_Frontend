// hooks/useWishlist.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { wishlistService, WishlistItem, ToggleWishlistResponse } from '../services/wishlistService';

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

  // Fetch Wishlist
  const fetchWishlist = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await wishlistService.getWishlist();

      setState(prev => ({
        ...prev,
        items: response.data || [],
        count: response.count || 0,
        error: null,
      }));

      return response;
    } catch (err: any) {
      const message = err.message || 'Failed to fetch wishlist';
      setError(message);
      console.error('Wishlist fetch error:', message);
      
      // Don't throw on initial load, just show empty state
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

    // Store current state for rollback
    const previousItems = [...state.items];
    const previousCount = state.count;
    const isCurrentlyInWishlist = state.items.some(item => item.offerId?._id === offerId);
    
    try {
      setError(null);
      
      // Optimistic update
      if (isCurrentlyInWishlist) {
        console.log('🔄 Optimistically removing from wishlist');
        // Remove optimistically
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.offerId?._id !== offerId),
          count: Math.max(0, prev.count - 1),
        }));
      } else {
        console.log('🔄 Optimistically adding to wishlist');
        // Don't update items optimistically for add since we need the full populated data
        setState(prev => ({ ...prev, isLoading: true }));
      }

      // Make API call
      const response = await wishlistService.toggleWishlist(offerId);

      if (response.action === 'removed') {
        console.log('✅ Item removed from wishlist');
        // Already removed optimistically, ensure state is consistent
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.offerId?._id !== offerId),
          count: Math.max(0, prev.count - 1),
          isLoading: false,
        }));
      } else if (response.action === 'added') {
        console.log('✅ Item added to wishlist, refetching to get full data');
        // Refetch to get the complete wishlist with populated offer data
        await fetchWishlist(false);
      }

      return response;
    } catch (err: any) {
      // Rollback optimistic update on error
      console.error('❌ Toggle wishlist error:', err);
      const message = err.message || 'Failed to update wishlist';
      setError(message);
      
      // Restore previous state
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

  // Check if item is in wishlist
  const isInWishlist = useCallback(
    (offerId: string): boolean => {
      return state.items.some(item => item.offerId?._id === offerId);
    },
    [state.items]
  );

  // Get wishlist count
  const getWishlistCount = useCallback((): number => {
    return state.count;
  }, [state.count]);

  // Refresh wishlist (for pull-to-refresh)
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
    // State
    items: state.items,
    count: state.count,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,

    // Actions
    fetchWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    refreshWishlist,
    clearWishlist,
  };
};