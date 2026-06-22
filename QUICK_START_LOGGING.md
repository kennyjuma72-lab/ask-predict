# Quick Start: Logging & Error Tracking Setup

Complete setup in 5 minutes! 🚀

## ⚡ Step 1: Deploy Firestore Indexes (2 minutes)

```bash
# From root directory
firebase deploy --only firestore:indexes
```

Wait 2-3 minutes for indexes to build in Firebase Console.

## 📝 Step 2: Add Sentry DSNs (2 minutes)

### Get Your Sentry DSNs
1. Go to [sentry.io](https://sentry.io) and sign up
2. Create 3 projects:
   - `hostdweb` (Next.js)
   - `admin` (Next.js)  
   - `events-app` (React Native)
3. Copy DSN from each project

### Add to Environment Files

**hostdweb/.env.local:**
```bash
NEXT_PUBLIC_SENTRY_DSN=your-hostdweb-dsn-here
```

**admin/.env.local:**
```bash
NEXT_PUBLIC_SENTRY_DSN=your-admin-dsn-here
```

**events-app/.env:**
```bash
EXPO_PUBLIC_SENTRY_DSN=your-events-app-dsn-here
```

## ✅ Step 3: Test (1 minute)

### Test Logging
1. Start hostdweb: `cd hostdweb && npm run dev`
2. Sign in
3. Go to Admin Dashboard → Logs
4. You should see authentication logs!

### Test Error Tracking
1. Open browser console
2. Run: `throw new Error("Test")`
3. Check Sentry dashboard - error should appear!

## 🎉 Done!

Your logging and error tracking is now active!

### What to Monitor
- **Admin Dashboard → Logs**: View all application logs
- **Sentry Dashboard**: View errors and performance
- **Firebase Console**: View Firestore logs collection

### Need Help?
- See `SETUP_SENTRY.md` for detailed Sentry setup
- See `TEST_LOGGING.md` for testing procedures
- See `MONITORING_GUIDE.md` for monitoring best practices

---

**That's it!** Your apps are now fully monitored. 🎊

