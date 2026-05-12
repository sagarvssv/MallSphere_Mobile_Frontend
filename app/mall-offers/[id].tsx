// app/mall-offers/[id].tsx
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useWishlist } from '../../hooks/useWishlist';
import { Mall, Offer } from '../../types';

const API_BASE_URL = 'https://mallsperebackend-psbx.onrender.com/api/auth';

// ─── Guaranteed-string image extractor ────────────────────────────────────────
const FALLBACK_IMAGE = 'https://picsum.photos/300/150';

const safeUri = (image: any): string => {
  if (!image) return FALLBACK_IMAGE;
  if (typeof image === 'string') return image.trim() || FALLBACK_IMAGE;
  if (Array.isArray(image)) {
    if (image.length === 0) return FALLBACK_IMAGE;
    return safeUri(image[0]);
  }
  if (typeof image === 'object' && image !== null) {
    const candidate = image.url ?? image.uri ?? image.src ?? null;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    return FALLBACK_IMAGE;
  }
  return FALLBACK_IMAGE;
};
// ──────────────────────────────────────────────────────────────────────────────

export default function MallOffersScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [mall, setMall] = useState<Mall | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // ── Use a ref to track initialization so it only runs once ──────────────────
  const initializedRef = useRef(false);

  // Use wishlist hook
  const {
    isInWishlist,
    toggleWishlist,
    refreshWishlist,
  } = useWishlist();

  // ── Keep isInWishlist in a stable ref so fetchMallAndOffers never
  //    needs it as a dependency (avoids the fetch → wishlist → fetch loop) ────
  const isInWishlistRef = useRef(isInWishlist);
  useEffect(() => {
    isInWishlistRef.current = isInWishlist;
  }, [isInWishlist]);

  // ── Fetch mall + offers — no wishlist deps here ───────────────────────────
  const fetchMallAndOffers = useCallback(async () => {
    try {
      setLoading(true);

      const mallName = decodeURIComponent(id as string);
      console.log('Fetching offers for mall name:', mallName);

      const offersResponse = await fetch(
        `${API_BASE_URL}/get-offers-based-on-mall/${encodeURIComponent(mallName)}?page=1&limit=50`
      );
      const offersData = await offersResponse.json();
      console.log('Mall offers response success:', offersData.success);

      if (offersData.success && offersData.data) {
        setMall({
          id: offersData.data.mallId || mallName,
          name: offersData.data.mallName || mallName,
          location: offersData.data.location || 'Dubai',
          image: safeUri(offersData.data.mallImage),
          rating: 4.5,
          distance: 2.5,
          offersCount: offersData.data.totalOffers || 0,
        });

        if (offersData.data.offers && Array.isArray(offersData.data.offers)) {
          const formattedOffers: Offer[] = offersData.data.offers.map((offer: any) => {
            const imageUrl = safeUri(offer.offerImages);
            const offerId = offer._id || offer.offerId;

            const discountValue = offer.offerValue || 0;
            const discountType = offer.offerType || 'percentage';
            const discountText =
              discountType === 'percentage'
                ? `${discountValue}% OFF`
                : `${discountValue} AED OFF`;

            return {
              id: offerId,
              title: offer.offerTitle || 'Special Offer',
              description: offer.offerDescription || '',
              discount: discountText,
              image: imageUrl,
              mallId: offersData.data.mallId,
              mallName: offersData.data.mallName || mallName,
              storeId: offer.shopId || offer.storeId,
              storeName: offer.stallName || 'Store',
              category: offer.stallCategory || 'General',
              rating: 4.0,
              price: 0,
              distance: 2.5,
              validUntil: offer.offerEndDate,
              // Read wishlist status from the stable ref — no dep on isInWishlist
              isLiked: isInWishlistRef.current(offerId),
              storeBrandImage: imageUrl,
            };
          });

          setOffers(formattedOffers);
        }
      } else {
        console.log('No offers found or API returned error');
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching mall offers:', error);
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]); // ← only depends on `id` — completely stable

  // ── Initialize once on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        await refreshWishlist();
      } catch (error) {
        console.error('Error refreshing wishlist on init:', error);
      }
      await fetchMallAndOffers();
    };

    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // (fetchMallAndOffers and refreshWishlist are stable refs — safe to omit)

  // ── When screen re-focuses, only refresh wishlist status on existing offers
  //    without re-fetching from the API ─────────────────────────────────────
  const isMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      // Skip the very first focus (handled by the init useEffect above)
      if (!isMountedFocusRef.current) {
        isMountedFocusRef.current = true;
        return;
      }

      const refreshStatus = async () => {
        try {
          await refreshWishlist();
          // Sync isLiked on existing offers using the freshly-updated ref
          setOffers(prev =>
            prev.map(offer => ({
              ...offer,
              isLiked: isInWishlistRef.current(offer.id),
            }))
          );
        } catch (error) {
          console.error('Error refreshing wishlist on focus:', error);
        }
      };

      refreshStatus();
    }, [refreshWishlist]) // refreshWishlist must be stable in useWishlist; if not, wrap in useRef too
  );

  // ── Handle wishlist toggle with success message ────────────────────────────────
  const handleWishlistToggle = useCallback(
    async (offerId: string, event: any, offerTitle: string) => {
      event.stopPropagation();

      const previousOffers = [...offers];
      const targetOffer = offers.find(o => o.id === offerId);
      if (!targetOffer) return;

      const wasLiked = targetOffer.isLiked;
      
      // Optimistic update
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId ? { ...offer, isLiked: !offer.isLiked } : offer
        )
      );

      try {
        const response = await toggleWishlist(offerId);

        if (!response || !response.success) {
          // Revert on error
          setOffers(previousOffers);
          Alert.alert('Error', 'Failed to update wishlist. Please try again.');
        } else {
          // Show success message based on action
          if (response.action === 'added') {
            Alert.alert(
              'Added to Wishlist',
              `"${offerTitle}" has been added to your wishlist!`,
              [
                {
                  text: 'View Wishlist',
                  onPress: () => router.push('/(tabs)/wishlist'),
                },
                {
                  text: 'Continue Browsing',
                  style: 'cancel',
                },
              ]
            );
          } else if (response.action === 'removed') {
            Alert.alert(
              'Removed from Wishlist',
              `"${offerTitle}" has been removed from your wishlist.`
            );
          }
          console.log(`Wishlist ${response.action} successfully`);
        }
      } catch (error) {
        console.error('Error toggling wishlist:', error);
        // Revert on error
        setOffers(previousOffers);
        Alert.alert('Error', 'Failed to update wishlist. Please try again.');
      }
    },
    [offers, toggleWishlist, router]
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group offers by category
  const groupedByCategory = offers.reduce((acc, offer) => {
    const category = offer.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>);

  const sortedCategories = Object.entries(groupedByCategory).sort(
    (a, b) => b[1].length - a[1].length
  );

  const renderOfferCard = (offer: Offer) => (
    <View key={offer.id} style={styles.offerCard}>
      <TouchableOpacity
        style={styles.storeHeader}
        onPress={() => console.log('Navigate to store:', offer.storeId)}
      >
        <Image
          source={{ uri: safeUri(offer.storeBrandImage) }}
          style={styles.storeBrandImage}
        />
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{offer.storeName}</Text>
          <View style={styles.storeRating}>
            <Text style={styles.storeRatingText}>⭐ {offer.rating}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.offerHeader}>
        <Text style={styles.offerTitle}>{offer.title}</Text>
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={e => handleWishlistToggle(offer.id, e, offer.title)}
        >
          <Text style={styles.wishlistIcon}>{offer.isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.offerDescription}>{offer.description}</Text>

      <View style={styles.discountContainer}>
        <Text style={styles.discountText}>{offer.discount}</Text>
      </View>

      <View style={styles.offerFooter}>
        <View style={styles.validityContainer}>
          <Text style={styles.validityText}>
            📅 Valid until:{' '}
            {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mall?.name || 'Mall Offers'}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mall && (
          <View style={styles.mallInfoBanner}>
            <View style={styles.mallInfoContent}>
              <Text style={styles.mallLocation}>📍 {mall.location}</Text>
              <View style={styles.mallStats}>
                <View style={styles.mallRating}>
                  <Text style={styles.ratingText}>
                    ⭐ {typeof mall.rating === 'number' ? mall.rating.toFixed(1) : mall.rating}
                  </Text>
                </View>
                <View style={styles.distanceContainer}>
                  <Text style={styles.distanceText}>{mall.distance} km</Text>
                </View>
              </View>
            </View>
            <View style={styles.totalOffersBadge}>
              <Text style={styles.totalOffersCount}>{offers.length}</Text>
              <Text style={styles.totalOffersLabel}>Total Offers</Text>
            </View>
          </View>
        )}

        {offers.length > 0 ? (
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>Offers by Category</Text>

            {sortedCategories.map(([category, categoryOffers]) => (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                    <Text style={styles.categoryName}>{category}</Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.offerCount}>{categoryOffers.length} offers</Text>
                    <Text style={styles.expandIcon}>
                      {expandedCategories[category] ? '▼' : '▶'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {expandedCategories[category] && (
                  <View style={styles.offersList}>
                    {categoryOffers.map(offer => renderOfferCard(offer))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noOffersContainer}>
            <Text style={styles.noOffersEmoji}>🏷️</Text>
            <Text style={styles.noOffersText}>No offers available in this mall</Text>
            <Text style={styles.noOffersSubtext}>Check back later for great deals!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaProvider>
  );
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    Fashion: '👕',
    Electronics: '📱',
    Food: '🍔',
    Beauty: '💄',
    Home: '🏠',
    Sports: '⚽',
    Luxary: '💎',
    Luxury: '💎',
    Toys: '🧸',
    Books: '📚',
    Jewelry: '💍',
    Shoes: '👟',
  };
  return icons[category] || '🏷️';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backButton: { padding: 8, borderRadius: 8 },
  backIcon: { fontSize: 24, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  shareButton: { padding: 8, borderRadius: 8 },
  shareIcon: { fontSize: 20 },
  content: { flex: 1 },
  mallInfoBanner: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mallInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mallLocation: { fontSize: 16, color: Colors.textSecondary, flex: 1 },
  mallStats: { flexDirection: 'row', gap: 8 },
  mallRating: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  distanceContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: { color: Colors.text, fontSize: 12, fontWeight: '500' },
  totalOffersBadge: {
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalOffersCount: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  totalOffersLabel: { fontSize: 14, color: Colors.textSecondary },
  categoriesContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  categorySection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
  },
  categoryTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  categoryStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerCount: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  expandIcon: { fontSize: 14, color: Colors.textSecondary },
  offersList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  offerCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  storeBrandImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 2 },
  storeRating: { flexDirection: 'row', alignItems: 'center' },
  storeRatingText: { fontSize: 12, color: Colors.textSecondary },
  followButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  followButtonText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  wishlistButton: { padding: 4 },
  wishlistIcon: { fontSize: 20 },
  offerDescription: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  discountContainer: {
    backgroundColor: '#4CAF50' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  validityContainer: { flex: 1 },
  validityText: { fontSize: 11, color: Colors.textSecondary },
  cartButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cartButtonText: { color: Colors.white, fontWeight: '600', fontSize: 12 },
  noOffersContainer: { padding: 48, alignItems: 'center' },
  noOffersEmoji: { fontSize: 64, marginBottom: 16 },
  noOffersText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  noOffersSubtext: { fontSize: 14, color: Colors.textSecondary },
});