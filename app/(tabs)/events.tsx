// app/(tabs)/events.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEvents } from '../../hooks/useEvents';
import EventCard from '../../components/events/EventsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';

const LOCATIONS = ['Dubai', 'Abu Dhabi', 'Hyderabad', 'Bangalore', 'All'];

export default function EventsScreen() {
  const router = useRouter();
  const {
    events,
    isLoading,
    isRefreshing,
    totalEvents,
    searchQuery,
    selectedLocation,
    loadMoreEvents,
    refreshEvents,
    setSearchQuery,
    setSelectedLocation,
    searchEvents,
  } = useEvents();

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    refreshEvents();
  }, []);

  const handleSearch = () => {
    setSearchQuery(searchText);
    searchEvents();
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchQuery('');
    searchEvents();
  };

  const handleLocationSelect = (location: string) => {
    const newLocation = location === 'All' ? '' : location;
    setSelectedLocation(newLocation);
    setLocationModalVisible(false);
    refreshEvents();
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🎉</Text>
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedLocation
          ? "Try adjusting your search or filter to find events"
          : "Check back later for exciting events in your area"}
      </Text>
      {(searchQuery || selectedLocation) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSearch}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.eventCount}>{totalEvents} events found</Text>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor={Colors.textSecondary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setLocationModalVisible(true)}
        >
          <Text style={styles.filterIcon}>📍</Text>
          <Text style={styles.filterText}>
            {selectedLocation || 'All Locations'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event-details/${item._id}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshEvents}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMoreEvents}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={events.length === 0 ? styles.emptyList : undefined}
      />

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
              <Text style={styles.modalTitle}>Filter by Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LOCATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = 
                  item === 'All' 
                    ? !selectedLocation 
                    : selectedLocation === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      isSelected && styles.locationOptionSelected,
                    ]}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <Text
                      style={[
                        styles.locationOptionText,
                        isSelected && styles.locationOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  eventCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: Colors.text,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    padding: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  locationOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  locationOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});