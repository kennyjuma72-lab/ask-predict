import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot,
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface EventStats {
  loading: boolean;
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  totalAttendees: number;
}

export const useEventStats = () => {
  const [stats, setStats] = useState<EventStats>({
    loading: true,
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0,
  });

  useEffect(() => {
    const now = Timestamp.now();
    const eventsRef = collection(db, 'events');
    
    // Set up real-time listener for events
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      let totalEvents = 0;
      let activeEvents = 0;
      let upcomingEvents = 0;
      let totalAttendees = 0;

      snapshot.forEach((doc) => {
        const event = doc.data();
        totalEvents++;

        // Determine event status
        const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
        const isUpcoming = eventDate > now.toDate();
        const isActive = event.status === 'active' || event.status === 'published';

        if (isActive) activeEvents++;
        if (isUpcoming) upcomingEvents++;

        // Count attendees
        const attendeeCount = event.attendees?.length || 
                            event.registrations?.length || 
                            event.ticketsSold || 
                            0;
        totalAttendees += attendeeCount;
      });

      setStats({
        loading: false,
        totalEvents,
        activeEvents,
        upcomingEvents,
        totalAttendees,
      });
    }, (error) => {
      console.error('Error in event stats listener:', error);
      setStats({
        loading: false,
        totalEvents: 0,
        activeEvents: 0,
        upcomingEvents: 0,
        totalAttendees: 0,
      });
    });

    return () => unsubscribe();
  }, []);

  return stats;
};