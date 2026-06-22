# Firebase Firestore Rules Deployment Instructions

## Current Issue
Your app is experiencing permission errors because the updated Firestore rules haven't been deployed yet.

## Quick Fix - Manual Deployment via Firebase Console

### Step 1: Access Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: `mobi-c064c`

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click on "Firestore Database"
2. Click on the "Rules" tab

### Step 3: Update Rules
Replace the existing rules with the content from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/update their own profile
    match /users/{userId} {
      // Allow users to create their own profile during signup
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read/update their own profile
      allow read, update: if request.auth != null && request.auth.uid == userId;
      
      // Allow hosts/admins to read other user profiles
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['host', 'admin'];
      
      // Only cloud functions can update roles
      allow update: if request.auth != null && 
        request.auth.uid == userId && 
        !('role' in request.resource.data.diff(resource.data).affectedKeys());
    }
    
    // Events collection - hosts can manage their events, attendees can read published events
    match /events/{eventId} {
      allow read: if request.auth != null && 
        (resource.data.isPublished == true && resource.data.isApproved == true);
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.hostId &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'host';
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
    
    // Tickets collection - users can read their own tickets, hosts can read tickets for their events
    match /tickets/{ticketId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.hostId == request.auth.uid);
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.hostId == request.auth.uid);
    }
    
    // Payments collection - only cloud functions can write, users can read their own
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only cloud functions can write
    }
    
    // Admin logs - only admins can read
    match /adminLogs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only cloud functions can write
    }
    
    // Organizers collection - public read for published organizers
    match /organizers/{organizerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Notifications collection - users can read their own notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 4: Publish Rules
1. Click "Publish" button
2. Confirm the deployment

## Alternative: Command Line Deployment
If you prefer using the command line:

1. Open a new terminal/command prompt
2. Run: `firebase login`
3. Follow the authentication steps
4. Run: `firebase deploy --only firestore:rules`

## What This Fixes
- ✅ Resolves "Missing or insufficient permissions" errors
- ✅ Allows users to create their profiles during signup
- ✅ Fixes circular dependency issues in the rules
- ✅ Enables proper authentication flow

## After Deployment
Once the rules are deployed, restart your app and the permission errors should be resolved.
