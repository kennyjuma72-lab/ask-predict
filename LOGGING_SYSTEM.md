# Comprehensive Logging & Error Tracking System

This document explains the complete logging and error tracking system implemented across all three applications.

## 🎯 Overview

We have **two complementary systems** working together:

1. **Sentry** - Error tracking and crash monitoring
2. **Application Logging** - Comprehensive logging to Firestore for audit trails

## 📊 What Gets Logged

### Automatic Logging
- ✅ All authentication events (login, logout, signup)
- ✅ User actions (events created, edited, deleted)
- ✅ Admin operations (user management, payments)
- ✅ Database operations (create, update, delete)
- ✅ API calls (endpoints, methods, status codes, duration)
- ✅ Performance metrics (slow operations)
- ✅ Navigation events (mobile app)
- ✅ Screen views (mobile app)

### Error Tracking (Sentry)
- ✅ All unhandled errors and exceptions
- ✅ React component crashes
- ✅ Network failures
- ✅ Performance issues

## 🏗️ Architecture

### Log Storage
- **Firestore Collection**: `applicationLogs`
- **Console**: Development mode only
- **Sentry**: Production error tracking

### Log Structure
```typescript
{
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context: string,           // e.g., 'authentication', 'event', 'payment'
  operation: string,         // e.g., 'sign_in', 'create_event'
  userId: string,
  userEmail: string,
  userRole: string,
  app: 'hostdweb' | 'admin' | 'events-app',
  platform: 'web' | 'mobile' | 'server',
  timestamp: Date,
  metadata: Record<string, any>,
  sessionId: string,
  url?: string,              // Web apps only
  screen?: string,           // Mobile app only
}
```

## 🛠️ Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Simple log
logger.info('User viewed dashboard');

// With context
logger.info('Event created', {
  context: 'EventManagement',
  operation: 'create_event',
  metadata: { eventId: '123', title: 'Tech Conference' }
});

// Error logging
logger.error('Failed to fetch data', {
  context: 'DataService',
  operation: 'fetchEvents',
  error: error,
  metadata: { endpoint: '/api/events' }
});
```

### Convenience Methods

```typescript
// User actions
logger.logUserAction('event_viewed', { eventId: '123' });

// Auth events
logger.logAuthEvent('sign_in_success', { email: 'user@example.com' });

// Database operations
logger.logDatabaseOperation('create', 'events', { eventId: '123' });

// API calls
logger.logApiCall('/api/events', 'GET', 200, 150, { userId: '123' });

// Performance
logger.logPerformance('fetch_events', 250, { count: 10 });

// Admin actions
logger.logAdminAction('user_approved', 'targetUserId', { role: 'host' });

// Event operations
logger.logEventOperation('event_created', 'eventId', { title: 'Conference' });

// Payment operations
logger.logPaymentOperation('payment_confirmed', 'paymentId', 100, { method: 'cash' });
```

### Setting User Context

```typescript
// Set user context (automatically attached to all logs)
logger.setUser(userId, email, role);

// Clear user context
logger.clearUser();
```

## 📱 Mobile App Specific

```typescript
// Screen views
logger.logScreenView('EventsScreen', { eventCount: 10 });

// Navigation
logger.logNavigation('HomeScreen', 'EventDetailScreen', { eventId: '123' });
```

## 🔍 Viewing Logs

### Admin Dashboard
1. Go to Admin Dashboard → **Logs** page
2. Filter by:
   - App (hostdweb, admin, events-app)
   - Level (debug, info, warn, error)
   - Context (authentication, event, payment, etc.)
   - Search by message, user email, or context

### Sentry Dashboard
1. Go to [sentry.io](https://sentry.io)
2. View errors, performance, and user sessions
3. Filter by app, user, error type

## 📋 Log Contexts

Common contexts used across apps:

- `authentication` - Login, logout, signup
- `user_action` - User interactions
- `event` - Event operations
- `payment` - Payment processing
- `admin_action` - Admin operations
- `database` - Database operations
- `api_call` - API requests
- `performance` - Performance metrics
- `navigation` - Screen navigation (mobile)
- `error` - Error tracking

## 🎨 Log Levels

- **debug**: Detailed debugging information
- **info**: General information (most common)
- **warn**: Warning messages
- **error**: Error conditions

## 🔐 Security & Privacy

- User emails are logged but can be redacted
- Sensitive data (passwords, tokens) are never logged
- Logs are stored in Firestore with proper access controls
- Admin-only access to log viewer

## 📈 Performance Considerations

- Logs are written asynchronously (non-blocking)
- Firestore logging disabled in development by default
- Set `NEXT_PUBLIC_ENABLE_FIRESTORE_LOGS=true` to enable in dev
- Logs are batched and indexed for efficient queries

## 🔧 Configuration

### Environment Variables

```bash
# Enable Firestore logging in development
NEXT_PUBLIC_ENABLE_FIRESTORE_LOGS=true

# Sentry DSN (for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn  # Mobile app
```

## 📊 Firestore Indexes

Create these indexes in Firestore:

```json
{
  "indexes": [
    {
      "collectionGroup": "applicationLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" },
        { "fieldPath": "app", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applicationLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" },
        { "fieldPath": "level", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applicationLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" },
        { "fieldPath": "context", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## 🚀 Best Practices

1. **Always include context** - Makes logs easier to filter and understand
2. **Use appropriate log levels** - Don't use `error` for warnings
3. **Log important operations** - User actions, admin operations, data changes
4. **Include metadata** - IDs, relevant data, but not sensitive info
5. **Set user context** - Automatically done in AuthContext
6. **Monitor regularly** - Check logs and Sentry dashboard daily

## 📚 Related Documentation

- [ERROR_TRACKING_SETUP.md](./ERROR_TRACKING_SETUP.md) - Sentry setup guide
- [Firestore Rules](./firestore.rules) - Security rules for logs collection

---

**Note**: This system provides complete visibility into application behavior across all three apps, making debugging and monitoring much easier!

