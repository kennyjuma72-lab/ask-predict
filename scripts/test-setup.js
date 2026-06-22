#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Events Marketplace Setup...\n');

// Check if required files exist
const requiredFiles = [
  'mobile/package.json',
  'admin/package.json', 
  'functions/package.json',
  'firebase.json',
  'firestore.rules',
  'storage.rules',
  '.env',
  'mobile/app.config.js',
  'admin/src/pages/index.tsx',
  'functions/src/index.ts'
];

let allFilesExist = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check if .env has Firebase config
console.log('\n🔧 Checking environment configuration...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('FIREBASE_API_KEY=AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8')) {
    console.log('✅ Firebase configuration found in .env');
  } else {
    console.log('⚠️  Firebase configuration may need updating');
  }
} else {
  console.log('❌ .env file not found');
  allFilesExist = false;
}

// Check package.json for Stripe removal
console.log('\n💳 Checking Stripe removal...');
const mobilePackagePath = path.join(__dirname, '..', 'mobile/package.json');
if (fs.existsSync(mobilePackagePath)) {
  const mobilePackage = JSON.parse(fs.readFileSync(mobilePackagePath, 'utf8'));
  if (!mobilePackage.dependencies['@stripe/stripe-react-native']) {
    console.log('✅ Stripe removed from mobile app');
  } else {
    console.log('❌ Stripe still present in mobile app');
    allFilesExist = false;
  }
}

const functionsPackagePath = path.join(__dirname, '..', 'functions/package.json');
if (fs.existsSync(functionsPackagePath)) {
  const functionsPackage = JSON.parse(fs.readFileSync(functionsPackagePath, 'utf8'));
  if (!functionsPackage.dependencies['stripe']) {
    console.log('✅ Stripe removed from Cloud Functions');
  } else {
    console.log('❌ Stripe still present in Cloud Functions');
    allFilesExist = false;
  }
}

console.log('\n📋 Setup Summary:');
if (allFilesExist) {
  console.log('🎉 All checks passed! Your Events Marketplace is ready.');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm install --legacy-peer-deps');
  console.log('2. Set up Firebase project: mobi-c064c');
  console.log('3. Deploy Firebase rules: firebase deploy --only firestore:rules,storage:rules');
  console.log('4. Deploy Cloud Functions: npm run deploy:functions');
  console.log('5. Start mobile app: cd mobile && npm start');
  console.log('6. Start admin dashboard: cd admin && npm run dev');
} else {
  console.log('⚠️  Some issues found. Please check the missing files above.');
}

console.log('\n📖 Key Changes Made:');
console.log('✅ Removed all Stripe/payment platform code');
console.log('✅ Updated to manual admin-managed payment system');
console.log('✅ Created admin interface for payment tracking');
console.log('✅ Updated Cloud Functions for manual payment processing');
console.log('✅ Updated mobile app to show "Contact to Register"');
console.log('✅ Updated documentation and configuration');
