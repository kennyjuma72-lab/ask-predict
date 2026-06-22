# 🧪 Testing Guide - Events Marketplace

## 🚀 **Both Apps Are Now Running!**

### 📱 **Mobile App (Expo)**
- **Status**: ✅ Running in background
- **URL**: Check your terminal for the Expo development server
- **How to Test**: 
  1. Install **Expo Go** app on your phone
  2. Scan the QR code from your terminal
  3. The app will load on your phone

### 🖥️ **Admin Dashboard (Next.js)**
- **Status**: ✅ Running in background  
- **URL**: http://localhost:3000
- **How to Test**: Open your browser and go to http://localhost:3000

---

## 📋 **Testing Checklist**

### **Mobile App Testing:**

#### ✅ **Authentication Flow**
- [ ] Open the app on your phone via Expo Go
- [ ] Test the login screen
- [ ] Test the signup screen  
- [ ] Test the forgot password screen

#### ✅ **Event Browsing**
- [ ] Browse events on the home screen
- [ ] Test the swipe functionality in Events tab
- [ ] Switch between Swipe/List/Grid views
- [ ] Test event detail screen
- [ ] Try the "Contact to Register" button

#### ✅ **Profile & Settings**
- [ ] View your profile
- [ ] Test the "Apply to Become a Host" button
- [ ] Check the settings screen

### **Admin Dashboard Testing:**

#### ✅ **Dashboard Overview**
- [ ] Open http://localhost:3000 in your browser
- [ ] Check the dashboard stats
- [ ] View recent activity

#### ✅ **Payment Management**
- [ ] Go to the Payments page
- [ ] Click "Record Payment" button
- [ ] Fill out the payment form
- [ ] Submit a test payment
- [ ] View the payment in the history table

#### ✅ **Navigation**
- [ ] Test all navigation links
- [ ] Check responsive design on different screen sizes

---

## 🔧 **What You Can Test Right Now**

### **Mobile App Features:**
1. **Swipe UI**: Swipe left/right on event cards
2. **Event Details**: Tap on events to see full details
3. **Registration Flow**: Try the "Contact to Register" button
4. **Profile Management**: View and edit your profile
5. **Navigation**: Switch between tabs (Home, Events, Tickets, Profile)

### **Admin Dashboard Features:**
1. **Payment Recording**: Record manual payments
2. **Payment History**: View all recorded payments
3. **Dashboard Stats**: See system overview
4. **Recent Activity**: Track admin actions

---

## 🎯 **Key Features to Test**

### **Manual Payment System:**
- ✅ No Stripe integration - everything is manual
- ✅ Admin records payments through the dashboard
- ✅ Users contact admin/organizer to register
- ✅ Simple payment tracking and history

### **Event Management:**
- ✅ Browse events with swipe interface
- ✅ View event details and pricing
- ✅ Contact-based registration system
- ✅ QR code generation for tickets

### **User Management:**
- ✅ Role-based access (attendee/host/admin)
- ✅ Manual host approval process
- ✅ Profile management

---

## 🐛 **If You Encounter Issues**

### **Mobile App Issues:**
- Make sure Expo Go is installed on your phone
- Check that your phone and computer are on the same WiFi network
- Try refreshing the Expo app

### **Admin Dashboard Issues:**
- Make sure the server is running on http://localhost:3000
- Check the terminal for any error messages
- Try refreshing the browser

### **Firebase Issues:**
- The app uses your Firebase project: `mobi-c064c`
- Make sure Firebase is properly configured
- Check the `.env` file has the correct Firebase keys

---

## 🎉 **You're All Set!**

Both your mobile app and admin dashboard are now running and ready for testing. The system uses a manual payment approach where:

1. **Users** browse events and contact organizers to register
2. **Admins** record payments manually through the dashboard
3. **Hosts** can create events after admin approval
4. **Tickets** are generated with QR codes for check-in

Enjoy testing your Events Marketplace! 🚀
