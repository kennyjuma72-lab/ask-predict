# Events Marketplace

A comprehensive cross-platform events marketplace with a React Native mobile app, Next.js admin dashboard, and Firebase backend with Stripe payment integration.

## 🏗️ Architecture

- **Mobile App**: React Native with Expo (managed workflow)
- **Admin Dashboard**: Next.js with TypeScript
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions, Storage)
- **Payments**: Manual admin-managed system (no external payment platform)
- **Deployment**: Vercel/Netlify for admin, Expo EAS for mobile, Firebase for backend

## 📱 Features

### Mobile App
- **Authentication**: Email/password and Google sign-in
- **Swipe UI**: Tinder-like swipeable event cards with list/grid toggle
- **Event Management**: Browse, search, and register for events
- **Ticket Management**: View tickets with QR codes for check-in
- **Host Dashboard**: Create and manage events (for approved hosts)
- **Push Notifications**: Real-time updates via FCM

### Admin Dashboard
- **User Management**: Approve host applications, manage user roles
- **Event Management**: Approve/publish events, content moderation
- **Payment Management**: Record manual payments, track payment history
- **Analytics**: Event metrics, revenue reports, user statistics
- **Audit Logs**: Track all admin actions and system events

### Backend Services
- **Manual Payment Processing**: Admin-managed payment recording and tracking
- **Role Management**: Admin approval workflow for host privileges
- **QR Code Generation**: Secure ticket validation system
- **Real-time Updates**: Firestore listeners for live data sync

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Firebase project
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd events-marketplace
npm run install:all
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Update .env with your credentials:
# - Firebase configuration
# - Admin credentials
```

### 3. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase use --add

# Deploy security rules
firebase deploy --only firestore:rules,storage:rules
```

### 4. Deploy Cloud Functions
```bash
npm run deploy:functions
```

### 5. Run Applications

#### Mobile App (Expo Go)
```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

#### Admin Dashboard
```bash
cd admin
npm run dev
# Open http://localhost:3000
```

## 📁 Project Structure

```
events-marketplace/
├── mobile/                 # React Native Expo app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # Firebase and API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── App.tsx
│   └── package.json
├── admin/                  # Next.js admin dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API and Firebase services
│   │   └── types/          # TypeScript types
│   └── package.json
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts        # Function implementations
│   └── package.json
├── scripts/                # Setup and utility scripts
│   ├── setup.js           # Initial setup script
│   └── seed-data.js       # Database seeding
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
└── package.json           # Root package.json
```

## 🔧 Configuration

### Firebase Configuration
1. Create a new Firebase project
2. Enable Authentication, Firestore, Storage, and Functions
3. Add your web app to get configuration keys
4. Update `.env` with your Firebase config

### Stripe Configuration
1. Create a Stripe account and get API keys
2. Create a product for host subscriptions
3. Set up webhook endpoint pointing to your Cloud Function
4. Configure webhook events and get webhook secret
5. Update `.env` with Stripe keys

### Environment Variables
```bash
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific workspace tests
npm run test:mobile
npm run test:admin
npm run test:functions
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Mobile App (Expo EAS)
```bash
cd mobile
npx eas build --platform all
npx eas submit --platform all
```

### Admin Dashboard (Vercel)
```bash
cd admin
npm run build
# Deploy to Vercel via CLI or GitHub integration
```

### Cloud Functions
```bash
npm run deploy:functions
```

## 🔐 Security

### Firebase Security Rules
- Users can only read/update their own profiles
- Events are only readable when published and approved
- Tickets are only accessible by owners and event hosts
- Admin operations require proper role verification

### Stripe Security
- Webhook signature verification
- Server-side payment processing only
- Secure customer data handling

### Data Privacy
- GDPR-compliant data handling
- User data deletion capabilities
- Secure authentication flows

## 📊 Monitoring & Analytics

### Firebase Analytics
- User engagement tracking
- Event performance metrics
- Conversion funnel analysis

### Stripe Dashboard
- Revenue tracking
- Subscription metrics
- Payment failure monitoring

### Admin Logs
- All admin actions logged
- User role changes tracked
- System events monitored

## 🛠️ Development

### Code Quality
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Husky for pre-commit hooks

### Git Workflow
- Feature branches for new development
- Pull requests for code review
- Automated testing on CI/CD

### Local Development
```bash
# Start all services
npm run dev:mobile    # Mobile app
npm run dev:admin     # Admin dashboard
npm run serve         # Firebase emulators
```

## 📚 API Documentation

### Cloud Functions
- `createCheckoutSession`: Create Stripe checkout sessions
- `approveHostApplication`: Admin function to approve hosts
- `generateTicketQRCode`: Generate QR codes for tickets
- `stripeWebhook`: Handle Stripe webhook events

### Firestore Collections
- `users`: User profiles and roles
- `events`: Event information and metadata
- `tickets`: Ticket purchases and QR codes
- `payments`: Payment records and history
- `notifications`: User notifications
- `adminLogs`: Admin action audit trail

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Check API keys in `.env`
   - Verify Firebase project configuration
   - Ensure Authentication is enabled

2. **Stripe Webhook Failures**
   - Verify webhook URL is correct
   - Check webhook secret configuration
   - Review Cloud Function logs

3. **Expo Build Issues**
   - Clear Expo cache: `expo r -c`
   - Check app.json configuration
   - Verify all dependencies are installed

4. **Firestore Permission Errors**
   - Review security rules
   - Check user authentication status
   - Verify document structure

### Getting Help
- Check Firebase Console for error logs
- Review Stripe Dashboard for payment issues
- Use Firebase Emulator Suite for local debugging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Built with ❤️ using React Native, Next.js, Firebase, and Stripe**
