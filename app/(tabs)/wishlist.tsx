// app/(tabs)/wishlist.tsx
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWishlist } from '../../hooks/useWishlist';
import OfferCard from '../../components/offers/OfferCard';
import { Colors } from '../../constants/colors';

export default function WishlistScreen() {
  const router = useRouter();
  const {
    items,
    count,
    isLoading,
    isRefreshing,
    error,
    fetchWishlist,
    toggleWishlist,
    refreshWishlist,
  } = useWishlist();

  // Fetch on mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  // Handle remove from wishlist
  const handleToggleWishlist = useCallback(
    async (offerId: string) => {
      await toggleWishlist(offerId);
    },
    [toggleWishlist]
  );

  // Helper function to extract image URL from various formats
  const extractImageUrl = (imageData: any): string => {
    const FALLBACK_IMAGE = 'https://picsum.photos/300/200';
    
    if (!imageData) return FALLBACK_IMAGE;
    if (typeof imageData === 'string') {
      return imageData.trim() || FALLBACK_IMAGE;
    }
    if (Array.isArray(imageData)) {
      if (imageData.length === 0) return FALLBACK_IMAGE;
      return extractImageUrl(imageData[0]);
    }
    if (typeof imageData === 'object' && imageData !== null) {
      const candidate = imageData.url ?? imageData.uri ?? imageData.src ?? null;
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
      return FALLBACK_IMAGE;
    }
    return FALLBACK_IMAGE;
  };

  // Helper function to format discount text
  const formatDiscountText = (offerData: any): string => {
    const discountValue = offerData.offerValue || 0;
    const discountType = offerData.offerType || 'percentage';
    
    if (discountType === 'percentage') {
      return `${discountValue}% OFF`;
    } else if (discountType === 'fixed') {
      return `${discountValue} AED OFF`;
    }
    
    return offerData.discount || 'Special Offer';
  };

  // Format offer for OfferCard component - UPDATED for backend fields
  const formatOfferForCard = (item: any) => {
    const offer = item.offerId;
    
    // Log to debug what fields are available
    console.log('📝 Formatting wishlist offer:', {
      id: offer._id,
      hasOfferTitle: !!offer.offerTitle,
      hasOfferDescription: !!offer.offerDescription,
      hasOfferImages: !!offer.offerImages,
      hasOfferValue: !!offer.offerValue,
      hasOfferType: !!offer.offerType,
    });
    
    return {
      id: offer._id,
      // Use backend field names
      title: offer.offerTitle || offer.title || 'Special Offer',
      description: offer.offerDescription || offer.description || '',
      discount: formatDiscountText(offer),
      validUntil: offer.offerEndDate || offer.validUntil || '2024-12-31',
      mallId: offer.mallId,
      mallName: offer.mallName || 'Mall',
      storeId: offer.storeId || offer.sellerId?._id,
      storeName: offer.stallName || offer.storeName || offer.sellerId?.shopName || 'Store',
      storeBrandImage: extractImageUrl(offer.offerImages || offer.image),
      category: offer.stallCategory || offer.category || 'General',
      image: extractImageUrl(offer.offerImages || offer.image),
      isLiked: true,
      distance: 2.5,
      rating: 4.5,
      price: offer.price || 0,
      location: offer.location || 'Dubai',
    };
  };

  // Handle offer press
  const handleOfferPress = useCallback((offerId: string) => {
    router.push(`/(tabs)/offer-details/${offerId}`);
  }, [router]);

  // Handle browse offers
  const handleBrowseOffers = useCallback(() => {
    router.push('/(tabs)/offers');
  }, [router]);

  // Show error state
  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <MaterialIcons name="error-outline" size={64} color={Colors.error || '#FF3B30'} />
          <Text style={styles.errorTitle}>Failed to load wishlist</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchWishlist()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wishlist</Text>
        <Text style={styles.subtitle}>
          {count} {count === 1 ? 'item' : 'items'} saved
        </Text>
      </View>

      {/* Loading State */}
      {isLoading && items.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={items.length === 0 && styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshWishlist}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {items.length > 0 ? (
            items.map((item) => (
              <OfferCard
                key={item._id}
                offer={formatOfferForCard(item)}
                onPress={() => handleOfferPress(item.offerId._id)}
                onToggleWishlist={() => handleToggleWishlist(item.offerId._id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={64} color={Colors.gray} />
              <Text style={styles.emptyStateTitle}>Your wishlist is empty</Text>
              <Text style={styles.emptyStateText}>
                Save offers you love by tapping the heart icon
              </Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={handleBrowseOffers}
              >
                <Text style={styles.browseButtonText}>Browse Offers</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});