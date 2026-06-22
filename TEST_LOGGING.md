# Test Logging System

This guide helps you verify that the logging system is working correctly.

## 🧪 Test 1: Authentication Logging

### HostDWeb
1. Start the app: `cd hostdweb && npm run dev`
2. Go to `/login`
3. Sign in with test credentials
4. Check admin dashboard → Logs page
5. You should see:
   - `sign_in_attempt` log entry
   - `sign_in_success` log entry
   - `user_profile_loaded` log entry

### Admin Dashboard
1. Start the app: `cd admin && npm run dev`
2. Go to `/login`
3. Sign in
4. Check Logs page
5. Verify authentication logs appear

### Events App (Mobile)
1. Start the app: `cd events-app && npm start`
2. Sign in on mobile device
3. Check admin dashboard → Logs
4. Look for logs with `app: 'events-app'`

## 🧪 Test 2: User Action Logging

### HostDWeb - Create Event
1. Sign in as host
2. Go to `/events/create`
3. Fill out form and create an event
4. Check Logs page - you should see:
   - `event_created` log
   - `create_event` performance log
   - `create events` database log

### Admin Dashboard - View Users
1. Sign in as admin
2. Navigate to Users page
3. Check Logs - should see navigation/user action logs

## 🧪 Test 3: Error Logging

### Test Error in HostDWeb
1. Open browser console
2. Run:
   ```javascript
   import { logger } from '@/lib/logger';
   logger.error('Test error', { 
     context: 'Test', 
     operation: 'test_error',
     error: new Error('This is a test error')
   });
   ```
3. Check:
   - Console (should show error)
   - Admin Logs page (should show error log)
   - Sentry dashboard (if configured)

### Test Error in Admin
1. Open browser console
2. Run:
   ```javascript
   import { logger } from '../utils/logger';
   logger.error('Admin test error', { context: 'Test' });
   ```
3. Verify in Logs page

## 🧪 Test 4: Performance Logging

### Test Performance Log
```typescript
import { logger } from '@/lib/logger';

const start = Date.now();
// Simulate some operation
await new Promise(resolve => setTimeout(resolve, 100));
const duration = Date.now() - start;

logger.logPerformance('test_operation', duration, { 
  operationType: 'test' 
});
```

Check Logs page - should see performance log with duration.

## 🧪 Test 5: Database Operation Logging

### Test Database Log
```typescript
import { logger } from '@/lib/logger';

logger.logDatabaseOperation('read', 'events', { 
  eventId: 'test123' 
});
```

Verify in Logs page.

## 🧪 Test 6: Filter Logs

### In Admin Logs Page
1. Go to `/logs`
2. Filter by:
   - **App**: Select "hostdweb" - should only show hostdweb logs
   - **Level**: Select "error" - should only show errors
   - **Context**: Select "authentication" - should only show auth logs
   - **Search**: Type "sign_in" - should filter results

## ✅ Verification Checklist

- [ ] Authentication logs appear when signing in
- [ ] User action logs appear when creating events
- [ ] Error logs appear in console AND Firestore
- [ ] Performance logs show duration
- [ ] Database operation logs appear
- [ ] Logs can be filtered by app, level, context
- [ ] Logs include user context (email, role)
- [ ] Timestamps are correct
- [ ] Logs persist after page refresh

## 🐛 Troubleshooting

### Logs Not Appearing in Firestore

1. **Check environment variable**:
   ```bash
   # In development, logs to Firestore are disabled by default
   # Enable with:
   NEXT_PUBLIC_ENABLE_FIRESTORE_LOGS=true
   ```

2. **Check Firestore rules**:
   - Ensure `applicationLogs` collection allows writes
   - Check Firebase Console → Firestore → Rules

3. **Check browser console**:
   - Look for Firestore errors
   - Check network tab for failed requests

### Logs Not Filtering Correctly

1. **Check indexes are deployed**:
   - See `DEPLOY_FIRESTORE_INDEXES.md`
   - Verify indexes are built in Firebase Console

2. **Check query syntax**:
   - Ensure filters match log structure
   - Check case sensitivity

### Sentry Not Working

1. **Check DSN is set**:
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check Sentry initialization**:
   - Open browser console
   - Should see Sentry initialization message

3. **Test error tracking**:
   ```javascript
   throw new Error("Test error");
   ```
   - Check Sentry dashboard within seconds

## 📊 Expected Results

After running all tests, you should see in Admin Logs:

- **Authentication context**: sign_in, sign_out, user_profile_loaded
- **Event context**: event_created, event_updated, event_deleted
- **Database context**: create, read, update, delete operations
- **Performance context**: Slow operations with duration
- **Error level**: Any errors that occurred

## 🎉 Success!

If all tests pass, your logging system is fully operational! You can now:
- Monitor all user actions
- Track errors across all apps
- View performance metrics
- Debug issues easily

---

**Next**: Set up monitoring alerts and dashboards (see `MONITORING_GUIDE.md`)

