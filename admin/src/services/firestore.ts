import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Payment, Event as AppEvent } from '../types';

// User Management - Mobile App Users
export const getUserStats = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const totalUsers = usersSnapshot.size;
    
    // Determine online users by lastSeen within last 10 minutes and not suspended
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeUsers = usersSnapshot.docs.filter(doc => {
      const data: any = doc.data();
      const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : data.lastSeen;
      const online = Boolean(lastSeen && lastSeen > tenMinutesAgo) && !data.isSuspended;
      return online;
    }).length;
    
    const pendingHosts = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      const hasPendingApp = data.hostApplication?.status === 'pending';
      return hasPendingApp;
    }).length;
    
    return {
      totalUsers,
      activeUsers, // online now
      pendingHosts
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { totalUsers: 0, activeUsers: 0, pendingHosts: 0 };
  }
};

export const getAllUsers = async () => {
  try {
  const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        hostApplication: data.hostApplication ? {
          ...data.hostApplication,
          appliedAt: data.hostApplication.appliedAt?.toDate()
        } : null
      };
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), { 
      role,
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logActivity({
      type: 'user_role_updated',
      user: 'Admin',
      description: `Updated user role to ${role}`,
      metadata: { userId, newRole: role }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const updateHostApplication = async (userId: string, status: string, rejectionReason?: string) => {
  try {
    const updateData: any = {
      'hostApplication.status': status,
      'hostApplication.reviewedAt': Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    if (status === 'rejected' && rejectionReason) {
      updateData['hostApplication.rejectionReason'] = rejectionReason;
    }
    
    if (status === 'approved') {
      updateData.role = 'host';
    }
    
    await updateDoc(doc(db, 'users', userId), updateData);
    
    // Log activity
    await logActivity({
      type: 'host_application_reviewed',
      user: 'Admin',
      description: `Host application ${status} for user`,
      metadata: { userId, status, rejectionReason }
    });
  } catch (error) {
    console.error('Error updating host application:', error);
    throw error;
  }
};

export const suspendUser = async (userId: string, isSuspended: boolean) => {
  try {
    await updateDoc(doc(db, 'users', userId), { 
      isSuspended,
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logActivity({
      type: isSuspended ? 'user_suspended' : 'user_activated',
      user: 'Admin',
      description: `User ${isSuspended ? 'suspended' : 'activated'}`,
      metadata: { userId }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

// Event Management - Mobile App Events
export const getEventStats = async () => {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const totalEvents = eventsSnapshot.size;
    
    const activeEvents = eventsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.isActive !== false;
    }).length;
    
    const upcomingEvents = eventsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const eventDate = data.date?.toDate();
      return eventDate && eventDate > new Date();
    }).length;
    
    return {
      totalEvents,
      activeEvents,
      upcomingEvents
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return { totalEvents: 0, activeEvents: 0, upcomingEvents: 0 };
  }
};

export const getAllEvents = async (): Promise<AppEvent[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        imageURL: data.imageURL,
        posterURL: data.posterURL,
        price: data.price || 0,
        category: data.category || 'technology',
        capacity: data.capacity || 0,
        location: data.location || '',
        host: {
          id: data.host?.id || '',
          name: data.host?.name || '',
          avatar: data.host?.avatar,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        status: data.status || 'draft'
  } as AppEvent;
    });
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const createEvent = async (eventData: any) => {
  try {
    const event = {
      ...eventData,
      date: Timestamp.fromDate(new Date(eventData.date)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
      attendeeCount: 0
    };
    const docRef = await addDoc(collection(db, 'events'), event);
    
    // Log activity
    await logActivity({
      type: 'event_created',
      user: 'Admin',
      description: `Created event "${eventData.title}"`,
      metadata: { eventId: docRef.id, eventTitle: eventData.title }
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, eventData: any) => {
  try {
    const event = {
      ...eventData,
      date: Timestamp.fromDate(new Date(eventData.date)),
      updatedAt: Timestamp.now()
    };
    await updateDoc(doc(db, 'events', eventId), event);
    
    // Log activity
    await logActivity({
      type: 'event_updated',
      user: 'Admin',
      description: `Updated event "${eventData.title}"`,
      metadata: { eventId, eventTitle: eventData.title }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    console.log('Attempting to delete event:', eventId);
    
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    console.log('Event data found:', eventData?.title);
    
    await deleteDoc(doc(db, 'events', eventId));
    console.log('Event deleted successfully');
    
    // Log activity
    await logActivity({
      type: 'event_deleted',
      user: 'Admin',
      description: `Deleted event "${eventData?.title}"`,
      metadata: { eventId, eventTitle: eventData?.title }
    });
    
    console.log('Activity logged successfully');
  } catch (error) {
    console.error('Error deleting event:', error);
    // Safely extract error details (error is unknown)
    const details: any = {};
    if (error instanceof Error) {
      details.message = error.message;
      details.stack = error.stack;
    } else if (error && typeof error === 'object') {
      details.message = (error as any).message ?? String(error);
      details.code = (error as any).code;
      details.stack = (error as any).stack;
    } else {
      details.message = String(error);
    }
    console.error('Error details:', details);
    throw error;
  }
};

// Payment Management - Mobile App Payments
export const getPaymentStats = async () => {
  try {
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    const totalPayments = paymentsSnapshot.size;
    
    const completedPayments = paymentsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'succeeded';
    }).length;
    
    const pendingPayments = paymentsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'pending';
    }).length;
    
    const totalRevenue = paymentsSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return data.status === 'succeeded' ? sum + (data.amount || 0) : sum;
    }, 0);
    
    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      totalRevenue
    };
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return { totalPayments: 0, completedPayments: 0, pendingPayments: 0, totalRevenue: 0 };
  }
};

export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    return paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any),
      createdAt: doc.data().createdAt?.toDate(),
      meta: {
        ...(doc.data().meta as any),
        recordedAt: doc.data().meta?.recordedAt?.toDate()
      }
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

export const createPayment = async (paymentData: any) => {
  try {
    const payment = {
      ...paymentData,
      createdAt: Timestamp.now(),
      meta: {
        ...paymentData.meta,
        recordedAt: Timestamp.now(),
        recordedBy: 'admin'
      }
    };
    const docRef = await addDoc(collection(db, 'payments'), payment);
    
    // Log activity
    await logActivity({
      type: 'payment_recorded',
      user: 'Admin',
      description: `Recorded payment of $${paymentData.amount} for ${paymentData.type}`,
      metadata: { paymentId: docRef.id, amount: paymentData.amount, type: paymentData.type }
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: string) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), { 
      status,
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logActivity({
      type: 'payment_status_updated',
      user: 'Admin',
      description: `Updated payment status to ${status}`,
      metadata: { paymentId, status }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Activity Feed - System-wide activities
export const getRecentActivity = async () => {
  try {
    const activitiesSnapshot = await getDocs(
      query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10))
    );
    return activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
      metadata: doc.data().metadata
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

export const logActivity = async (activityData: any) => {
  try {
    const activity = {
      ...activityData,
      timestamp: Timestamp.now(),
      metadata: activityData.metadata || {}
    };
    await addDoc(collection(db, 'activities'), activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Analytics - Mobile App Analytics
export const getAnalyticsData = async () => {
  try {
    const [users, events, payments] = await Promise.all([
      getAllUsers(),
      getAllEvents(),
      getAllPayments()
    ]);

    // Calculate analytics
    const totalUsers = users.length;
    const totalEvents = events.length;
    const totalRevenue = payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    // User growth over time
    const userGrowth = users.reduce((acc, user) => {
      if (user.createdAt) {
        const month = user.createdAt.toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Revenue over time
    const revenueGrowth = payments
      .filter(p => p.status === 'succeeded')
      .reduce((acc, payment) => {
        if (payment.createdAt) {
          const month = payment.createdAt.toISOString().slice(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + payment.amount;
        }
        return acc;
      }, {} as Record<string, number>);

    // Top performing events
    const eventPerformance = events.map(event => {
      const eventPayments = payments.filter(p => 
        p.meta?.eventId === event.id && p.status === 'succeeded'
      );
      const revenue = eventPayments.reduce((sum, p) => sum + p.amount, 0);
      const attendeeCount = eventPayments.length;
      
      return {
        id: event.id,
        title: event.title,
        revenue,
        attendeeCount,
        growth: '+12%' // Mock growth for now
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalUsers,
      totalEvents,
      totalRevenue,
      userGrowth,
      revenueGrowth,
      eventPerformance
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      totalUsers: 0,
      totalEvents: 0,
      totalRevenue: 0,
      userGrowth: {},
      revenueGrowth: {},
      eventPerformance: []
    };
  }
};

// Real-time subscriptions
export const subscribeToUserStats = (callback: (stats: any) => void) => {
  return onSnapshot(collection(db, 'users'), async () => {
    const stats = await getUserStats();
    callback(stats);
  });
};

export const subscribeToEventStats = (callback: (stats: any) => void) => {
  return onSnapshot(collection(db, 'events'), async () => {
    const stats = await getEventStats();
    callback(stats);
  });
};

export const subscribeToPaymentStats = (callback: (stats: any) => void) => {
  return onSnapshot(collection(db, 'payments'), async () => {
    const stats = await getPaymentStats();
    callback(stats);
  });
};

export const subscribeToRecentActivity = (callback: (activities: any[]) => void) => {
  return onSnapshot(
    query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10)),
    (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        metadata: doc.data().metadata
      }));
      callback(activities);
    }
  );
};

// --- Payment Management ---

export const recordPayment = async (paymentData: any) => {
  try {
    const paymentRef = doc(collection(db, 'payments'));
    
    const payment = {
      ...paymentData,
      createdAt: Timestamp.now(),
    };
    
    await setDoc(paymentRef, payment);
    
    // Log activity
    await logActivity({
      type: 'payment_recorded',
      user: 'Admin',
      description: `Recorded payment of ${paymentData.amount} ${paymentData.currency} for user`,
      metadata: { 
        paymentId: paymentRef.id, 
        userId: paymentData.userId,
        amount: paymentData.amount,
        currency: paymentData.currency
      }
    });
    
    return paymentRef.id;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const approveHostApplication = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'host',
      'hostApplication.status': 'approved',
      'hostApplication.approvedAt': Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logActivity({
      type: 'host_application_approved',
      user: 'Admin',
      description: `Approved host application for user`,
      metadata: { userId }
    });
  } catch (error) {
    console.error('Error approving host application:', error);
    throw error;
  }
};

export const rejectHostApplication = async (userId: string, reason: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'hostApplication.status': 'rejected',
      'hostApplication.rejectionReason': reason,
      'hostApplication.rejectedAt': Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Log activity
    await logActivity({
      type: 'host_application_rejected',
      user: 'Admin',
      description: `Rejected host application for user`,
      metadata: { userId, reason }
    });
  } catch (error) {
    console.error('Error rejecting host application:', error);
    throw error;
  }
};