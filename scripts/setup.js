#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Events Marketplace...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please update it with your actual values.\n');
  } else {
    console.log('❌ env.example file not found. Please create a .env file manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies for each workspace
const workspaces = ['mobile', 'admin', 'functions'];

console.log('📦 Installing dependencies...\n');

workspaces.forEach(workspace => {
  const workspacePath = path.join(__dirname, '..', workspace);
  
  if (fs.existsSync(workspacePath)) {
    console.log(`Installing dependencies for ${workspace}...`);
    try {
      execSync('npm install', { 
        cwd: workspacePath, 
        stdio: 'inherit' 
      });
      console.log(`✅ Dependencies installed for ${workspace}\n`);
    } catch (error) {
      console.error(`❌ Failed to install dependencies for ${workspace}:`, error.message);
    }
  } else {
    console.log(`⚠️  ${workspace} directory not found, skipping...\n`);
  }
});

// Install root dependencies
console.log('Installing root dependencies...');
try {
  execSync('npm install', { 
    cwd: path.join(__dirname, '..'), 
    stdio: 'inherit' 
  });
  console.log('✅ Root dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install root dependencies:', error.message);
}

console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Update your .env file with actual Firebase and Stripe credentials');
console.log('2. Set up Firebase project and deploy security rules');
console.log('3. Configure Stripe webhooks');
console.log('4. Run "npm run dev:mobile" to start the mobile app');
console.log('5. Run "npm run dev:admin" to start the admin dashboard');
console.log('6. Deploy Cloud Functions with "npm run deploy:functions"');
