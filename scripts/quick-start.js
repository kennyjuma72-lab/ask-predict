#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Quick Start Setup for Events Marketplace\n');

// Create .env file with Firebase configuration
const envContent = `# Firebase Configuration
FIREBASE_API_KEY=AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8
FIREBASE_AUTH_DOMAIN=mobi-c064c.firebaseapp.com
FIREBASE_PROJECT_ID=mobi-c064c
FIREBASE_STORAGE_BUCKET=mobi-c064c.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=964234380308
FIREBASE_APP_ID=1:964234380308:web:84e56e1f6ae92917dfd301
FIREBASE_MEASUREMENT_ID=G-JLS1F9808X

# Payment Configuration (Manual)
# No external payment platform required

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_admin_password

# App Configuration
APP_NAME=Events Marketplace
APP_URL=https://your-app.com
ADMIN_URL=https://admin.your-app.com

# Email Configuration (Optional - for notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-app.com

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
`;

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with your Firebase configuration');
} else {
  console.log('⚠️  .env file already exists. Please update it manually with your Firebase config.');
}

console.log('\n📋 Next Steps:');
console.log('1. Install dependencies: npm run install:all');
console.log('2. Set up Firebase project:');
console.log('   - Go to https://console.firebase.google.com');
console.log('   - Select your project: mobi-c064c');
console.log('   - Enable Authentication, Firestore, Storage, and Functions');
console.log('3. Deploy Firebase rules: firebase deploy --only firestore:rules,storage:rules');
console.log('4. Start the mobile app: cd mobile && npm start');
console.log('5. Start the admin dashboard: cd admin && npm run dev');
console.log('\n🎉 You\'re ready to go!');
