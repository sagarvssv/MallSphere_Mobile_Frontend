import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  showLocation?: boolean;
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightComponent,
  showLocation = false,
  onLocationPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (showLocation) {
      getCurrentLocation();
    }
  }, [showLocation]);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);
    
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission denied');
        setLoadingLocation(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get city/area name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const locationData = reverseGeocode[0];
        // Format location: City, Area or just City
        const locationName = locationData.city || 
                            locationData.region || 
                            locationData.district || 
                            locationData.subregion ||
                            'Unknown location';
        
        // If we have district/area, show both
        if (locationData.district && locationData.district !== locationData.city) {
          setLocation(`${locationData.district}, ${locationName}`);
        } else {
          setLocation(locationName);
        }
      } else {
        // If reverse geocoding fails, show coordinates
        setLocation(`${currentLocation.coords.latitude.toFixed(2)}, ${currentLocation.coords.longitude.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleLocationPress = () => {
    if (onLocationPress) {
      onLocationPress();
    } else {
      // Default behavior: refresh location
      getCurrentLocation();
    }
  };

  const renderLocationContent = () => {
    if (loadingLocation) {
      return (
        <View style={styles.locationContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }

    if (locationError) {
      return (
        <TouchableOpacity onPress={getCurrentLocation} style={styles.locationContainer}>
          <Ionicons name="location-outline" size={18} color={Colors.error} />
          <Text style={[styles.locationText, styles.locationErrorText]}>
            Location off
          </Text>
          <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>
      );
    }

    if (location) {
      return (
        <TouchableOpacity onPress={handleLocationPress} style={styles.locationContainer}>
          <Ionicons name="location" size={18} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.gray} />
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 50 : 12) }
    ]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}

      <View style={styles.rightContainer}>
        {showLocation && renderLocationContent()}
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
  },
  locationText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  locationErrorText: {
    color: Colors.error,
  },
});

export default Header;