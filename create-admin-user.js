// Script to create an admin user for testing
// Run this after creating a regular user account

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account key)
// For now, this is just a template - you can manually update user role in Firebase Console

console.log(`
To create an admin user:

1. Sign up a regular user account through the app
2. Go to Firebase Console → Firestore Database
3. Find the user document in the 'users' collection
4. Edit the document and change the 'role' field from 'attendee' to 'admin'
5. Save the document

Alternatively, you can run this command in Firebase Console:
- Go to Firebase Console → Functions → Console
- Run: 
  db.collection('users').doc('USER_ID_HERE').update({role: 'admin'})

Where USER_ID_HERE is the Firebase Auth UID of the user you want to make admin.
`);

// If you want to automate this, uncomment and modify the following:
/*
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeUserAdmin(userId) {
  try {
    await db.collection('users').doc(userId).update({
      role: 'admin'
    });
    console.log(`User ${userId} is now an admin!`);
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Replace with actual user ID
// makeUserAdmin('REPLACE_WITH_USER_ID');
*/
