// components/offers/OfferCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Offer } from '../../types';
import { Colors } from '../../constants/colors';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
  onToggleWishlist: () => void;
}

const FALLBACK_IMAGE = 'https://picsum.photos/300/150';

/**
 * Guarantee a plain string URI — React Native's Image component
 * will throw "cannot be cast from ReadableNativeMap to String"
 * if it receives anything other than a string.
 */
const safeUri = (image: any): string => {
  if (!image) return FALLBACK_IMAGE;

  if (typeof image === 'string') return image.trim() || FALLBACK_IMAGE;

  if (Array.isArray(image)) {
    if (image.length === 0) return FALLBACK_IMAGE;
    return safeUri(image[0]); // recurse on first element
  }

  if (typeof image === 'object' && image !== null) {
    const candidate = image.url ?? image.uri ?? image.src ?? null;
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    return FALLBACK_IMAGE;
  }

  return FALLBACK_IMAGE;
};

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onPress,
  onToggleWishlist,
}) => {
  const imageUri = safeUri(offer.image || offer.storeBrandImage);

  // Safely format rating and distance
  const formattedRating = typeof offer.rating === 'number' 
    ? offer.rating.toFixed(1) 
    : typeof offer.rating === 'string' 
      ? parseFloat(offer.rating).toFixed(1) 
      : '4.5';
  
  const formattedDistance = typeof offer.distance === 'number'
    ? offer.distance.toFixed(1)
    : typeof offer.distance === 'string'
      ? parseFloat(offer.distance).toFixed(1)
      : '2.5';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />
        
        {/* Flash Deal Badge */}
        {offer.isFlashDeal && (
          <View style={styles.flashBadge}>
            <Text style={styles.flashBadgeText}>⚡ FLASH DEAL</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {offer.isFlashDeal && (
              <Text style={styles.flashIcon}>⚡</Text>
            )}
            <Text style={[styles.title, offer.isFlashDeal && styles.flashTitle]} numberOfLines={2}>
              {offer.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onToggleWishlist} style={styles.wishlistButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.heartIcon}>
              {offer.isLiked ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {offer.description}
        </Text>
        
        <View style={styles.storeInfo}>
          <Text style={styles.storeName} numberOfLines={1}>{offer.storeName}</Text>
          <Text style={styles.mallName} numberOfLines={1}>{offer.mallName}</Text>
        </View>
        
        <View style={styles.details}>
          <View style={[styles.discountBadge, offer.isFlashDeal && styles.flashDiscountBadge]}>
            <Text style={[styles.discountText, offer.isFlashDeal && styles.flashDiscountText]}>
              {offer.discount}
            </Text>
          </View>
          
          <View style={styles.mallInfo}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.rating}>{formattedRating}</Text>
            </View>
            <Text style={styles.distance}>
              {formattedDistance} km away
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.validUntil}>
            📅 Valid until: {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : 'N/A'}
          </Text>
          {offer.isFlashDeal && (
            <View style={styles.limitedBadge}>
              <Text style={styles.limitedText}>⏱️ Limited Time</Text>
            </View>
          )}
        </View>
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
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.border,
  },
  flashBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  flashBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  flashIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  flashTitle: {
    color: '#FF3B30',
  },
  wishlistButton: {
    padding: 4,
  },
  heartIcon: {
    fontSize: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  storeInfo: {
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  mallName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  flashDiscountBadge: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  discountText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  flashDiscountText: {
    fontWeight: 'bold',
  },
  mallInfo: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingStar: {
    fontSize: 12,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  distance: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  validUntil: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  limitedBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  limitedText: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default OfferCard;