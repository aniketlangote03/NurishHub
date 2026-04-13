# PROJECT SCOPE DOCUMENT

## Project Title
NurishHub — Food Donation & Redistribution System

## Student Details
**Name:** [Your Name]
**Roll No:** [Your Roll No]
**Branch:** [Your Branch/Department]
**Academic Year:** 2023-2024 / 2024-2025

---

## 1. User Requirements

### 1.1 Guest User
- **Browse system:** View the landing page to understand the platform's mission and how it works.
- **View details:** See public platform statistics (e.g., total meals served, total food waste reduced).
- **Register:** Sign up for an account by selecting a specific role (Food Donor, NGO/Receiver, or Delivery Volunteer).

### 1.2 End User (Donor / NGO / Volunteer)
- **Register/Login:** Securely log in using email and password with JWT-based authentication.
- **Use main features:** 
  - *Donor:* Post surplus food listings with location, approve NGO requests.
  - *NGO:* Search for nearby available food using map proximity, send requests to claim food.
  - *Volunteer:* Accept pickup assignments, update live location during transit, input verification OTPs.
- **Manage profile:** Update personal details, contact information, avatars, and specific settings like NGO registration numbers or Volunteer vehicle types and active availability.

### 1.3 Admin
- **Manage system:** Oversee all platform activities, active donations, and delivery statuses in real-time.
- **Control users:** Verify newly registered NGOs to ensure authenticity, deactivate suspicious accounts, and moderate user feedback/ratings.
- **View analytics:** Access a comprehensive dashboard featuring charts on total waste reduced, daily app usage, and user growth.

---

## 2. Module Specifications

### 2.1 User Interface Module
- **Home page:** Landing page featuring the mission, impact stats, and call-to-action buttons for registration.
- **Listing page:** A feed of available food donations, filterable by food type (veg/non-veg) and sorted by geo-location (nearest first).
- **Detail page:** Dedicated pages for individual donations showing food images, expiry time, donor details, and current status.
- **Profile:** Role-specific dashboards outlining past activity (e.g., "My Donations," "My Pickups").

### 2.2 Authentication Module
- **Login/Register:** Form-based authentication generating Access and Refresh tokens to maintain secure sessions.
- **Role-based access:** Middleware protection ensuring users only access endpoints permitted for their specific account type (e.g., only NGOs can request food).
- **Security:** Password hashing via bcrypt, cross-origin resource sharing (CORS), input validation, and route-specific rate limiting to prevent brute-force attacks.

### 2.3 Main Functional Module
- **Core feature 1 (Donation & Discovery):** Donors create listings with exact geographic coordinates. NGOs query the database using "$near" geospatial indexes to find the closest available food before it expires.
- **Core feature 2 (Request & Matchmaking):** NGOs submit claims for food. Donors review and approve these claims, which triggers the system to lock the donation to that specific NGO.
- **Core feature 3 (Logistics Tracking):** An automatic matchmaking algorithm (or donor) assigns a volunteer based on proximity and ratings. The volunteer uses the app to transition the status from "En Route" to "Picked Up" to "Delivered," utilizing OTP verification at both ends.

### 2.4 Admin Module
- **Manage data:** Full CRUD (Create, Read, Update, Delete) access to override stalled deliveries, delete expired donations, or manage complaints.
- **Reports:** Generation of aggregate data metrics (using MongoDB aggregations) to show total kilograms of food saved and system efficiency over time.
- **Controls:** Ability to hide offensive feedback reviews and toggle system-wide settings.

### 2.5 Notification Module
- **Alerts:** Triggered database notifications for key lifecycle events (e.g., "Your request was approved," "Volunteer is arriving").
- **Updates:** Real-time WebSockets (Socket.io) integration for live GPS location tracking of volunteers, instant chat messages between parties, and instant unread notification badges.

---

## 3. Technology Stack
- **Frontend:** React.js (Vite), Context API, CSS/Tailwind
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (NoSQL) with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT), bcrypt encryption
- **Hosting:** Netlify (Frontend), Render (Backend)
- **Tools:** Socket.io (Real-time), Multer (Image Uploads), Node-Cron (Automated background tasks)
