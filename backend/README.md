# 🍱 Food Donation & Redistribution System — Backend

A production-ready REST API built with **Node.js**, **Express.js**, and **MongoDB**, powering all 11 modules of the Food Donation & Redistribution platform.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh Tokens) |
| Real-time | Socket.io 4.x |
| Validation | express-validator |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting |
| Scheduler | node-cron |

---

## 📁 Folder Structure

```
backend/
├── config/
│   ├── db.js           # MongoDB connection
│   ├── logger.js       # Winston logger
│   ├── socket.js       # Socket.io handler
│   └── cron.js         # Scheduled jobs
├── models/
│   ├── User.js         # Users (Donor/NGO/Volunteer/Admin)
│   ├── Donation.js     # Food donations
│   ├── Request.js      # NGO requests
│   ├── Pickup.js       # Volunteer pickups
│   ├── Feedback.js     # Ratings & reviews
│   ├── Message.js      # Chat messages
│   └── Notification.js # In-app notifications
├── controllers/
│   ├── authController.js
│   ├── donationController.js
│   ├── requestController.js
│   ├── pickupController.js
│   ├── chatController.js
│   ├── feedbackController.js
│   ├── adminController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js         # JWT + RBAC middleware
│   ├── error.js        # Global error handler
│   └── validate.js     # express-validator rules
├── routes/
│   ├── authRoutes.js
│   ├── donationRoutes.js
│   ├── requestRoutes.js
│   ├── pickupRoutes.js
│   ├── chatRoutes.js
│   ├── feedbackRoutes.js
│   ├── adminRoutes.js
│   └── notificationRoutes.js
├── logs/               # Auto-created at runtime
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js           # Entry point
```

---

## ⚙️ Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas URI in .env
```

### 4. Run the server
```bash
npm run dev      # Development (nodemon)
npm start        # Production
```

Server starts at: **http://localhost:5000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/auth/logout` | Auth |
| GET | `/api/auth/me` | Auth |
| PUT | `/api/auth/update-profile` | Auth |
| PUT | `/api/auth/change-password` | Auth |

### Donations
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/donations` | Donor |
| GET | `/api/donations` | Auth |
| GET | `/api/donations/nearby?lat=&lng=&radius=` | Auth |
| GET | `/api/donations/my` | Donor |
| GET | `/api/donations/:id` | Auth |
| PUT | `/api/donations/:id` | Donor/Admin |
| DELETE | `/api/donations/:id` | Donor/Admin |

### NGO Requests
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/requests` | NGO |
| GET | `/api/requests` | Auth |
| GET | `/api/requests/:id` | Auth |
| PUT | `/api/requests/:id/approve` | Donor/Admin |
| PUT | `/api/requests/:id/reject` | Donor/Admin |
| PUT | `/api/requests/:id/cancel` | NGO/Admin |

### Pickup
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/pickup/assign` | Admin/Donor/NGO |
| PUT | `/api/pickup/status` | Volunteer/Admin |
| GET | `/api/pickup/nearby-volunteers?lat=&lng=` | Admin/NGO |
| GET | `/api/pickup` | Auth |
| GET | `/api/pickup/:id` | Auth |

### Chat
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/messages` | Auth |
| GET | `/api/messages` | Auth |
| GET | `/api/messages/unread/count` | Auth |
| GET | `/api/messages/:userId` | Auth |
| DELETE | `/api/messages/:id` | Auth |

### Feedback
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/feedback` | Auth |
| GET | `/api/feedback` | Auth |
| GET | `/api/feedback/:id` | Auth |
| POST | `/api/feedback/:id/reply` | Auth |
| DELETE | `/api/feedback/:id` | Admin |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/dashboard-summary` | Admin |
| GET | `/api/admin/analytics?period=30` | Admin |
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| PUT | `/api/admin/users/:id` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/donations` | Admin |
| PUT | `/api/admin/ngo/:id/verify` | Admin |

### Notifications
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/notifications` | Auth |
| PUT | `/api/notifications/read-all` | Auth |
| DELETE | `/api/notifications/clear-all` | Auth |
| PUT | `/api/notifications/:id/read` | Auth |
| DELETE | `/api/notifications/:id` | Auth |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `chat:typing` | `{ receiverId }` | Typing indicator |
| `chat:stop-typing` | `{ receiverId }` | Stop typing |
| `pickup:location-update` | `{ pickupId, coordinates }` | Volunteer GPS update |
| `pickup:track` | `{ pickupId }` | Join tracking room |
| `pickup:untrack` | `{ pickupId }` | Leave tracking room |
| `donations:subscribe` | `{ lat, lng, radius }` | Subscribe to nearby alerts |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:received` | `{ messageId, senderId, text }` | New chat message |
| `notification:new` | `{ type, ... }` | New notification |
| `pickup:update:{pickupId}` | `{ status, currentLocation }` | Pickup status/location |
| `donation:new` | `{ donationId, foodName }` | New donation posted |
| `donation:cancelled` | `{ donationId }` | Donation cancelled |
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |

---

## 🛡️ Roles & Permissions

| Feature | Donor | NGO | Volunteer | Admin |
|---------|-------|-----|-----------|-------|
| Post Donation | ✅ | ❌ | ❌ | ✅ |
| Request Donation | ❌ | ✅ | ❌ | ✅ |
| Approve Request | ✅ | ❌ | ❌ | ✅ |
| Assign Pickup | ✅ | ✅ | ❌ | ✅ |
| Update Pickup Status | ❌ | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |

---

## 🌍 Geo Queries

MongoDB **2dsphere** indexes are created on `Donation.location` and `User.location`.

**Nearby Donations:**
```
GET /api/donations/nearby?lat=12.9716&lng=77.5946&radius=10
```

**Nearby Volunteers:**
```
GET /api/pickup/nearby-volunteers?lat=12.9716&lng=77.5946&radius=15
```

---

## 📅 Cron Jobs

| Schedule | Task |
|----------|------|
| Every 15 min | Auto-expire donations past their `expiryTime` |
| Every 30 min | Send expiry warning notifications (1hr before expiry) |

---

## 🔧 Health Check

```
GET /health
```
Returns server status, environment, and uptime.
