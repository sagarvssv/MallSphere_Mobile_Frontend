import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MallCard from '../../components/offers/MallCard';
import OfferCard from '../../components/offers/OfferCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useOffers } from '../../hooks/useOffers';
import { useWishlist } from '../../hooks/useWishlist';

const LOCATIONS = ['Dubai', 'Abu Dhabi', 'Hyderabad', 'Bangalore'];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    offers,
    malls,
    toggleWishlist,
    isLoading,
    isRefreshing,
    selectedLocation,
    changeLocation,
    refreshData,
  } = useOffers();

  // ── Pull isInWishlist AND items so this component re-renders when wishlist changes ──
  // `items` being in scope means any add/remove from the wishlist tab
  // causes this component to re-render and syncedOffers re-derives automatically.
  const { refreshWishlist, isInWishlist, items: wishlistItems } = useWishlist();

  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // ── Stable refs — prevent useFocusEffect re-firing on function identity changes ──
  const refreshWishlistRef = useRef(refreshWishlist);
  const refreshDataRef = useRef(refreshData);
  useEffect(() => {
    refreshWishlistRef.current = refreshWishlist;
    refreshDataRef.current = refreshData;
  }, [refreshWishlist, refreshData]);

  // ── Skip first focus (useOffers already loads data on mount) ─────────────
  const isMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!isMountedFocusRef.current) {
        isMountedFocusRef.current = true;
        return;
      }
      // Returning from wishlist tab or elsewhere — re-sync wishlist store only
      refreshWishlistRef.current();
    }, [])
  );

  // ── Single source of truth for isLiked ───────────────────────────────────
  // Instead of trusting offer.isLiked from the API (which goes stale),
  // we override it with isInWishlist() on every render.
  // wishlistItems in scope above ensures this re-runs whenever wishlist changes.
  const syncedOffers = offers.slice(0, 5).map(offer => ({
    ...offer,
    isLiked: isInWishlist(offer.id),
  }));

  // ── Toggle: call API then re-sync wishlist store ──────────────────────────
  const handleToggleWishlist = useCallback(async (offerId: string) => {
    await toggleWishlist(offerId);
    // Refresh the wishlist store so isInWishlist() returns the updated value,
    // which causes syncedOffers to re-derive with the correct isLiked flag.
    await refreshWishlistRef.current();
  }, [toggleWishlist]);

  const handleViewMallOffers = useCallback((mallName: string) => {
    if (!mallName) {
      console.error('handleViewMallOffers: mallName is empty');
      return;
    }
    router.push(`/mall-offers/${encodeURIComponent(mallName)}`);
  }, [router]);

  const handleLocationSelect = useCallback((location: string) => {
    changeLocation(location);
    setLocationModalVisible(false);
  }, [changeLocation]);

  if (isLoading) {
    return (
      <SafeAreaProvider style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {isAuthenticated ? `Hello, ${user?.username}!` : 'Hello!'}
            </Text>
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{selectedLocation}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.profileButtonText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchBarText}>Search offers, malls, brands...</Text>
        </TouchableOpacity>

        {/* Malls Section */}
        {malls.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Malls in {selectedLocation}</Text>
              <TouchableOpacity onPress={() => router.push('/malls')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {malls.map((mall) => (
                <View key={mall.id} style={styles.mallCardWrapper}>
                  <MallCard
                    mall={mall}
                    onPress={() => {
                      if (mall.id) router.push(`/mall-details/${mall.id}`);
                    }}
                    onViewOffers={() => handleViewMallOffers(mall.name)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {malls.length === 0 && !isLoading && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>No malls found. Check console for details.</Text>
          </View>
        )}

        {/* Offers Section — uses syncedOffers so isLiked is always accurate */}
        {syncedOffers.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Offers in {selectedLocation}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/offers')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {syncedOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onToggleWishlist={() => handleToggleWishlist(offer.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No offers found in {selectedLocation}</Text>
            <TouchableOpacity
              style={styles.changeLocationButton}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.changeLocationText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LOCATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationOption,
                    selectedLocation === item && styles.locationOptionSelected,
                  ]}
                  onPress={() => handleLocationSelect(item)}
                >
                  <Text
                    style={[
                      styles.locationOptionText,
                      selectedLocation === item && styles.locationOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedLocation === item && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 10,
    paddingVertical: 20,
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  locationIcon: { fontSize: 14, marginRight: 6 },
  locationText: { fontSize: 14, color: Colors.text, fontWeight: '500', marginRight: 6 },
  dropdownArrow: { fontSize: 10, color: Colors.textSecondary },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  searchBar: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarText: { color: Colors.textSecondary, fontSize: 16 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.text },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  mallCardWrapper: { marginLeft: 16 },
  debugContainer: {
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: { color: '#856404', textAlign: 'center', fontSize: 14 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  changeLocationButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeLocationText: { color: Colors.white, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textSecondary, fontWeight: 'bold' },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationOptionSelected: { backgroundColor: '#E3F2FD' },
  locationOptionText: { fontSize: 16, color: Colors.text },
  locationOptionTextSelected: { color: Colors.primary, fontWeight: '600' },
  checkMark: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
});