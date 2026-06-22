# Monitoring & Alerting Guide

Complete guide for monitoring your applications using Sentry and the logging system.

## 📊 Daily Monitoring Checklist

### Morning Routine
1. **Check Sentry Dashboard**
   - Review new errors from overnight
   - Check error trends
   - Review affected users

2. **Check Admin Logs**
   - Review authentication issues
   - Check for failed operations
   - Review error-level logs

3. **Check Performance**
   - Review slow operations in Sentry
   - Check performance logs in Admin

### Weekly Review
1. **Error Trends**
   - Which errors are most common?
   - Are new errors appearing?
   - Are error rates increasing?

2. **User Activity**
   - Review user action logs
   - Check for unusual patterns
   - Monitor failed login attempts

3. **System Health**
   - Check database operation logs
   - Review API call logs
   - Monitor performance metrics

## 🔔 Setting Up Alerts

### Sentry Alerts

#### 1. New Error Alert
- **Trigger**: New error type appears
- **Action**: Email notification
- **Setup**: 
  1. Go to Sentry → Alerts → Create Alert Rule
  2. Condition: "A new issue is created"
  3. Action: Send to email/Slack

#### 2. High Error Rate Alert
- **Trigger**: Error rate > 5% of sessions
- **Action**: Slack notification
- **Setup**:
  1. Condition: "Error rate is above 5%"
  2. Time window: Last 1 hour
  3. Action: Slack webhook

#### 3. Performance Degradation Alert
- **Trigger**: P95 latency > 2 seconds
- **Action**: Email notification
- **Setup**:
  1. Condition: "P95 latency > 2000ms"
  2. Action: Email alert

### Firestore Log Alerts (Using Cloud Functions)

Create a Cloud Function to monitor logs:

```typescript
// functions/src/monitorLogs.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const monitorErrorLogs = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Count errors in last hour
    const errorLogs = await db.collection('applicationLogs')
      .where('level', '==', 'error')
      .where('timestamp', '>=', oneHourAgo)
      .get();
    
    if (errorLogs.size > 10) {
      // Send alert (email, Slack, etc.)
      console.log(`ALERT: ${errorLogs.size} errors in last hour`);
    }
  });
```

## 📈 Key Metrics to Monitor

### Error Metrics
- **Error Rate**: Errors per session
- **Error Types**: Most common errors
- **Affected Users**: Users experiencing errors
- **Error Trends**: Increasing/decreasing

### Performance Metrics
- **Response Time**: API response times
- **Page Load Time**: Frontend performance
- **Database Query Time**: Firestore operations
- **Slow Operations**: Operations > 1 second

### User Metrics
- **Active Users**: Daily/weekly active users
- **Authentication Rate**: Successful vs failed logins
- **User Actions**: Most common actions
- **Feature Usage**: Which features are used most

### System Metrics
- **Database Operations**: Read/write counts
- **API Calls**: Endpoint usage
- **Storage Usage**: Firestore size
- **Bandwidth**: Data transfer

## 📊 Creating Dashboards

### Sentry Dashboard
1. Go to Sentry → Dashboards
2. Create new dashboard
3. Add widgets:
   - Error rate over time
   - Top errors
   - Affected users
   - Performance metrics

### Custom Dashboard (Optional)

Create a custom monitoring page in Admin:

```typescript
// admin/src/pages/monitoring.tsx
// Shows real-time metrics from logs
```

## 🔍 Monitoring Queries

### Find Most Common Errors
```typescript
const errorLogs = await db.collection('applicationLogs')
  .where('level', '==', 'error')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();

// Group by error message
const errorCounts = {};
errorLogs.forEach(log => {
  const msg = log.data().message;
  errorCounts[msg] = (errorCounts[msg] || 0) + 1;
});
```

### Find Slow Operations
```typescript
const perfLogs = await db.collection('applicationLogs')
  .where('context', '==', 'performance')
  .where('metadata.duration', '>', 1000)
  .orderBy('metadata.duration', 'desc')
  .limit(50)
  .get();
```

### Find Failed Logins
```typescript
const failedLogins = await db.collection('applicationLogs')
  .where('context', '==', 'authentication')
  .where('message', '==', 'Sign in failed')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();
```

## 🚨 Alert Response Procedures

### Critical Error (Affects > 10 users)
1. **Immediate**: Check Sentry for error details
2. **Investigate**: Review logs and stack traces
3. **Fix**: Deploy hotfix if needed
4. **Monitor**: Watch for error resolution

### High Error Rate (> 5% of sessions)
1. **Assess**: Is it a specific feature?
2. **Rollback**: Consider rolling back recent changes
3. **Communicate**: Notify team/users if needed
4. **Fix**: Address root cause

### Performance Degradation
1. **Identify**: Which operations are slow?
2. **Optimize**: Database queries, API calls
3. **Monitor**: Track improvements
4. **Document**: Add to performance log

## 📝 Weekly Reports

### Error Summary
- Total errors this week
- Top 5 errors
- New errors discovered
- Resolved errors

### Performance Summary
- Average response times
- Slow operations identified
- Performance improvements made

### User Activity Summary
- Active users
- Most used features
- User engagement trends

## 🛠️ Tools & Resources

### Sentry
- **Dashboard**: https://sentry.io
- **Documentation**: https://docs.sentry.io
- **Alerts**: Project Settings → Alerts

### Firebase Console
- **Logs**: Firestore → applicationLogs collection
- **Indexes**: Firestore → Indexes tab
- **Rules**: Firestore → Rules tab

### Admin Dashboard
- **Logs Page**: `/admin/logs`
- **Filtering**: By app, level, context
- **Search**: By message, user, context

## ✅ Monitoring Best Practices

1. **Daily Checks**: Review errors and logs daily
2. **Set Alerts**: Automate error notifications
3. **Track Trends**: Monitor error rates over time
4. **Document Issues**: Keep track of known issues
5. **Respond Quickly**: Address critical errors immediately
6. **Learn from Logs**: Use logs to improve the app
7. **Regular Reviews**: Weekly review of metrics

## 🎯 Success Metrics

Your monitoring is successful when:
- ✅ Errors are caught within minutes
- ✅ Performance issues are identified quickly
- ✅ User issues are tracked and resolved
- ✅ System health is visible
- ✅ Team is proactive, not reactive

---

**Remember**: Good monitoring prevents small issues from becoming big problems!

