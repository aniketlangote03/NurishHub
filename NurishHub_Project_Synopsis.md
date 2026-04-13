# PROJECT SYNOPSIS

## Project Title
NurishHub — Food Donation & Redistribution System

## Project Details
**Project Name:** NurishHub
**Project Type:** Full-Stack Web Application
**Technology:** MERN Stack (MongoDB, Express.js, React.js, Node.js) + Socket.io
**Academic Year:** 2025-2026

---

## 1. Introduction
NurishHub is a real-time, location-based food donation and redistribution platform designed to bridge the gap between food surplus and food scarcity. It provides a seamless digital ecosystem where food donors (restaurants, caterers, individuals) can list excess food, and verified NGOs can claim it. To solve the logistical hurdle of food delivery, the system incorporates a network of volunteers who act as delivery agents, creating a completely closed-loop system for food recovery. 

---

## 2. Problem Statement
- **Problem 1:** Massive amounts of edible food are wasted daily by restaurants, events, and individuals simply because connecting with those in need is difficult.
- **Problem 2:** Even when donors and NGOs connect, the physical transportation (logistics) of the food from the donor to the beneficiary is a major bottleneck due to lack of resources.
- **Problem 3:** Food is a perishable entity. A lack of real-time communication and urgency tracking leads to food spoiling before it can be successfully redistributed.
- **Impact:** Significant environmental degradation from food waste in landfills, while simultaneously millions of people go hungry due to an inefficient distribution pipeline.

---

## 3. Objectives of the Proposed System
1. To create a centralized, location-aware platform connecting food donors with nearby NGOs.
2. To build an independent volunteer logistics network to handle the pickup and delivery of donated food.
3. To implement real-time geo-spatial tracking and status updates to ensure perishable food is delivered before expiry.
4. To provide a secure communication channel (real-time chat) between donors, NGOs, and volunteers to coordinate handoffs.
5. To generate actionable analytics on food saved, waste reduced, and volunteer performance to encourage platform engagement.

---

## 4. Scope of the Proposed System
**In-Scope Features**
- Role-based access control (Donor, NGO, Volunteer, Admin).
- Location-based (GeoJSON) searching for nearby donations and volunteers.
- End-to-end donation workflow (Creation → Request → Approval → Pickup → Delivery).
- Real-time in-app chat and push notifications (Socket.io).
- OTP-based secure handoff verification at pickup and delivery.
- Automated cron jobs for marking expired donations.

**Out-of-Scope (Future Scope)**
- Monetary donations and payment gateway integrations.
- AI-based route optimization for volunteers carrying multiple pickups.
- Machine Learning algorithms to predict location-based food demand.
- Integration with external delivery partners (e.g., Dunzo, Uber Connect).

---

## 5. Technology Stack
- **Frontend:** React.js (Vite), Context API, Axios, Tailwind CSS (or standard CSS).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Authentication:** JSON Web Tokens (JWT) & bcrypt.
- **Hosting:** Render (Backend), Netlify (Frontend).
- **Other Tools:** Socket.io (Real-time updates), Multer (File uploads), Winston (Logging), node-cron (Task scheduling).

---

## 6. Modules
1. **Authentication & User Module**
   - Handles secure registration, login with JWT rotation, role assignments, and profile management (including avatar uploads).

2. **Donation Management Module**
   - Allows donors to create food listings with categories, quantities, expiry times, and precise geolocation.

3. **Request & Matching Module**
   - Enables NGOs to browse nearby donations, raise requests, and allows donors/admins to approve them. Automatically assigns highest-rated nearby volunteers.

4. **Logistics & Pickup Tracking Module**
   - Manages the volunteer workflow: accepting tasks, verifying OTPs, updating transit status, and freeing availability post-delivery.

5. **Real-Time Communication Module**
   - Facilitates real-time chat between assigned users and pushes instant system notifications for status changes.

6. **Admin & Analytics Module**
   - Provides a comprehensive dashboard for the Admin to verify NGOs, manage users, moderate feedback, and track key metrics (e.g., total food saved).

---

## 7. Business Use Cases
**Actors:**
- **Donor:** Posts food, approves requests, tracks pickup.
- **NGO:** Finds nearby food, requests it, receives delivery.
- **Volunteer:** Accepts delivery tasks, updates transit status, confirms handoffs.
- **Admin:** Verifies users, monitors system health, views analytics.

**Use Cases:**
- **Register/Login:** Secure authentication with role selection.
- **Donation Flow (Main Feature):** Donor creates → NGO requests → Donor approves → Volunteer assigned → Volunteer picks up → Volunteer delivers.
- **Live Location Tracking:** Volunteers update their location during transit for NGOs to track.
- **Admin Control:** Admin verifies new NGO applications to ensure food goes to legitimate organizations.
- **Feedback Loop:** Post-delivery rating system for quality control and volunteer scoring.

---

## 8. Database / Data Structure
**Tables / Collections:**
- `Users`: Stores all roles. Contains fields like name, email, role, password, location (GeoJSON), and role-specific details (e.g., vehicle type for volunteers).
- `Donations`: Details of the food (foodName, quantity, expiryTime, location), referencing `donorId`, `allocatedTo` (NGO), and `assignedVolunteer`.
- `Requests`: Represents an NGO's intent to claim food (`ngoId`, `donationId`, status).
- `Pickups`: Tracks the delivery phase (`volunteerId`, `donationId`, status, pickup/delivery OTPs).
- `Messages` & `Notifications`: For storing chat history and system alerts.
- `Feedback`: Reviews linking a rater to a target user and specific donation/pickup.

**Relationships:**
- A **Donor** (User) has many **Donations** (1:N).
- A **Donation** has many **Requests** (1:N) but only one approved Request.
- A **Donation** belongs to one **Pickup** (1:1 during delivery phase).

**Important Fields:**
- `location.coordinates`: Uses MongoDB `2dsphere` index for `$near` proximity searches.
- `status` (Donation): Transitions strictly (pending → requested → accepted → assigned → picked_up → delivered).

---

## 9. Architecture / Diagram
*(Note for User: Insert your actual diagrams here. Below is a text representation of the architecture)*

**System Architecture:** Client-Server Model
```
[ Frontend (React SPA on Netlify) ]
         |           | (Socket.io)
   (REST API)      [ Real-Time Engine ]
         |           |
[ Backend (Node/Express on Render) ]
         |
[ MongoDB Atlas (Cloud Database) ]
```

---

## 10. Conclusion
The NurishHub project successfully provides an automated, end-to-end framework to combat food wastage. By leveraging real-time technologies, precise geo-location algorithms, and an independent volunteer logistics layer, it removes the friction usually associated with food redistribution. The system ensures that surplus food reaches those in need swiftly, safely, and transparently, contributing positively to both social welfare and environmental sustainability.
