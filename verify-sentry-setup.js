#!/usr/bin/env node

/**
 * Verify Sentry DSN Configuration
 * Checks if all Sentry DSNs are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Sentry DSN Configuration...\n');

const configs = [
  {
    name: 'HostDWeb',
    file: path.join(__dirname, 'hostdweb', '.env.local'),
    envVar: 'NEXT_PUBLIC_SENTRY_DSN',
    expectedDsn: 'c6f68527e144180f01968fb85db6f596@o4510308960174080.ingest.us.sentry.io/4510308981866496'
  },
  {
    name: 'Admin Dashboard',
    file: path.join(__dirname, 'admin', '.env.local'),
    envVar: 'NEXT_PUBLIC_SENTRY_DSN',
    expectedDsn: '52da927fe44e3c4a0e14298867ca26db@o4510308960174080.ingest.us.sentry.io/4510308991762432'
  },
  {
    name: 'Events App',
    file: path.join(__dirname, 'events-app', '.env'),
    envVar: 'EXPO_PUBLIC_SENTRY_DSN',
    expectedDsn: '29932921c2af63118ccdf028229d311b@o4510308960174080.ingest.us.sentry.io/4510308996481029'
  }
];

let allConfigured = true;

configs.forEach(config => {
  const exists = fs.existsSync(config.file);
  
  if (!exists) {
    console.log(`❌ ${config.name}:`);
    console.log(`   File not found: ${config.file}`);
    console.log(`   Create it and add: ${config.envVar}=your-dsn\n`);
    allConfigured = false;
    return;
  }

  const content = fs.readFileSync(config.file, 'utf8');
  // Match DSN with or without newline/carriage return
  const dsnMatch = content.match(new RegExp(`${config.envVar}=([^\\r\\n]+)`));
  
  if (!dsnMatch) {
    console.log(`❌ ${config.name}:`);
    console.log(`   ${config.envVar} not found in ${config.file}`);
    console.log(`   Add: ${config.envVar}=your-dsn\n`);
    allConfigured = false;
    return;
  }

  const dsn = dsnMatch[1].trim();
  const isValid = dsn.includes('@o4510308960174080.ingest.us.sentry.io') || dsn.includes('sentry.io');
  
  if (isValid) {
    console.log(`✅ ${config.name}:`);
    console.log(`   ${config.envVar} is configured`);
    console.log(`   DSN: ${dsn.substring(0, 50)}...\n`);
  } else {
    console.log(`⚠️  ${config.name}:`);
    console.log(`   DSN found but may not be correct`);
    console.log(`   Current: ${dsn.substring(0, 50)}...\n`);
    allConfigured = false;
  }
});

if (allConfigured) {
  console.log('🎉 All Sentry DSNs are configured!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
  console.log('   2. Test error tracking: Start any app and throw a test error');
  console.log('   3. Check Sentry dashboard: https://sentry.io');
  console.log('   4. Test logging: Sign in and check Admin → Logs page\n');
} else {
  console.log('⚠️  Some configurations are missing. Please fix them above.\n');
}

