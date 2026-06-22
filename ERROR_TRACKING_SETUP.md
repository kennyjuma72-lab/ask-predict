# Error Tracking Setup Guide

This document explains the comprehensive error tracking system implemented across all three applications: **hostdweb**, **admin**, and **events-app**.

## 📊 Overview

We use **Sentry** as our centralized error tracking and monitoring solution. Sentry automatically captures:
- JavaScript/TypeScript errors
- React component errors
- Unhandled promise rejections
- Performance issues
- User actions and context

## 🎯 What Gets Tracked

### Automatic Tracking
- ✅ All unhandled errors and exceptions
- ✅ React component crashes (via Error Boundaries)
- ✅ API errors and network failures
- ✅ Authentication errors
- ✅ User actions and navigation
- ✅ Performance metrics

### User Context
Every error includes:
- User ID
- User email
- User role (attendee/host/admin)
- Current page/screen
- Device/browser information
- App version

## 🔧 Setup Instructions

### 1. Get Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project for each app:
   - Project 1: `hostdweb` (Next.js)
   - Project 2: `admin` (Next.js)
   - Project 3: `events-app` (React Native)
3. Copy the DSN (Data Source Name) for each project

### 2. Configure Environment Variables

#### HostDWeb (Next.js)
Add to `hostdweb/.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

#### Admin Dashboard (Next.js)
Add to `admin/.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

#### Events App (React Native/Expo)
Add to `events-app/.env`:
```bash
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### 3. Verify Installation

All three apps are already configured with:
- ✅ Sentry initialization
- ✅ Error boundaries
- ✅ User context tracking
- ✅ Error tracking utilities

## 📁 File Structure

### HostDWeb
```
hostdweb/
├── sentry.client.config.ts      # Client-side Sentry config
├── sentry.server.config.ts      # Server-side Sentry config
├── sentry.edge.config.ts        # Edge runtime config
├── src/
│   ├── lib/
│   │   └── errorTracking.ts     # Error tracking utilities
│   └── components/
│       └── ErrorBoundary.tsx    # React error boundary
```

### Admin
```
admin/
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── src/
│   ├── utils/
│   │   └── errorTracking.ts
│   └── components/
│       └── ErrorBoundary.tsx
```

### Events App
```
events-app/
├── App.tsx                      # Sentry initialization
└── src/
    └── utils/
        └── errorTracking.ts
```

## 🛠️ Usage

### Basic Error Tracking

```typescript
import { trackError, trackMessage } from '@/lib/errorTracking';

try {
  // Your code
} catch (error) {
  trackError(error, { context: 'MyComponent', operation: 'fetchData' });
}
```

### Track User Actions

```typescript
import { trackEvent, addBreadcrumb } from '@/lib/errorTracking';

// Track specific events
trackEvent('event_created', { eventId: '123', title: 'My Event' });

// Add breadcrumb for user journey
addBreadcrumb('User clicked create button', 'user_action', { screen: 'Events' });
```

### Track Performance

```typescript
import { trackPerformance } from '@/lib/errorTracking';

const start = Date.now();
await fetchData();
const duration = Date.now() - start;
trackPerformance('fetch_data', duration, { endpoint: '/api/events' });
```

### Wrap Async Functions

```typescript
import { withErrorTracking } from '@/lib/errorTracking';

const fetchUserData = withErrorTracking(async (userId: string) => {
  // Your async code
}, 'UserService');
```

## 📊 Monitoring Dashboard

### Access Sentry Dashboard
1. Go to [sentry.io](https://sentry.io)
2. Select your project
3. View errors, performance, and user sessions

### Key Metrics to Monitor
- **Error Rate**: How many errors per user session
- **Affected Users**: Which users are experiencing issues
- **Error Trends**: Are errors increasing/decreasing
- **Performance**: Slow operations and API calls
- **User Journey**: Where users encounter errors

## 🔍 Filtering Errors

Errors are automatically tagged with:
- `app`: hostdweb, admin, or events-app
- `platform`: web, server, edge, or mobile
- `context`: Component/service where error occurred
- `operation`: Specific operation that failed

## 🚨 Alerting

Set up alerts in Sentry for:
- High error rates (> 5% of sessions)
- New error types
- Performance degradation
- Critical user path failures

## 📝 Best Practices

1. **Always include context** when tracking errors
2. **Track user actions** for important flows
3. **Monitor performance** for slow operations
4. **Review errors daily** to catch issues early
5. **Set up alerts** for critical errors

## 🐛 Troubleshooting

### Errors not showing in Sentry
- Check DSN is correctly set in environment variables
- Verify Sentry is initialized (check console logs)
- Ensure you're not in development mode (some apps disable in dev)

### Too many errors
- Adjust `tracesSampleRate` in config files (currently 0.1 = 10%)
- Filter out known issues in `ignoreErrors` array

### Missing user context
- Ensure `setUserContext` is called after login
- Check AuthContext is properly integrated

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [React Native Sentry Integration](https://docs.sentry.io/platforms/react-native/)

---

**Note**: All error tracking is configured but requires Sentry DSN to be active. Set up your Sentry account and add the DSNs to enable tracking.

