// components/offers/MallCard.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Mall } from '../../types';

interface MallCardProps {
  mall: Mall;
  onPress?: () => void;
  onViewOffers?: () => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/300/200';

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

const MallCard: React.FC<MallCardProps> = ({ mall, onPress, onViewOffers }) => {
  const router = useRouter();

  const mallName = mall?.name || mall?.mallName || 'Mall Name';
  const mallLocation = mall?.location || 'Location not available';
  const mallDistance = mall?.distance ? `${mall.distance} km away` : 'Distance N/A';
  const mallOffersCount = mall?.offersCount || 0;
  const mallRating = mall?.rating ? mall.rating.toFixed(1) : 'N/A';
  const mallImage = safeUri(mall?.image);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (mall.id) {
      router.push(`/(tabs)/mall-details/${mall.id}`);
    }
  };

  const handleViewOffers = () => {
    if (onViewOffers) {
      // Use parent-supplied handler — HomeScreen passes mall.name correctly
      onViewOffers();
    } else if (mallName) {
      // Fallback: mall-offers is at app/mall-offers/[id].tsx → /mall-offers/:name
      const encoded = encodeURIComponent(mallName);
      console.log('MallCard fallback navigation with mall name:', mallName);
      router.push(`/mall-offers/${encoded}`);
    } else {
      console.error('Cannot navigate: mall name is missing');
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.9}>
      <Image source={{ uri: mallImage }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{mallName}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {mallRating}</Text>
          </View>
        </View>

        <Text style={styles.location} numberOfLines={1}>📍 {mallLocation}</Text>

        <View style={styles.footer}>
          <View style={styles.distanceContainer}>
            <Text style={styles.distance}>🚗 {mallDistance}</Text>
          </View>
          <View style={styles.offersContainer}>
            <Text style={styles.offersCount}>🏷️ {mallOffersCount} offers</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewOffersButton}
          onPress={handleViewOffers}
          activeOpacity={0.7}
        >
          <Text style={styles.viewOffersButtonText}>View Offers →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 280,
    marginRight: 16,
  },
  image: { width: '100%', height: 120, backgroundColor: Colors.border },
  content: { padding: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  ratingContainer: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: { fontSize: 12, fontWeight: '600', color: Colors.white },
  location: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  distanceContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flex: 1,
  },
  distance: { fontSize: 11, color: Colors.text, fontWeight: '500' },
  offersContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flex: 1,
  },
  offersCount: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  viewOffersButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  viewOffersButtonText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});

export default MallCard;