#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedData() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isSuspended: false,
    };

    const adminRef = await db.collection('users').add(adminUser);
    console.log('✅ Admin user created:', adminRef.id);

    // Create sample host user
    const hostUser = {
      name: 'Event Host',
      email: 'host@example.com',
      role: 'host',
      stripeCustomerId: 'cus_sample_host',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isSuspended: false,
      hostApplication: {
        status: 'approved',
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    };

    const hostRef = await db.collection('users').add(hostUser);
    console.log('✅ Host user created:', hostRef.id);

    // Create sample attendee user
    const attendeeUser = {
      name: 'Event Attendee',
      email: 'attendee@example.com',
      role: 'attendee',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isSuspended: false,
    };

    const attendeeRef = await db.collection('users').add(attendeeUser);
    console.log('✅ Attendee user created:', attendeeRef.id);

    // Create sample event
    const sampleEvent = {
      title: 'Tech Conference 2024',
      description: 'Join us for the biggest tech conference of the year featuring industry leaders, innovative startups, and cutting-edge technology demonstrations.',
      startAt: new Date('2024-03-15T09:00:00'),
      endAt: new Date('2024-03-15T17:00:00'),
      venue: {
        name: 'San Francisco Convention Center',
        address: '747 Howard St',
        city: 'San Francisco',
        coordinates: {
          latitude: 37.7849,
          longitude: -122.4094,
        },
      },
      images: [],
      hostId: hostRef.id,
      hostName: 'Event Host',
      priceOptions: [
        {
          id: 'general',
          name: 'General Admission',
          price: 99,
          currency: 'USD',
          description: 'Access to all sessions and networking events',
          isAvailable: true,
        },
        {
          id: 'vip',
          name: 'VIP Pass',
          price: 199,
          currency: 'USD',
          description: 'VIP access with premium seating and exclusive networking',
          isAvailable: true,
        },
      ],
      isPublished: true,
      isApproved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      capacity: 500,
      category: 'Technology',
      tags: ['tech', 'conference', 'networking', 'startups'],
    };

    const eventRef = await db.collection('events').add(sampleEvent);
    console.log('✅ Sample event created:', eventRef.id);

    // Create sample ticket
    const sampleTicket = {
      eventId: eventRef.id,
      userId: attendeeRef.id,
      stripePaymentId: 'pi_sample_ticket',
      status: 'confirmed',
      qrCodeId: 'qr_sample_123',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      priceOption: sampleEvent.priceOptions[0],
    };

    const ticketRef = await db.collection('tickets').add(sampleTicket);
    console.log('✅ Sample ticket created:', ticketRef.id);

    // Create sample payment
    const samplePayment = {
      stripeId: 'pi_sample_payment',
      userId: attendeeRef.id,
      amount: 9900, // $99.00 in cents
      currency: 'usd',
      type: 'ticket',
      status: 'succeeded',
      meta: {
        eventId: eventRef.id,
        ticketId: ticketRef.id,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const paymentRef = await db.collection('payments').add(samplePayment);
    console.log('✅ Sample payment created:', paymentRef.id);

    // Create sample notification
    const sampleNotification = {
      userId: attendeeRef.id,
      title: 'Welcome to Events Marketplace!',
      message: 'Thank you for joining our platform. Start exploring amazing events!',
      type: 'event_update',
      data: {},
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const notificationRef = await db.collection('notifications').add(sampleNotification);
    console.log('✅ Sample notification created:', notificationRef.id);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample data created:');
    console.log('- Admin user: admin@example.com');
    console.log('- Host user: host@example.com');
    console.log('- Attendee user: attendee@example.com');
    console.log('- Sample event: Tech Conference 2024');
    console.log('- Sample ticket and payment records');
    console.log('- Sample notification');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedData();
