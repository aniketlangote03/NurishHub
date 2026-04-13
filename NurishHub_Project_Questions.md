# 🍱 NurishHub — Comprehensive Viva / Interview Questions

> **Project:** Food Donation & Redistribution System (NurishHub v2.0)  
> **Stack:** Node.js · Express.js · MongoDB Atlas · Socket.io · React (Vite) · Axios  
> **Roles:** Donor, NGO, Volunteer, Admin

---

## 📌 Table of Contents

1. [Project Overview & Concept](#1-project-overview--concept)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Database Design & Models](#3-database-design--models-mongodbmongoose)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Routes & REST Design](#5-api-routes--rest-design)
6. [Controllers & Business Logic](#6-controllers--business-logic)
7. [Middleware](#7-middleware)
8. [Real-Time Features (Socket.io)](#8-real-time-features-socketio)
9. [Matching & Geo-Location System](#9-matching--geo-location-system)
10. [Frontend (React + Vite)](#10-frontend-react--vite)
11. [State Management & Context API](#11-state-management--context-api)
12. [API Integration (Axios)](#12-api-integration-axios)
13. [Security](#13-security)
14. [Error Handling](#14-error-handling)
15. [Cron Jobs & Automation](#15-cron-jobs--automation)
16. [File Uploads](#16-file-uploads)
17. [Deployment & DevOps](#17-deployment--devops)
18. [Testing & Debugging](#18-testing--debugging)
19. [Workflow & End-to-End Scenarios](#19-workflow--end-to-end-scenarios)
20. [Code-Level Deep Dive Questions](#20-code-level-deep-dive-questions)
21. [Scalability & Future Improvements](#21-scalability--future-improvements)

---

## 1. Project Overview & Concept

**Q1.1:** What is NurishHub and what problem does it solve?  
**A:** NurishHub is a Food Donation & Redistribution System that connects food donors (restaurants, caterers, individuals) with NGOs who serve beneficiaries. Volunteers act as a logistics layer to pick up and deliver donations. It reduces food waste while feeding the hungry.

---

**Q1.2:** What are the four user roles in the system and what can each role do?  
**A:**  
- **Donor** — Posts food donations, manages their listings, approves/rejects NGO requests.
- **NGO** — Browses available donations, raises requests, receives delivered food.
- **Volunteer** — Gets assigned to pickups, updates pickup status through delivery lifecycle.
- **Admin** — Manages all users, verifies NGOs, views analytics dashboard, oversees all operations.

---

**Q1.3:** Explain the complete lifecycle of a food donation from creation to delivery.  
**A:** Donor creates donation (status: `pending`) → NGO discovers it and raises a request → Donor/Admin approves request (status: `accepted`, `allocatedTo` set to NGO) → Admin/Donor assigns a volunteer (status: `assigned`) → Volunteer accepts → picks up → delivers → status becomes `delivered`. If food expires before pickup, a cron job marks it as `expired`.

---

**Q1.4:** Why did you choose this tech stack (Node.js, Express, MongoDB, React)?  
**A:** Node.js is ideal for I/O-heavy, real-time applications with its non-blocking event loop. Express provides a minimal REST framework. MongoDB's flexible schema fits food data with varying attributes. React on the frontend gives a component-based SPA with fast rendering. Socket.io enables real-time notifications and chat.

---

**Q1.5:** What are the key modules/features of this application?  
**A:** Auth, Donations CRUD, NGO Requests, Volunteer Pickup tracking, Real-time Chat, Matching/Geo-queries, Notifications, Feedback/Ratings, Admin analytics, File uploads, Cron-based auto-expiry, Swagger API docs.

---

## 2. Architecture & Tech Stack

**Q2.1:** Describe the overall architecture of the project. Is it monolithic or microservices?  
**A:** It is a monolithic full-stack application with a clear separation between frontend (React SPA deployed on Netlify) and backend (Express API deployed on Render). They communicate over REST APIs and WebSocket (Socket.io).

---

**Q2.2:** Explain the directory structure of the backend. Why is it organized this way?  
**A:** The backend follows an MVC-like pattern:
- `models/` — Mongoose schemas (data layer)
- `controllers/` — Business logic (logic layer)
- `routes/` — Express route definitions (presentation layer)
- `middleware/` — Auth, validation, error handling, rate limiting (cross-cutting concerns)
- `config/` — DB connection, logger, cron, CORS, Swagger
- `sockets/` — Socket.io handlers
- `services/` — Business services like matching algorithm
- `utils/` — Helper functions

---

**Q2.3:** How does the frontend communicate with the backend?  
**A:** Via Axios HTTP client. An `api.js` service module creates an Axios instance with `baseURL` set to `VITE_API_URL`. Request interceptors attach the JWT `Bearer` token. Response interceptors unwrap the `response.data` and handle 401 errors by redirecting to login.

---

**Q2.4:** What is `server.js` doing and in what order?  
**A:**  
1. Loads env vars (`dotenv`), validates production environment, bootstraps JWT secrets
2. Sets up Express app + HTTP server
3. Initializes Socket.io with CORS + JWT auth
4. Applies Helmet, CORS, rate limiters
5. Configures body parsing, static file serving, Morgan HTTP logging
6. Sets up Swagger docs
7. Mounts all API routes under `/api/*`
8. Registers 404 + global error handlers
9. Connects to MongoDB, starts listening, initializes cron jobs
10. Sets up graceful shutdown handlers for SIGTERM/SIGINT

---

**Q2.5:** What is the purpose of `httpServer` vs `app` in server.js?  
**A:** `app` is the Express application. `httpServer = http.createServer(app)` wraps it in a raw HTTP server, which is required for Socket.io to attach to. Socket.io cannot attach directly to an Express app — it needs the underlying HTTP server.

---

## 3. Database Design & Models (MongoDB/Mongoose)

**Q3.1:** List all the Mongoose models in this project and their relationships.  
**A:**  
- **User** — Central model (Donor/NGO/Volunteer/Admin)
- **Donation** — `donorId` → User, `allocatedTo` → User (NGO), `assignedVolunteer` → User
- **Request** — `ngoId` → User, `donationId` → Donation
- **Pickup** — `volunteerId` → User, `donationId` → Donation, `requestId` → Request, `ngoId` → User
- **Message** — `senderId` → User, `receiverId` → User, `donationRef` → Donation
- **Notification** — `userId` → User
- **Feedback** — `userId` → User, `targetUserId` → User, `donationId` → Donation, `pickupId` → Pickup

---

**Q3.2:** What is GeoJSON and how is it used in the User and Donation models?  
**A:** GeoJSON is a format for encoding geographic data. The `location` field uses `{ type: 'Point', coordinates: [longitude, latitude] }`. MongoDB's `2dsphere` index enables geo-spatial queries like `$near` and `$geoWithin`, allowing features like "find nearby donations" and "find nearby volunteers."

---

**Q3.3:** Explain the `2dsphere` index. Where is it used and why?  
**A:** A `2dsphere` index supports queries that calculate geometries on an earth-like sphere. It's created on:
- `User.location` — find nearby volunteers
- `Donation.location` — find nearby donations
- `Pickup.pickupLocation`, `deliveryLocation`, `currentLocation` — track delivery routing

---

**Q3.4:** What is `select: false` in the User model's password field?  
**A:** It tells Mongoose to exclude the `password` field from query results by default. When you do `User.find()`, password won't be included. To explicitly include it (e.g., for login), you use `.select('+password')`.

---

**Q3.5:** Explain the `pre('save')` hook on the User model.  
**A:** Before saving a User document, it checks if the `password` field was modified (`this.isModified('password')`). If yes, it hashes the password using `bcrypt` with 12 salt rounds. This ensures passwords are never stored in plaintext and re-hashing only happens when the password actually changes.

---

**Q3.6:** What is a partial filter expression and where is it used?  
**A:** In the Request model, a compound unique index `{ ngoId: 1, donationId: 1 }` has a `partialFilterExpression: { status: { $in: ['pending', 'approved'] } }`. This means the unique constraint only applies to requests with status `pending` or `approved` — a cancelled or rejected request won't block a new request from the same NGO.

---

**Q3.7:** What is the `pre(/^find/)` hook on the Donation model? What are its implications?  
**A:** It auto-populates the `donorId` reference every time a find query is run (including `find`, `findOne`, `findById`). This means every donation query automatically joins donor name, email, phone, etc. The downside is it adds an extra DB query for every find operation — which could be a performance concern at scale.

---

**Q3.8:** What is a Mongoose virtual? Explain the `isValid` virtual on Donation.  
**A:** A virtual is a computed property that doesn't get persisted to the database. `isValid` returns `true` if the current time is before `expiryTime` AND the donation status is `pending` or `available`. It's calculated on-the-fly whenever accessed.

---

**Q3.9:** Explain the TTL index on the Notification model.  
**A:** `notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })` creates a TTL (Time-To-Live) index. MongoDB automatically deletes documents 90 days (7,776,000 seconds) after their `createdAt` timestamp. This is self-cleaning — no cron job needed for notification cleanup.

---

**Q3.10:** What donation statuses exist and what does each represent?  
**A:** `pending` (just created), `available` (legacy: open), `requested` (NGO raised request), `accepted` (NGO approved, allocated), `assigned` (volunteer assigned), `picked_up`, `delivered`, `expired` (auto by cron), `cancelled`.

---

## 4. Authentication & Authorization

**Q4.1:** Explain the JWT-based authentication flow in this project.  
**A:**  
1. User registers/logs in → server generates access token (7d expiry) + refresh token (30d expiry) using `jwt.sign()`.
2. Refresh token is stored in the User document in DB.
3. Client stores tokens in `localStorage` and sends the access token as `Authorization: Bearer <token>` header.
4. The `protect` middleware verifies the token with `jwt.verify()`, fetches the user from DB, and attaches `req.user`.

---

**Q4.2:** What is the difference between access token and refresh token? How is refresh handled?  
**A:** Access token is short-lived (7d) for API access. Refresh token is longer-lived (30d) for getting new access tokens without re-login. When the access token expires, the client calls `POST /api/auth/refresh` with the refresh token. The server verifies it, checks it matches the DB-stored token, then issues both new tokens (token rotation).

---

**Q4.3:** What is the `protect` middleware doing step by step?  
**A:**  
1. Extracts token from `Authorization` header or cookies
2. Returns 401 if no token found
3. Verifies token with `jwt.verify(token, JWT_SECRET)`
4. Fetches the user from DB (ensures user still exists)
5. Checks `user.isActive` — blocks deactivated accounts
6. Attaches `req.user` for downstream use
7. Handles `JsonWebTokenError` and `TokenExpiredError` specifically

---

**Q4.4:** How does the `authorize` middleware work? Give an example.  
**A:** `authorize(...roles)` is a higher-order function that returns middleware. It checks if `req.user.role` is in the allowed `roles` array. Example: `authorize('donor', 'admin')` allows only donors and admins. If role doesn't match, it returns 403.

---

**Q4.5:** What is the `optionalAuth` middleware and when would you use it?  
**A:** It tries to verify a token if present, but doesn't block the request if no token exists. Useful for endpoints that serve both authenticated and public users (e.g., public donation listings where logged-in users see personalized data).

---

**Q4.6:** Why does the `generateTokens` function embed the `role` in the access token?  
**A:** The role is included so that the token itself carries authorization info — useful for quick role checks without a DB query. However, in this project the `protect` middleware still fetches the user from DB for every request (for freshness), so the embedded role is redundant but serves as a trust anchor.

---

**Q4.7:** Is storing JWT in `localStorage` secure? What are the risks?  
**A:** It's vulnerable to XSS attacks — if an attacker injects JavaScript, they can read `localStorage`. A more secure alternative would be HTTP-only cookies, which JavaScript cannot access. The project also supports cookie-based tokens (`req.cookies.token`) but the frontend uses `localStorage`.

---

## 5. API Routes & REST Design

**Q5.1:** List all the main API route groups and their base paths.  
**A:**

| Route Group | Base Path | Purpose |
|---|---|---|
| Auth | `/api/auth` | Register, Login, Refresh, Logout, Profile |
| Users | `/api/users` | Profile management, avatar upload |
| Donations | `/api/donations` | CRUD, nearby search, my donations |
| Requests | `/api/requests` | NGO requests, approve/reject/cancel |
| Pickup | `/api/pickup` | Assign volunteer, update status, nearby volunteers |
| Matching | `/api/matching` | Geo-based matching, auto-assign, stats |
| Messages | `/api/messages` | Chat messages, contacts, unread count |
| Feedback | `/api/feedback` | Submit/view/reply to feedback |
| Notifications | `/api/notifications` | CRUD, mark read, clear all |
| Admin | `/api/admin` | User management, analytics, NGO verification |

---

**Q5.2:** Why are specific routes like `/donations/nearby` and `/donations/my` defined BEFORE `/:id`?  
**A:** Express matches routes in order. If `/:id` is defined first, `/nearby` would be parsed as an ID parameter (`:id = 'nearby'`). By placing specific routes first, they match correctly before the parameterized catch-all.

---

**Q5.3:** What HTTP methods are used and what do they represent in this project?  
**A:**  
- `GET` — Read data (list donations, get profile)
- `POST` — Create resources (new donation, login, assign pickup)
- `PUT` — Update resources (update donation, change password, approve request)
- `DELETE` — Remove resources (delete donation, clear notifications)
- `PATCH` — Not used, but PUT serves partial updates here

---

**Q5.4:** Explain the route `PUT /api/requests/:id/approve`. What happens end to end?  
**A:**  
1. Route matches with `mongoIdParam('id')` validation + `authorize('donor', 'admin')`
2. `requestController.approveRequest` loads the request, verifies the donation belongs to the logged-in donor
3. Updates request status to `approved`, sets `approvedAt`
4. Updates the Donation's status to `accepted` and sets `allocatedTo` to the NGO
5. Creates a notification for the NGO
6. Emits a Socket.io event to the NGO's personal room

---

**Q5.5:** What is `router.use(protect)` doing in the route files?  
**A:** It applies the `protect` authentication middleware to ALL routes defined after it in that router. So every route in `donationRoutes.js` requires a valid JWT. This avoids repeating `protect` on each individual route.

---

## 6. Controllers & Business Logic

**Q6.1:** What is the `asyncHandler` wrapper and why is it used in every controller?  
**A:** It wraps async controller functions so that any thrown error or rejected promise is automatically caught and forwarded to Express's `next()` — the global error handler. Without it, you'd need try/catch in every controller.

---

**Q6.2:** Explain the pagination helper in `donationController.js`.  
**A:** The `getPagination` function extracts `page` and `limit` from query params, defaults to page 1 and limit 10, caps limit at 100, and calculates `skip = (page - 1) * limit`. The response includes `total`, `page`, `limit`, `pages`, `hasNext`, and `hasPrev` for frontend pagination.

---

**Q6.3:** In `createDonation`, what does `req.app.get('io')` do?  
**A:** `app.set('io', io)` was called during server setup, storing the Socket.io instance on the Express app. Controllers retrieve it with `req.app.get('io')` to emit real-time events (like `donation:new`) without directly importing the socket module — keeping controllers decoupled.

---

**Q6.4:** In `updateDonation`, why is there a check for `donation.donorId._id.toString()`?  
**A:** Because `donorId` is auto-populated (via the pre-find hook), it's a full user object, not just an ObjectId. So to compare IDs, you need `.donorId._id.toString()`. Without `.toString()`, you'd compare ObjectId objects by reference, which would fail.

---

**Q6.5:** What is the status transition validation in `pickupController.updatePickupStatus`?  
**A:** A `validTransitions` map defines which status can transition to which:
- `assigned` → `accepted` or `cancelled`
- `accepted` → `en_route_pickup` or `cancelled`
- `en_route_pickup` → `picked_up` or `failed`
- `picked_up` → `en_route_delivery`
- `en_route_delivery` → `delivered` or `failed`

This prevents invalid transitions like jumping from `assigned` to `delivered` directly, enforcing a correct logistics workflow.

---

**Q6.6:** What happens when a pickup is marked as `delivered` in the pickupController?  
**A:**  
1. Sets `deliveredAt` timestamp
2. Updates the parent Donation status to `delivered`
3. Frees the volunteer: sets `availability: true` and increments `totalPickups`
4. Creates a notification for the NGO
5. Emits real-time Socket.io events

---

**Q6.7:** Explain the admin analytics endpoint. What aggregate queries does it run?  
**A:** It runs 12 parallel aggregation queries using `Promise.all`:
- User counts by role, active status
- Donation counts by status, food type, over time (daily buckets)
- Request counts by status
- Pickup counts by status
- Average feedback rating
- Recent donations (last N days)
- Waste reduced (total kg of delivered donations)

---

**Q6.8:** What happens when a pickup `fails` or is `cancelled`?  
**A:** The volunteer is freed (availability set back to true). The donation status reverts — if it had an `allocatedTo` NGO, it goes back to `accepted`; otherwise back to `pending`. The `assignedVolunteer` on the donation is set to `null`.

---

## 7. Middleware

**Q7.1:** List all custom middleware in the project and their purposes.  
**A:**

| Middleware | File | Purpose |
|---|---|---|
| `protect` | `auth.js` | JWT verification, attach `req.user` |
| `authorize` | `auth.js` | Role-based access control |
| `optionalAuth` | `auth.js` | Non-blocking auth for public endpoints |
| `errorHandler` | `error.js` | Global error formatting & logging |
| `notFound` | `error.js` | Catches unmatched routes → 404 |
| `validate` | `validate.js` | express-validator result checker |
| `globalLimiter` | `rateLimiter.js` | 100 req/15min API-wide |
| `authLimiter` | `rateLimiter.js` | 20 req/15min for login/register |
| `messageLimiter` | `rateLimiter.js` | 60 msg/min for chat |
| `maybeParseDonationMultipart` | `donationMultipart.js` | Handles form-data for donation images |

---

**Q7.2:** Explain how `express-validator` is used in this project.  
**A:** Validators are arrays of validation chains (e.g., `body('email').isEmail()`) followed by the `validate` function that calls `validationResult(req)`. If validation fails, it returns 422 with an array of `{ field, message, value }` error objects. Each route file uses specific validators like `donationValidator`, `requestValidator`, etc.

---

**Q7.3:** What rate limiters exist and why different limits for different routes?  
**A:**
- **Global**: 100 req/15min — prevents general abuse
- **Auth**: 20 req/15min — prevents brute-force login attacks
- **Message**: 60 msg/min — prevents chat spam
- **Strict**: 5 req/15min — for sensitive operations
- **Upload**: 10/hour — prevents storage abuse

Different limits because login attempts need stricter limits than normal browsing.

---

**Q7.4:** What is the `AppError` class and how does it differ from a regular Error?  
**A:** `AppError` extends `Error` with `statusCode`, `status` (fail/error), and `isOperational` flag. In production, only `isOperational` errors show their message to users. Programming errors (500s without `isOperational`) show a generic "Something went wrong" message — preventing internal details from leaking.

---

**Q7.5:** How does the error handler differentiate between development and production?  
**A:** In development (`sendErrorDev`), it returns the full error object including stack trace. In production (`sendErrorProd`), it only returns the message for operational errors and a generic message for programming errors. It also transforms Mongoose-specific errors (CastError, duplicate key, validation) into clean `AppError` instances.

---

## 8. Real-Time Features (Socket.io)

**Q8.1:** How is Socket.io initialized and integrated with Express?  
**A:**  
1. `httpServer = http.createServer(app)` creates the HTTP server
2. `io = new Server(httpServer, { cors: {...} })` attaches Socket.io
3. `io` and `onlineUsers` are stored on the app via `app.set()`
4. Controllers access them via `req.app.get('io')`

---

**Q8.2:** How does Socket.io authentication work in this project?  
**A:** Socket.io middleware intercepts every connection attempt. It extracts the JWT from `socket.handshake.auth.token` or the `authorization` header, verifies it with `jwt.verify()`, fetches the user from DB, checks `isActive`, and attaches `socket.user`. Invalid tokens prevent connection.

---

**Q8.3:** What is the `onlineUsers` map and how is it maintained?  
**A:** It's a simple JavaScript object `{ userId: socketId }`. On connection, the user is added. On disconnect, they're removed. It's used to check if a user is online for real-time message delivery and to send the online users list to newly connected clients.

---

**Q8.4:** What Socket.io events does the application emit?  
**A:**  
- `donation:new` — broadcast when a new donation is created
- `donation:cancelled` — broadcast when a donation is cancelled
- `pickup:assigned` — sent to specific volunteer's room
- `pickup:update:<pickupId>` — real-time tracking updates
- `user:online` / `user:offline` — presence broadcasting
- `notification:new` — targeted notifications
- Chat events: `message:new`, `message:read`, etc.

---

**Q8.5:** What are Socket.io rooms and how are they used here?  
**A:** Each user joins a personal room `user_${userId}` on connection. This allows targeted messaging — e.g., `io.to('user_${volunteerId}').emit('pickup:assigned', ...)` sends only to that specific volunteer, not all connected clients.

---

**Q8.6:** What is the difference between `socket.emit`, `socket.broadcast.emit`, and `io.emit`?  
**A:**
- `socket.emit` — sends only to the specific connected client
- `socket.broadcast.emit` — sends to all clients EXCEPT the sender
- `io.emit` — sends to ALL connected clients including the sender

---

## 9. Matching & Geo-Location System

**Q9.1:** How does the geo-based nearby donations search work?  
**A:** Uses MongoDB's `$near` operator with `$geometry` (GeoJSON Point) and `$maxDistance` (radius in meters). The `2dsphere` index on `Donation.location` enables efficient spherical queries. The API takes `lat`, `lng`, `radius` (km) and converts radius to meters (* 1000).

---

**Q9.2:** What is the matching service and what algorithm does it use?  
**A:** The matching service (`matchingService.js`) finds the best NGOs and volunteers for a donation based on:
- Geographic proximity (nearest first via `$near`)
- Score calculation considering distance, availability, rating, and total pickups
- Auto-assign selects the highest-scoring available volunteer

---

**Q9.3:** Explain the `autoAssignVolunteer` endpoint workflow.  
**A:**  
1. Takes `donationId`, optional `ngoId`, `requestId`
2. Finds nearest available volunteers within range
3. Scores them (distance, rating, experience)
4. Picks the top-scoring volunteer
5. Creates a Pickup record
6. Updates Donation status to `assigned`
7. Returns the assigned volunteer and pickup details

---

**Q9.4:** Why does MongoDB use `[longitude, latitude]` instead of `[latitude, longitude]`?  
**A:** MongoDB follows the GeoJSON specification (RFC 7946), which defines coordinates as `[longitude, latitude]`. This is a common source of bugs — Google Maps and most user-facing tools use `[lat, lng]`, so the order must be swapped when storing in MongoDB.

---

## 10. Frontend (React + Vite)

**Q10.1:** What is Vite and why was it chosen over Create React App?  
**A:** Vite is a modern build tool that uses native ES modules for extremely fast development server startup and Hot Module Replacement (HMR). CRA uses Webpack which is slower. Vite also produces optimized production builds with Rollup.

---

**Q10.2:** List all the pages in the frontend and their routes.  
**A:**

| Page | Route | Access |
|---|---|---|
| Home | `/` | Public |
| Login | `/login` | Public (redirects if authenticated) |
| Register | `/register` | Public (redirects if authenticated) |
| Dashboard | `/dashboard` | Protected (all roles) |
| Donation Listing | `/donations` | Protected |
| Add/Edit Donation | `/donations/new` | Protected (donor, admin) |
| NGO Requests | `/requests` | Protected (ngo, admin, donor) |
| Volunteer Pickups | `/pickups` | Protected (volunteer, admin) |
| Admin Panel | `/admin` | Protected (admin only) |
| Chat | `/chat` | Protected |
| Feedback | `/feedback` | Protected |

---

**Q10.3:** How does the `ProtectedRoute` component work?  
**A:** It checks `isAuthenticated` and `user.role` from the `useAuth` hook. If not authenticated, it redirects to `/login`. If authenticated but the role doesn't match the `roles` prop array, it redirects to `/dashboard`. If loading, it returns `null` to avoid flash of wrong content.

---

**Q10.4:** Explain the provider nesting in `App.jsx` and why the order matters.  
**A:** `ThemeProvider > AuthProvider > NotificationProvider > ChatProvider > DonationProvider > Router`. Order matters because:
- Auth must be available before Notification and Chat (they need user info)
- Router must be inside all providers so routes can access context
- Theme wraps everything for consistent styling

---

**Q10.5:** What is `FloatingShapes` component?  
**A:** A decorative UI component that renders animated floating shapes in the background for visual appeal. It's placed outside the main content `div` but inside the Router, creating a consistent animated background across all pages.

---

## 11. State Management & Context API

**Q11.1:** How many React Context providers does the app use and what does each manage?  
**A:**
- **AuthContext** — User authentication state, login/logout, token management
- **ThemeContext** — Light/dark mode toggle
- **NotificationContext** — In-app notifications, unread counts
- **ChatContext** — Real-time chat state, active conversations, Socket.io
- **DonationContext** — Donation list, filters, CRUD operations

---

**Q11.2:** Why was Context API used instead of Redux?  
**A:** For a project of this scale, Context API is sufficient and avoids the boilerplate of Redux (actions, reducers, store). Each domain (auth, chat, donations) has its own context, keeping concerns separated. For larger apps, Redux or Zustand might be preferred.

---

**Q11.3:** How does `AuthContext` handle token persistence?  
**A:** On login, both the access token and user object are saved to `localStorage`. On app mount, `AuthContext` reads from `localStorage` to restore the session. On logout, it clears `localStorage` and resets state.

---

## 12. API Integration (Axios)

**Q12.1:** How is the Axios instance configured in `api.js`?  
**A:**  
- `baseURL` set from `VITE_API_URL` env var (defaults to `http://localhost:5000/api`)
- `timeout: 10000` (10 seconds)
- Default `Content-Type: application/json`
- Request interceptor attaches Bearer token from `localStorage`
- Response interceptor unwraps `response.data` and handles 401 errors

---

**Q12.2:** What happens when the API returns a 401 error?  
**A:** The response interceptor checks if it's a 401 (not on login/register), sets `_retry` flag to prevent loops, clears `localStorage` (token + user), and redirects to `/login`. Currently no automatic refresh token flow is implemented in the interceptor (comment says "optionally implement").

---

**Q12.3:** How does the donation image upload work via Axios?  
**A:** If `imageFiles` are provided, the `donationsAPI.create()` builds a `FormData`, appends the donation data as JSON string under `payload` key, appends each image file under `images` key, and sends as multipart form-data. The backend `maybeParseDonationMultipart` middleware detects multipart and parses accordingly.

---

**Q12.4:** Why does `authAPI.logout` just return `Promise.resolve({ success: true })` instead of calling the API?  
**A:** It appears the frontend logout is client-side only (clearing localStorage). The backend `/api/auth/logout` endpoint exists and clears the refresh token in DB, but the frontend API service doesn't call it — this is a potential issue as the refresh token remains valid server-side.

---

## 13. Security

**Q13.1:** What security measures are implemented in this project?  
**A:**
1. **Helmet.js** — Sets secure HTTP headers (X-Frame-Options, Content-Security-Policy, etc.)
2. **CORS** — Restricts origins to configured CLIENT_URL
3. **Rate Limiting** — Prevents brute force and DDoS (multiple tiers)
4. **JWT Authentication** — Stateless auth with token rotation
5. **bcrypt (12 rounds)** — Password hashing
6. **Input Validation** — express-validator on all inputs
7. **select: false** — Sensitive fields excluded by default
8. **Mongoose sanitization** — Schema validators prevent injection
9. **Environment validation** — Production checks for required secrets

---

**Q13.2:** What is Helmet.js and what does `crossOriginResourcePolicy: { policy: 'cross-origin' }` do?  
**A:** Helmet sets various HTTP security headers. The `crossOriginResourcePolicy` is set to `cross-origin` to allow serving uploaded images/files to the frontend on a different domain (Netlify vs Render). Without this, browsers would block loading uploaded images.

---

**Q13.3:** How does CORS work in this project?  
**A:** The `createDynamicOrigin()` function builds an allowed origins list from `CLIENT_URL` and `SOCKET_CORS_ORIGIN` environment variables. Both the Express CORS middleware and Socket.io use this same function. `credentials: true` allows cookies/auth headers.

---

**Q13.4:** Why is `bcrypt` salt rounds set to 12? What's the trade-off?  
**A:** Salt rounds determine the computational cost of hashing. 12 rounds means 2^12 = 4096 iterations. Higher = more secure against brute force but slower. 10-12 is the recommended range. Each increment doubles the time. 12 rounds takes ~250ms per hash, which is acceptable for auth but prevents burst attacks.

---

**Q13.5:** What is `app.set('trust proxy', 1)` and why is it needed on Render?  
**A:** On Render (and behind any reverse proxy), the client's real IP is in the `X-Forwarded-For` header, not `req.ip`. `trust proxy = 1` tells Express to trust the first proxy's forwarded IP. Without this, rate limiting would see all requests as coming from the same internal IP.

---

## 14. Error Handling

**Q14.1:** Describe the error handling strategy in this project.  
**A:**  
1. **Controller level** — `asyncHandler` wraps async functions, catching rejections
2. **Business errors** — `throw new AppError(message, statusCode)` for known errors
3. **Validation** — express-validator returns 422 with detailed field errors
4. **Mongoose errors** — Transformed in `errorHandler` (CastError→400, Duplicate→409, Validation→400)
5. **JWT errors** — Specific handling for invalid/expired tokens
6. **404** — `notFound` middleware catches unmatched routes
7. **Unhandled rejections/exceptions** — Process-level handlers log and exit

---

**Q14.2:** What is the difference between operational and programming errors?  
**A:** Operational errors (`isOperational: true`) are expected — invalid input, resource not found, unauthorized. They show meaningful messages to users. Programming errors are bugs — undefined variables, type errors, DB connection failures. In production, these show a generic "Something went wrong" message to avoid leaking internals.

---

**Q14.3:** What happens on `unhandledRejection` and `uncaughtException`?  
**A:** `unhandledRejection` is logged but doesn't crash the process (the promise rejection is logged). `uncaughtException` logs the error AND calls `process.exit(1)` — because after an uncaught exception, the process is in an undefined state and should restart (Render will auto-restart it).

---

## 15. Cron Jobs & Automation

**Q15.1:** What cron jobs run in this project?  
**A:** Two cron jobs:
1. **Auto-expire donations** (every 15 min) — Finds donations with `expiryTime < now` and status `available`/`requested`, sets them to `expired`.
2. **Expiry warnings** (every 30 min) — Finds donations expiring within 1-1.5 hours, creates a "Donation Expiring Soon" notification for the donor (uses `findOneAndUpdate` with `upsert` to avoid duplicate notifications).

---

**Q15.2:** Why does the expiry warning use `$setOnInsert` with `upsert: true`?  
**A:** `upsert: true` creates the notification if it doesn't exist. `$setOnInsert` only sets fields on insert (not update). This means if the cron runs again and finds the same donation, the existing notification won't be duplicated or modified — it's an idempotent operation.

---

**Q15.3:** Why doesn't the auto-expire cron also handle `pending` status donations?  
**A:** Looking at the code, it only targets `available` and `requested`. But the `Donation.checkExpiry()` method checks `pending` and `available`. This could be a bug — pending donations should also be auto-expired. The `OPEN_DONATION_STATUSES` array in the model includes `pending` but the cron doesn't.

---

## 16. File Uploads

**Q16.1:** How are file uploads handled in this project?  
**A:** Uses **Multer** middleware for multipart form-data. Uploaded files go to `uploads/donations/` and `uploads/avatars/` directories. The `maybeParseDonationMultipart` middleware detects if the request is multipart, parses the `payload` JSON field, and processes attached `images[]` files.

---

**Q16.2:** How are uploaded images served?  
**A:** Express static middleware: `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))` serves the `uploads/` directory at the `/uploads` URL path. Helmet's `crossOriginResourcePolicy` is set to `cross-origin` to allow cross-domain access.

---

**Q16.3:** What's a limitation of storing files locally on the server?  
**A:** On Render's free tier, the filesystem is ephemeral — files are lost on redeploy. A production solution should use cloud storage (AWS S3, Google Cloud Storage, Cloudinary) for persistent file storage.

---

## 17. Deployment & DevOps

**Q17.1:** How is the backend deployed?  
**A:** On **Render** as a web service. The `render.yaml` blueprint defines:
- Runtime: Node.js 20
- Root directory: `backend/`
- Build: `npm install`, Start: `npm start`
- Health check: `/health`
- Required env vars: MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

---

**Q17.2:** How is the frontend deployed?  
**A:** On **Netlify** with a `netlify.toml` config. The frontend is a Vite SPA, so a catch-all redirect (`/* → /index.html`) handles client-side routing. The `VITE_API_URL` env var points to the Render backend.

---

**Q17.3:** What is the `render.yaml` blueprint?  
**A:** Render's Infrastructure-as-Code format. It defines services, environment variables, build/start commands. `generateValue: true` for JWT secrets means Render auto-generates random values. `sync: false` means the value must be manually set in the dashboard.

---

**Q17.4:** Explain the graceful shutdown process.  
**A:** On `SIGTERM` (Render sends this before stopping):
1. Log the signal
2. `httpServer.close()` — stops accepting new connections, finishes existing ones
3. Close MongoDB connection via `mongoose.connection.close()`
4. Exit with code 0
5. A 10-second forced shutdown timer ensures the process doesn't hang

---

**Q17.5:** What is the health check endpoint and why is it important?  
**A:** `GET /health` returns server status, environment, uptime, and socket connection count. Render pings this to ensure the service is running. If it fails, Render can auto-restart the service.

---

## 18. Testing & Debugging

**Q18.1:** Does the project export anything for testing? How?  
**A:** `module.exports = { app, httpServer }` at the end of `server.js` exports the Express app and HTTP server for Jest/Supertest integration tests. There's also a `tests/` directory and a `test_db.js` file for database testing.

---

**Q18.2:** How would you test the `POST /api/auth/register` endpoint?  
**A:** Using Supertest:
```javascript
const request = require('supertest');
const { app } = require('../server');

it('should register a new user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'test@test.com', password: 'pass123' });
  expect(res.statusCode).toBe(201);
  expect(res.body.data.accessToken).toBeDefined();
});
```

---

**Q18.3:** What is Swagger and how is it configured?  
**A:** Swagger provides auto-generated API documentation at `/api/docs` (when `SWAGGER_ENABLED=true`). The `swagger.js` config file defines the OpenAPI spec with server info, security schemes, and endpoint documentation via JSDoc annotations in controllers.

---

**Q18.4:** How does the logger work?  
**A:** Uses **Winston** logger with multiple transports:
- Console output with color coding
- File-based logging (`logs/` directory)
- Different log levels: error, warn, info, http, debug
- Morgan HTTP request logging pipes to Winston

---

## 19. Workflow & End-to-End Scenarios

**Q19.1:** Walk through the complete flow: Donor posts food → NGO requests → Volunteer delivers.  
**A:**
1. **Donor** calls `POST /api/donations` with food details + location → creates donation (status: `pending`)
2. Socket emits `donation:new` → all clients see the new donation
3. **NGO** browses `/api/donations` or `/api/donations/nearby` → finds the donation
4. NGO calls `POST /api/requests` with `donationId` → creates request (status: `pending`)
5. **Donor** sees the request on dashboard, calls `PUT /api/requests/:id/approve` → request becomes `approved`, donation becomes `accepted`, `allocatedTo` = NGO
6. Admin/Donor calls `GET /api/pickup/nearby-volunteers` to find a volunteer
7. Admin/Donor calls `POST /api/pickup/assign` → creates Pickup (status: `assigned`), donation status → `assigned`
8. **Volunteer** gets notification, calls `PUT /api/pickup/status` with `accepted` → `en_route_pickup` → `picked_up` → `en_route_delivery` → `delivered`
9. Donation status becomes `delivered`, volunteer freed, NGO notified
10. All parties can submit **feedback** via `POST /api/feedback`

---

**Q19.2:** What happens if an NGO request is rejected?  
**A:** `PUT /api/requests/:id/reject` sets request status to `rejected`, `rejectedAt` timestamp, and optionally `rejectionReason`. The donation status reverts or stays available for other NGOs.

---

**Q19.3:** What happens if food expires before anyone picks it up?  
**A:** The cron job (every 15 min) finds donations with `expiryTime < now` and status `available`/`requested`, marks them as `expired`. Additionally, 30 min before expiry, the donor receives a warning notification.

---

**Q19.4:** Can an NGO request a donation that another NGO already requested?  
**A:** Yes, multiple NGOs can request the same donation. The partial unique index only prevents the SAME NGO from making duplicate `pending`/`approved` requests for the same donation. The donor then chooses which NGO to approve.

---

**Q19.5:** What happens if a volunteer cancels mid-pickup?  
**A:** The pickup status changes to `cancelled`. The volunteer is freed (availability = true). The donation gets `assignedVolunteer = null` and status reverts to `accepted` (if an NGO was allocated) or `pending`. A new volunteer can then be assigned.

---

## 20. Code-Level Deep Dive Questions

**Q20.1:** In `server.js`, line 53-56 creates directories on startup. Why?  
**A:** `['logs', 'uploads/donations', 'uploads/avatars']` — ensures these directories exist before any log write or file upload. `{ recursive: true }` creates parent directories too. Without this, the first log write or upload would fail with ENOENT.

---

**Q20.2:** What does `{ validateBeforeSave: false }` mean in `user.save()`?  
**A:** Skips Mongoose schema validation before saving. Used when updating non-validated fields like `refreshToken` or `lastLogin` where the password requirement would block the save (since password is `required` but might not be in the document when fetched without `+password`).

---

**Q20.3:** Why does `donationController.getDonations` check `req.user?.role === 'donor'`?  
**A:** Donors should only see their OWN donations, while NGOs and volunteers should see ALL available donations. If the user is a donor, the query adds `donorId: req.user._id` to filter. This role-based data filtering at the query level prevents data leakage.

---

**Q20.4:** Explain this line: `const volId = pickup.volunteerId._id ? pickup.volunteerId._id.toString() : pickup.volunteerId.toString();`  
**A:** Because of the `pre(/^find/)` populate hook, `volunteerId` could be either a populated User object (with `._id`) or a raw ObjectId (if populate failed or was bypassed). This defensive check handles both cases when comparing IDs.

---

**Q20.5:** What is `socket.handshake.auth?.token`?  
**A:** Socket.io clients can pass auth data during the handshake: `io({ auth: { token: 'xxx' } })`. The `?.` optional chaining prevents errors if `auth` is undefined. This is the primary way the frontend sends the JWT for socket authentication.

---

**Q20.6:** In `Message.getConversationList`, explain the `$cond` in `$group._id`.  
**A:**  
```javascript
$cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId']
```
If the user is the sender, group by receiver (the other person). If the user is the receiver, group by sender. This creates one conversation group per unique chat partner, regardless of who sent the last message.

---

**Q20.7:** Why does the Notification model use `mongoose.Schema.Types.Mixed` for the `data` field?  
**A:** `Mixed` allows storing any arbitrary JSON structure — different notification types need different data (donation ID, pickup ID, user ID, etc.). It's flexible but loses Mongoose validation/casting for that field.

---

**Q20.8:** Explain the `$setOnInsert` pattern in the cron expiry warning.  
**A:**
```javascript
Notification.findOneAndUpdate(
  { userId: donation.donorId, type: 'donation_expired', 'data.donationId': donation._id },
  { $setOnInsert: { ...notification_fields } },
  { upsert: true }
)
```
- **Find** — looks for an existing notification for this donation
- **$setOnInsert** — only set these fields if inserting a new document
- **upsert: true** — insert if not found, do nothing if found
- Result: exactly one notification per donation, idempotent

---

**Q20.9:** What is the `toSafeObject()` method on the User model?  
**A:** It converts the Mongoose document to a plain JavaScript object and removes sensitive fields (`password`, `refreshToken`, `fcmToken`). Used in auth responses to ensure secrets never appear in API responses even if `select: false` was bypassed.

---

**Q20.10:** How does the frontend handle different dashboard views for different roles?  
**A:** The `Dashboard.jsx` component uses `useAuth()` to get the user's role, then conditionally renders role-specific widgets. Donors see their donations, NGOs see available donations + their requests, volunteers see assigned pickups, and admins see analytics + management tools.

---

## 21. Scalability & Future Improvements

**Q21.1:** What are the scalability limitations of this architecture?  
**A:**
- Single-server Node.js (no clustering)
- In-memory `onlineUsers` map (lost on restart, not shared across instances)
- Local file uploads (ephemeral on Render)
- Auto-populate on every find query (N+1 query potential)
- No caching layer (Redis)
- MongoDB free tier limits

---

**Q21.2:** How would you add push notifications (FCM)?  
**A:** The User model already has an `fcmToken` field. You'd integrate Firebase Cloud Messaging:
1. Frontend sends FCM token after login
2. Store in user document
3. When creating notifications with `channels: ['push']`, use the FCM SDK to send push notifications to the stored token

---

**Q21.3:** How would you scale the real-time features across multiple servers?  
**A:** Use `@socket.io/redis-adapter`. Each server connects Socket.io to a shared Redis instance. Events emitted on one server are broadcast to all servers via Redis pub/sub. The `onlineUsers` map would also move to Redis.

---

**Q21.4:** What improvements would you make to the matching algorithm?  
**A:**  
- Add time-based priority (urgency level, expiry proximity)
- Factor in NGO capacity/demand
- Machine learning for demand prediction
- Route optimization for multiple pickups
- Dynamic radius based on area density

---

**Q21.5:** How would you implement email verification?  
**A:**  
- Generate a verification token on registration
- Send email with verification link via Nodemailer/SendGrid
- Create `GET /api/auth/verify-email/:token` endpoint
- Set `isEmailVerified: true` on successful verification
- Optionally block certain features until verified

---

**Q21.6:** What database optimizations could improve performance?  
**A:**
- Remove auto-populate pre-find hooks, populate explicitly only when needed
- Use `lean()` for read-only queries (returns plain JS objects, 3-5x faster)
- Add compound indexes for frequent filter combinations
- Use MongoDB Atlas Search for full-text search
- Implement aggregation pipeline caching

---

## 🎯 Quick-Fire / Short Answer Questions

| # | Question | Answer |
|---|---|---|
| 1 | What port does the backend run on? | 5000 (or `process.env.PORT`) |
| 2 | What database is used? | MongoDB Atlas |
| 3 | What ORM/ODM is used? | Mongoose |
| 4 | What is the body parsing limit? | 10mb (JSON and URL-encoded) |
| 5 | How many models are there? | 7 (User, Donation, Request, Pickup, Message, Notification, Feedback) |
| 6 | What is the default JWT expiry? | 7 days |
| 7 | What is the default refresh token expiry? | 30 days |
| 8 | How many bcrypt salt rounds? | 12 |
| 9 | What is the default rate limit? | 100 requests per 15 minutes |
| 10 | What file upload library is used? | Multer |
| 11 | What logging library is used? | Winston + Morgan |
| 12 | What validation library is used? | express-validator |
| 13 | Where is the frontend deployed? | Netlify |
| 14 | Where is the backend deployed? | Render |
| 15 | What frontend build tool is used? | Vite |
| 16 | How many React Context providers? | 5 (Auth, Theme, Notification, Chat, Donation) |
| 17 | What HTTP client does frontend use? | Axios |
| 18 | What is the health check URL? | `/health` |
| 19 | What auto-deletes notifications after 90 days? | MongoDB TTL index |
| 20 | What cron library is used? | node-cron |

---

> **💡 Tip:** Study the status transition flows deeply — they are the heart of the business logic. Also understand the Socket.io auth flow and how `req.app.get('io')` bridges REST and real-time.
