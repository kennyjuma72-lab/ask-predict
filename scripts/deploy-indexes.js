#!/usr/bin/env node

/**
 * Deploy Firestore Indexes Script
 * This script deploys Firestore indexes needed for the logging system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firestore Indexes...\n');

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Firebase CLI not found!');
  console.error('   Install it with: npm install -g firebase-tools');
  console.error('   Then run: firebase login');
  process.exit(1);
}

// Check if firebase.json exists
const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
if (!fs.existsSync(firebaseJsonPath)) {
  console.error('❌ firebase.json not found!');
  console.error('   Make sure you\'re in the project root directory.');
  process.exit(1);
}

// Check if firestore.indexes.json exists
const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
if (!fs.existsSync(indexesPath)) {
  console.error('❌ firestore.indexes.json not found!');
  process.exit(1);
}

// Deploy indexes
try {
  console.log('📦 Deploying indexes...');
  execSync('firebase deploy --only firestore:indexes', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Indexes deployed successfully!');
  console.log('\n⏳ Note: Indexes may take a few minutes to build.');
  console.log('   Check status in Firebase Console → Firestore → Indexes');
  console.log('\n📚 Next steps:');
  console.log('   1. Wait for indexes to finish building');
  console.log('   2. Test logging system (see TEST_LOGGING.md)');
  console.log('   3. Set up Sentry DSNs (see SETUP_SENTRY.md)');
  
} catch (error) {
  console.error('\n❌ Failed to deploy indexes!');
  console.error('   Make sure you\'re logged in: firebase login');
  console.error('   Check firebase.json configuration');
  process.exit(1);
}

