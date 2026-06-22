import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import express from 'express';

// Initialize Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Admin function to approve host applications
export const approveHostApplication = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId } = data;
  const adminId = context.auth.uid;

  // Verify admin role
  const db = admin.firestore();
  const adminDoc = await db.collection('users').doc(adminId).get();
  const adminData = adminDoc.data();

  if (adminData?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role required');
  }

  try {
    // Update user role to host
    await db.collection('users').doc(userId).update({
      role: 'host',
      'hostApplication.status': 'approved',
    });

    // Log admin action
    await db.collection('adminLogs').add({
      action: 'host_application_approved',
      adminId,
      targetUserId: userId,
      details: {
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create notification for user
    await db.collection('notifications').add({
      userId,
      title: 'Host Application Approved',
      message: 'Congratulations! Your host application has been approved. You can now create events.',
      type: 'admin_approval',
      data: { approved: true },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving host application:', error);
    throw new functions.https.HttpsError('internal', 'Failed to approve host application');
  }
});

// Admin function to reject host applications
export const rejectHostApplication = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, reason } = data;
  const adminId = context.auth.uid;

  // Verify admin role
  const db = admin.firestore();
  const adminDoc = await db.collection('users').doc(adminId).get();
  const adminData = adminDoc.data();

  if (adminData?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role required');
  }

  try {
    // Update user host application status
    await db.collection('users').doc(userId).update({
      'hostApplication.status': 'rejected',
      'hostApplication.rejectionReason': reason || 'Application rejected',
    });

    // Log admin action
    await db.collection('adminLogs').add({
      action: 'host_application_rejected',
      adminId,
      targetUserId: userId,
      details: {
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: reason || 'Application rejected',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create notification for user
    await db.collection('notifications').add({
      userId,
      title: 'Host Application Update',
      message: `Your host application has been reviewed. ${reason || 'Please contact support for more information.'}`,
      type: 'admin_approval',
      data: { approved: false, reason },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting host application:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reject host application');
  }
});

// Admin function to record manual payment
export const recordManualPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, amount, type, description, eventId } = data;
  const adminId = context.auth.uid;

  // Verify admin role
  const db = admin.firestore();
  const adminDoc = await db.collection('users').doc(adminId).get();
  const adminData = adminDoc.data();

  if (adminData?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role required');
  }

  try {
    // Create payment record
    const paymentRef = await db.collection('payments').add({
      userId,
      amount: amount * 100, // Convert to cents for consistency
      currency: 'usd',
      type: type as 'subscription' | 'ticket',
      status: 'succeeded',
      method: 'manual',
      description: description || 'Manual payment recorded by admin',
      meta: {
        eventId,
        recordedBy: adminId,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If it's a subscription payment, update user role
    if (type === 'subscription') {
      await db.collection('users').doc(userId).update({
        role: 'host',
        'hostApplication.status': 'approved',
      });

      // Create notification
      await db.collection('notifications').add({
        userId,
        title: 'Host Subscription Confirmed',
        message: 'Your host subscription has been confirmed. You can now create events.',
        type: 'admin_approval',
        data: { approved: true },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // If it's a ticket payment, create ticket
    if (type === 'ticket' && eventId) {
      const ticketData = {
        eventId,
        userId,
        status: 'confirmed',
        qrCodeId: generateQRCodeId(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentId: paymentRef.id,
      };

      await db.collection('tickets').add(ticketData);

      // Update event capacity
      await db.collection('events').doc(eventId).update({
        capacity: admin.firestore.FieldValue.increment(-1),
      });

      // Create notification
      await db.collection('notifications').add({
        userId,
        title: 'Ticket Confirmed',
        message: 'Your event ticket has been confirmed!',
        type: 'registration_confirmation',
        data: { eventId },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Log admin action
    await db.collection('adminLogs').add({
      action: 'manual_payment_recorded',
      adminId,
      targetUserId: userId,
      details: {
        amount,
        type,
        description,
        eventId,
        paymentId: paymentRef.id,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, paymentId: paymentRef.id };
  } catch (error) {
    console.error('Error recording manual payment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to record payment');
  }
});

// Generate QR code for ticket
export const generateTicketQRCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { ticketId } = data;
  const userId = context.auth.uid;

  const db = admin.firestore();
  const ticketDoc = await db.collection('tickets').doc(ticketId).get();

  if (!ticketDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Ticket not found');
  }

  const ticketData = ticketDoc.data()!;

  // Verify user owns the ticket or is the event host
  if (ticketData.userId !== userId) {
    const eventDoc = await db.collection('events').doc(ticketData.eventId).get();
    const eventData = eventDoc.data();
    
    if (eventData?.hostId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }
  }

  // Generate QR code data
  const qrData = {
    ticketId,
    eventId: ticketData.eventId,
    userId: ticketData.userId,
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  return { qrData };
});

// Generate QR code ID
function generateQRCodeId(): string {
  return 'qr_' + Math.random().toString(36).substr(2, 9);
}