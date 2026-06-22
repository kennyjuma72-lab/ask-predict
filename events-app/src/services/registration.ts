import { collection, doc, setDoc, getDocs, query, where, orderBy, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Ticket, Event } from '../types';
import { sendEventRegistrationEmail, formatEventDate, formatEventTime } from './emailNotifications';


export interface RegistrationData {
  eventId: string;
  userId: string;
  priceOptionId?: string;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string;
  attendeeInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return undefined;
    }
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const mapEventData = (id: string, data: any): Event => ({
  id,
  ...data,
  date: toDate(data.date) as Date,
  startAt: toDate(data.startAt) as Date,
  endAt: toDate(data.endAt) as Date,
  createdAt: toDate(data.createdAt) || new Date(),
  updatedAt: toDate(data.updatedAt) || new Date(),
});

const mapTicketDocument = async (ticketDoc: any): Promise<Ticket | null> => {
  try {
    const ticketData = ticketDoc.data();
    let event: Event | undefined;

    if (ticketData.eventId) {
      try {
        const eventSnap = await getDoc(doc(db, 'events', ticketData.eventId));
        if (eventSnap.exists()) {
          event = mapEventData(eventSnap.id, eventSnap.data());
        }
      } catch (eventError) {
        console.warn('Error fetching event for ticket:', ticketData.eventId, eventError);
      }
    }

    return {
      id: ticketDoc.id,
      ...ticketData,
      createdAt: toDate(ticketData.createdAt) || new Date(),
      priceOption: ticketData.priceOption,
      event,
    } as Ticket;
  } catch (error) {
    console.error('Error mapping ticket document:', error);
    return null;
  }
};

export const registerForEvent = async (registrationData: RegistrationData): Promise<string> => {
  try {
    // Check if user is already registered for this event
    const existingTicketsQuery = query(
      collection(db, 'tickets'),
      where('eventId', '==', registrationData.eventId),
      where('userId', '==', registrationData.userId)
    );

    const existingTickets = await getDocs(existingTicketsQuery);
    if (!existingTickets.empty) {
      throw new Error('You are already registered for this event');
    }

    // Create a new ticket
    const ticketRef = doc(collection(db, 'tickets'));
    const ticketId = ticketRef.id;

    // For now, we'll create a "pending" ticket that requires admin approval
    // In a real app, this would integrate with payment processing
    const ticket: Omit<Ticket, 'id'> = {
      eventId: registrationData.eventId,
      userId: registrationData.userId,
      paymentId: `manual_${Date.now()}`, // Manual payment ID
      status: 'pending', // Pending admin approval/payment
      qrCodeId: `qr_${ticketId}`,
      createdAt: new Date(),
      priceOption: {
        id: registrationData.priceOptionId || 'default',
        name: 'General Admission',
        price: 0, // Will be set by admin
        currency: 'USD',
        isAvailable: true,
      },
      // Store user info directly in ticket for attendees list
      userName: registrationData.userName || 'Attendee',
      userEmail: registrationData.userEmail || '',
      userPhotoURL: registrationData.userPhotoURL || null,
    };

    await setDoc(ticketRef, ticket);

    // Update event's currentAttendees count (increment pending count)
    // Note: This will be updated to confirmed when admin processes payment
    try {
      const eventRef = doc(db, 'events', registrationData.eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const currentCount = eventData.currentAttendees || 0;
        // We don't increment here because ticket is pending
        // The count will be updated when admin confirms payment on web
        // But we could track pending separately if needed
      }
    } catch (error) {
      console.error('Error updating event attendee count:', error);
      // Non-critical error, don't fail registration
    }

    // Send registration confirmation email (non-blocking)
    // Get event details for the email
    try {
      const eventDoc = await getDoc(doc(db, 'events', registrationData.eventId));
      if (eventDoc.exists() && registrationData.userEmail) {
        const eventData = eventDoc.data();
        const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);

        sendEventRegistrationEmail({
          userName: registrationData.userName || 'there',
          userEmail: registrationData.userEmail,
          eventTitle: eventData.title || 'Event',
          eventDate: formatEventDate(eventDate),
          eventTime: formatEventTime(eventDate),
          eventLocation: eventData.location || 'TBD',
          eventImageUrl: eventData.imageURL || eventData.posterURL,
          ticketStatus: 'pending',
        }).catch(emailError => {
          console.log('Registration confirmation email could not be sent:', emailError);
          // Don't block registration if email fails
        });
      }
    } catch (emailError) {
      console.log('Could not send registration email:', emailError);
      // Don't block registration if email fails
    }

    return ticketId;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const ticketsSnapshot = await getDocs(ticketsQuery);
    const tickets = await Promise.all(ticketsSnapshot.docs.map(mapTicketDocument));
    return tickets.filter(Boolean) as Ticket[];
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

export const subscribeToUserTickets = (
  userId: string,
  onUpdate: (tickets: Ticket[]) => void,
  onError?: (error: any) => void
) => {
  const ticketsQuery = query(
    collection(db, 'tickets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    ticketsQuery,
    async snapshot => {
      try {
        const tickets = await Promise.all(snapshot.docs.map(mapTicketDocument));
        onUpdate(tickets.filter(Boolean) as Ticket[]);
      } catch (error) {
        console.error('Error processing ticket updates:', error);
        onError?.(error);
      }
    },
    error => {
      console.error('Error subscribing to user tickets:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
};

export const checkEventRegistration = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );

    const ticketsSnapshot = await getDocs(ticketsQuery);
    return !ticketsSnapshot.empty;
  } catch (error) {
    console.error('Error checking event registration:', error);
    return false;
  }
};

export const getEventAttendeesList = async (eventId: string): Promise<any[]> => {
  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('eventId', '==', eventId),
      where('status', 'in', ['confirmed', 'pending'])
    );

    const ticketsSnapshot = await getDocs(ticketsQuery);
    const attendees: any[] = [];
    const processedUserIds = new Set<string>();

    for (const ticketDoc of ticketsSnapshot.docs) {
      const ticketData = ticketDoc.data();
      const userId = ticketData.userId;

      // Skip if we've already processed this user
      if (processedUserIds.has(userId)) {
        continue;
      }

      // Create attendee info - try to get user data first, then fall back to ticket data
      let attendee = {
        id: userId,
        name: `Attendee ${userId.slice(-4)}`, // Default fallback
        email: '',
        photoURL: null,
        registrationDate: ticketData.createdAt?.toDate() || new Date(),
        ticketStatus: ticketData.status,
      };

      // First, try to get user data from users collection
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          attendee.name = userData.name || userData.email?.split('@')[0] || `User ${userId.slice(-4)}`;
          attendee.email = userData.email || '';
          attendee.photoURL = userData.photoURL || null;
        } else {
          // If no user document exists, try to use ticket data if available
          if (ticketData.userName) {
            attendee.name = ticketData.userName;
            attendee.email = ticketData.userEmail || '';
            attendee.photoURL = ticketData.userPhotoURL || null;
          } else {
            // Try to create a user document with basic info for future use
            try {
              const basicUserData = {
                name: `User ${userId.slice(-4)}`,
                email: '',
                role: 'attendee',
                createdAt: new Date(),
                isSuspended: false,
              };
              await setDoc(doc(db, 'users', userId), basicUserData);
              console.log('Created basic user document for:', userId);
              attendee.name = `User ${userId.slice(-4)}`;
            } catch (createError) {
              console.log('Could not create user document for:', userId);
              attendee.name = `User ${userId.slice(-4)}`;
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch user data for:', userId, '- using fallback');
        // Use ticket data if available, otherwise use default
        if (ticketData.userName) {
          attendee.name = ticketData.userName;
          attendee.email = ticketData.userEmail || '';
          attendee.photoURL = ticketData.userPhotoURL || null;
        }
      }

      attendees.push(attendee);
      processedUserIds.add(userId);
    }

    return attendees;
  } catch (error) {
    console.error('Error fetching event attendees list:', error);
    // Return empty array instead of throwing
    return [];
  }
};
