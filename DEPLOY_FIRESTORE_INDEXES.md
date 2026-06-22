# Deploy Firestore Indexes for Logging

This guide shows how to deploy the Firestore indexes needed for the logging system.

## 📋 What Are These Indexes For?

The indexes enable efficient querying of the `applicationLogs` collection by:
- App name (hostdweb, admin, events-app)
- Log level (debug, info, warn, error)
- Context (authentication, event, payment, etc.)
- Timestamp (for sorting by date)

## 🚀 Method 1: Using Firebase CLI (Recommended)

### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

### Deploy
```bash
# From the root directory
firebase deploy --only firestore:indexes
```

This will deploy all indexes from `firestore.indexes.json`.

## 🌐 Method 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Add Index**
5. Add each index manually:

### Index 1: Timestamp + App
- Collection: `applicationLogs`
- Fields:
  - `timestamp` (Descending)
  - `app` (Ascending)
- Query scope: Collection

### Index 2: Timestamp + Level
- Collection: `applicationLogs`
- Fields:
  - `timestamp` (Descending)
  - `level` (Ascending)
- Query scope: Collection

### Index 3: Timestamp + Context
- Collection: `applicationLogs`
- Fields:
  - `timestamp` (Descending)
  - `context` (Ascending)
- Query scope: Collection

### Index 4: App + Timestamp + Level
- Collection: `applicationLogs`
- Fields:
  - `app` (Ascending)
  - `timestamp` (Descending)
  - `level` (Ascending)
- Query scope: Collection

## ✅ Verify Indexes

1. Go to Firebase Console → Firestore → Indexes
2. You should see all indexes listed
3. Status should be **Enabled** (may take a few minutes to build)

## 🧪 Test Query

Once indexes are deployed, you can test with a query:

```typescript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const logsQuery = query(
  collection(db, 'applicationLogs'),
  where('app', '==', 'hostdweb'),
  where('level', '==', 'error'),
  orderBy('timestamp', 'desc'),
  limit(10)
);

const snapshot = await getDocs(logsQuery);
```

## ⚠️ Important Notes

- Indexes are built in the background (may take a few minutes)
- You'll get an error if you query without the required index
- Firebase automatically suggests missing indexes via error messages
- Large indexes may take longer to build

## 📊 Index Status

Check index status in Firebase Console:
- **Building**: Index is being created
- **Enabled**: Index is ready to use
- **Error**: Index creation failed (check error message)

---

**Note**: The indexes are already added to `firestore.indexes.json`. Just deploy them using Method 1!

