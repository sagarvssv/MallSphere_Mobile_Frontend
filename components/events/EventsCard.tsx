// components/events/EventsCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface Event {
  _id: string;
  eventTitle: string;
  eventSubject: string;
  eventDescription: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTime: string;
  eventStatus?: string;
  isLive?: boolean;
  createdAt: string;
  eventImage?: any;
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = () => {
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);
    const now = new Date();
    
    if (now < startDate) return Colors.warning;
    if (now > endDate) return Colors.error;
    return Colors.success;
  };

  const getStatusText = () => {
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);
    const now = new Date();
    
    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Expired';
    return 'Live';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {event.eventImage?.url && (
        <Image 
          source={{ uri: event.eventImage.url }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {event.eventTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <Text style={styles.subject} numberOfLines={2}>
          {event.eventSubject}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {event.eventLocation}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🕒</Text>
            <Text style={styles.detailText}>{event.eventTime}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {formatDate(event.eventStartDate)} - {formatDate(event.eventEndDate)}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {event.eventDescription}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subject: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});

export default EventCard;