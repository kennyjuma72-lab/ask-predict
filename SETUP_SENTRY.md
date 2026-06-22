# Sentry Setup Guide

This guide will help you set up Sentry error tracking for all three applications.

## 🎯 Step 1: Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (free tier includes 5,000 events/month)
3. Complete the onboarding process

## 📦 Step 2: Create Projects

Create **3 separate projects** (one for each app):

### Project 1: HostDWeb
1. Click "Create Project"
2. Select **Next.js** as the platform
3. Project Name: `hostdweb`
4. Copy the DSN (Data Source Name)

### Project 2: Admin Dashboard
1. Click "Create Project"
2. Select **Next.js** as the platform
3. Project Name: `admin`
4. Copy the DSN

### Project 3: Events App (Mobile)
1. Click "Create Project"
2. Select **React Native** as the platform
3. Project Name: `events-app`
4. Copy the DSN

## 🔧 Step 3: Configure Environment Variables

### HostDWeb
1. Copy `.env.example` to `.env.local`:
   ```bash
   cd hostdweb
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Sentry DSN:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456
   ```

### Admin Dashboard
1. Copy `.env.example` to `.env.local`:
   ```bash
   cd admin
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Sentry DSN:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456
   ```

### Events App (Mobile)
1. Copy `.env.example` to `.env`:
   ```bash
   cd events-app
   cp .env.example .env
   ```

2. Edit `.env` and add your Sentry DSN:
   ```bash
   EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456
   ```

## ✅ Step 4: Verify Setup

### Test HostDWeb
1. Start the dev server: `npm run dev`
2. Navigate to any page
3. Open browser console - you should see Sentry initialized
4. Check Sentry dashboard - you should see the project connected

### Test Admin Dashboard
1. Start the dev server: `npm run dev`
2. Navigate to any page
3. Check Sentry dashboard

### Test Events App
1. Start Expo: `npm start`
2. Run on device/emulator
3. Check Sentry dashboard

## 🧪 Step 5: Test Error Tracking

### Test in HostDWeb
1. Open browser console
2. Run: `throw new Error("Test error from hostdweb")`
3. Check Sentry dashboard - error should appear within seconds

### Test in Admin Dashboard
1. Open browser console
2. Run: `throw new Error("Test error from admin")`
3. Check Sentry dashboard

### Test in Events App
1. Add this to any screen temporarily:
   ```typescript
   throw new Error("Test error from events-app");
   ```
2. Check Sentry dashboard

## 📊 Step 6: Access Sentry Dashboard

1. Go to [https://sentry.io](https://sentry.io)
2. Select your project
3. View:
   - **Issues**: All errors and exceptions
   - **Performance**: Slow operations
   - **Releases**: App versions
   - **Users**: Affected users

## 🔔 Step 7: Set Up Alerts (Optional)

1. Go to Project Settings → Alerts
2. Create alert rules:
   - New error occurs
   - Error rate exceeds threshold
   - Performance degradation
3. Set notification channels (email, Slack, etc.)

## ✨ Done!

Your error tracking is now set up. All errors will automatically be sent to Sentry with:
- User context (ID, email, role)
- Stack traces
- Browser/device information
- Breadcrumbs (user actions before error)

---

**Note**: Sentry is already configured in the code. You just need to add the DSNs to your environment variables!

