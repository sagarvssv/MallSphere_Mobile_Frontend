import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MallCard from '../components/offers/MallCard';
import { useOffers } from '../hooks/useOffers';

export default function MallsScreen() {
  const router = useRouter();
  const { malls, isLoading, selectedLocation } = useOffers();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading malls...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Malls</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Location Badge */}
      <View style={styles.locationBadge}>
        <Ionicons name="location-outline" size={16} color="#FF6B35" />
        <Text style={styles.locationText}>{selectedLocation}</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{malls.length}</Text>
          <Text style={styles.statLabel}>Malls</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {malls.reduce((sum, mall) => sum + (mall.offersCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Offers</Text>
        </View>
      </View>

      {/* Malls List - Full width cards with equal spacing */}
      {malls.length > 0 ? (
        <FlatList
          data={malls}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MallCard
              mall={{
                ...item,
                distance: item.distance || 2.5,
                rating: item.rating || 4.5
              }}
              onPress={() => {
                if (item.id) router.push(`/mall-details/${item.id}`);
              }}
              onViewOffers={() => {
                if (item.name) {
                  router.push(`/mall-offers/${encodeURIComponent(item.name)}`);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="store-mall-directory" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>No Malls Found</Text>
          <Text style={styles.emptyText}>
            There are no malls available in {selectedLocation} at the moment.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerPlaceholder: {
    width: 40,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignSelf: 'flex-start',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  listContent: {
    paddingHorizontal: 20, // Equal padding on both sides
    paddingBottom: 24,
  },
  separator: {
    height: 16, // Space between cards
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});