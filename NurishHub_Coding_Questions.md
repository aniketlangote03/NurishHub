# 🍱 NurishHub — 200+ Coding & Technical Deep-Dive Questions

> Every question references **actual code** from the project with line numbers.  
> Organized by file/module for easy revision.

---

# PART A — BACKEND CODE QUESTIONS

---

## 🔹 Section 1: server.js (Entry Point) — 25 Questions

**Q1.** What does `require('dotenv').config()` do on line 12 of server.js?  
**A:** It loads environment variables from the `.env` file into `process.env`. Without this, variables like `MONGO_URI`, `JWT_SECRET`, etc. would be `undefined`.

**Q2.** What do `assertProductionEnv()` and `bootstrapJwtSecretsIfNeeded()` do on lines 14-15?  
**A:** `assertProductionEnv()` checks that all required environment variables (`MONGO_URI`, `JWT_SECRET`, etc.) are set in production — exits with error if missing. `bootstrapJwtSecretsIfNeeded()` auto-generates JWT secrets in development if they're not set.

**Q3.** Why is `http.createServer(app)` used instead of just `app.listen()`?  
**A:** Socket.io requires a raw `http.Server` object to attach to. `app.listen()` creates one internally but doesn't expose it. By creating `httpServer` manually, we can pass it to both `new Server(httpServer)` for Socket.io and `httpServer.listen()` for HTTP.

**Q4.** Explain this code:
```js
const io = new Server(httpServer, {
  cors: { origin: dynamicOrigin, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});
```
**A:** Creates a Socket.io server attached to the HTTP server. CORS is configured with dynamic allowed origins. `pingTimeout: 60000` means if a client doesn't respond to a ping within 60 seconds, it's disconnected. `pingInterval: 25000` means the server pings clients every 25 seconds to check connectivity.

**Q5.** What does `app.set('io', io)` on line 82 do and why?  
**A:** Stores the Socket.io instance on the Express app object. Controllers can later retrieve it with `req.app.get('io')` to emit real-time events — this avoids importing socket modules directly into controllers, keeping them decoupled.

**Q6.** Explain this Helmet configuration:
```js
helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })
```
**A:** Helmet sets various security HTTP headers. The `crossOriginResourcePolicy` override is needed because the frontend (Netlify) and backend (Render) are on different domains. Without `cross-origin`, browsers would block the frontend from loading uploaded images from the backend.

**Q7.** Why are there different rate limiters applied to different routes?
```js
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/messages', messageLimiter);
```
**A:** Different endpoints have different abuse profiles. Login/register need strict limits (20/15min) to prevent brute-force attacks. Chat messages need per-minute limits (60/min) to prevent spam. The global limiter (100/15min) is a baseline for all API calls.

**Q8.** What does `express.json({ limit: '10mb' })` do?  
**A:** Parses incoming JSON request bodies. The `limit: '10mb'` sets the maximum request body size to 10MB — larger requests return 413 Payload Too Large. This is important for donation image uploads sent as base64.

**Q9.** Explain `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`.  
**A:** Serves the `uploads/` directory as static files. A file at `backend/uploads/donations/photo.jpg` becomes accessible at URL `http://localhost:5000/uploads/donations/photo.jpg`.

**Q10.** What does this directory-creation code do?
```js
['logs', 'uploads/donations', 'uploads/avatars'].forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});
```
**A:** On server startup, creates required directories if they don't exist. `{ recursive: true }` means it creates parent directories too (e.g., creates `uploads/` before `uploads/donations/`). Without this, the first log write or file upload would fail with ENOENT error.

**Q11.** Why is the 404 handler (`notFound`) registered AFTER all routes?  
**A:** Express middleware runs in order. If `notFound` was before routes, every request would hit 404. It's placed after all routes so only unmatched requests fall through to it.

**Q12.** Why is `errorHandler` the very LAST middleware?  
**A:** Express identifies error-handling middleware by its 4-parameter signature `(err, req, res, next)`. It must be last to catch errors from all routes and other middleware. If placed earlier, errors from later middleware wouldn't reach it.

**Q13.** What does `app.set('trust proxy', 1)` do and when is it applied?  
**A:** Applied when running on Render or behind a reverse proxy. It tells Express to trust the first hop in `X-Forwarded-For` header for determining `req.ip`. Without this, rate limiters would see Render's internal proxy IP instead of the client's real IP, making rate limiting useless.

**Q14.** Explain the graceful shutdown code:
```js
const gracefulShutdown = (signal) => {
  httpServer.close(async () => {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000);
};
```
**A:** On SIGTERM/SIGINT: (1) stops accepting new connections, (2) waits for existing connections to finish, (3) closes MongoDB connection, (4) exits cleanly. The 10-second timeout is a safety net — forces exit if graceful shutdown takes too long.

**Q15.** Why is `mongoose` required inside the shutdown function rather than at the top?  
**A:** It's a lazy require — the mongoose module is already loaded (used in models), so this just gets a reference. It's inside the callback to keep the graceful shutdown self-contained. This is a stylistic choice, not a technical necessity.

**Q16.** What does `process.on('unhandledRejection')` handle?  
**A:** Catches promises that were rejected but had no `.catch()` handler. Example: `someAsyncFunction()` without `await` or `.catch()`. It logs the error but doesn't crash — though in newer Node.js versions, unhandled rejections crash by default.

**Q17.** Why does `uncaughtException` call `process.exit(1)` but `unhandledRejection` doesn't?  
**A:** After an uncaught exception, Node.js is in an undefined state — memory could be corrupted, resources leaked. It MUST restart. Unhandled rejections are less catastrophic — the specific promise failed but the rest of the process may be fine.

**Q18.** What does `module.exports = { app, httpServer }` at the bottom do?  
**A:** Exports the Express app and HTTP server for use in automated tests. Supertest/Jest can import `app` and make test requests without starting the actual server.

**Q19.** What is the purpose of the `/health` endpoint?  
**A:** Returns server health info: status, environment, uptime, socket connections. Render uses this for health checks — if it returns non-200, Render restarts the service. It's also useful for monitoring dashboards.

**Q20.** What does `io.engine.clientsCount` return in the health endpoint?  
**A:** Returns the number of currently connected Socket.io clients. This is useful for monitoring — if it drops to 0 unexpectedly, there might be a connection issue.

**Q21.** Why does the `/api` info endpoint use `req.protocol` and `req.get('host')`?  
**A:** To dynamically construct absolute URLs for docs and health endpoints. `req.protocol` gives `http` or `https`. `req.get('host')` gives the hostname with port. This works correctly in both local dev and production.

**Q22.** What is `setupSwagger(app)` doing?  
**A:** Mounts Swagger UI at `/api/docs` (only when `SWAGGER_ENABLED=true`). It reads JSDoc annotations from controllers and generates interactive API documentation that developers can use to test endpoints.

**Q23.** What does `initCronJobs()` do and why is it called after `connectDB()`?  
**A:** Starts scheduled cron jobs (auto-expire donations, send warnings). It's called after DB connection because the cron jobs query MongoDB — they'd fail if the database isn't connected yet.

**Q24.** Why does the Morgan logging check `process.env.NODE_ENV !== 'test'`?  
**A:** During automated tests (Jest), HTTP log output clutters test results. Disabling Morgan in test mode keeps test output clean. The `stream` option pipes Morgan output to Winston for structured logging.

**Q25.** What are all the route prefixes mounted in server.js?  
**A:** `/api/auth`, `/api/users`, `/api/donations`, `/api/requests`, `/api/pickup`, `/api/matching`, `/api/messages`, `/api/feedback`, `/api/notifications`, `/api/admin`.

---

## 🔹 Section 2: Models (Mongoose Schemas) — 30 Questions

### User.js

**Q26.** What does the `match` validator on the email field do?
```js
match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
```
**A:** Uses a regex to validate email format. `\S+` matches one or more non-whitespace characters. Pattern: `something@something.something`. If the email doesn't match, Mongoose throws a validation error.

**Q27.** Why is `select: false` set on both `password` and `refreshToken`?  
**A:** These are sensitive fields that should never be returned in normal queries. `password` is the hashed credential. `refreshToken` is the session token. They can only be included via explicit `.select('+password')`.

**Q28.** Explain the `location` field with GeoJSON:
```js
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] },
}
```
**A:** GeoJSON format required by MongoDB's `2dsphere` index. `type: 'Point'` indicates a single point on earth. `coordinates: [longitude, latitude]` — note MongoDB uses lng first, not lat. Default `[0, 0]` is in the Gulf of Guinea (Africa).

**Q29.** What does `userSchema.index({ location: '2dsphere' })` create?  
**A:** A geospatial index that enables queries like `$near`, `$geoWithin`, `$geoIntersects` for finding users near a geographic point. Used to find nearby volunteers for pickup assignments.

**Q30.** What is `this.isModified('password')` checking in the pre-save hook?  
**A:** Checks if the `password` field was changed since the document was loaded. Returns `true` for new documents (all fields are "modified") or when the password is explicitly changed. Prevents re-hashing an already-hashed password on unrelated updates.

**Q31.** Why are salt rounds set to 12 in `bcrypt.hash(this.password, 12)`?  
**A:** The salt rounds (cost factor) determines how computationally expensive the hash is. 12 means 2^12 = 4096 iterations of the hashing algorithm. Higher is more secure but slower. At 12, one hash takes ~250ms, making brute-force attacks impractical.

**Q32.** What does `User.findByRole('donor')` do?  
**A:** It's a static method: `return this.find({ role, isActive: true })`. Returns all active users with the specified role. Static methods are called on the Model class, not instances.

**Q33.** What's the difference between instance methods and static methods in Mongoose?  
**A:** Instance methods (`userSchema.methods.*`) are called on individual documents: `user.comparePassword()`. Static methods (`userSchema.statics.*`) are called on the Model: `User.findByRole()`. Instance = per-document, Static = per-collection.

### Donation.js

**Q34.** What donation statuses exist? Draw the state machine.  
**A:**
```
pending → requested → accepted → assigned → picked_up → delivered
   ↓          ↓          ↓         ↓
expired   expired    cancelled  cancelled/failed → reverts to accepted/pending
   ↑
available (legacy)
```

**Q35.** What does the `isVegetarian` vs `dietType` distinction serve?  
**A:** `dietType` is the primary field (`veg`/`non_veg`). `isVegetarian` is a boolean for easy filtering. When `dietType` is set, the controller auto-syncs `isVegetarian`. Having both allows queries like `Donation.find({ isVegetarian: true })` without parsing enum values.

**Q36.** Why are there 5 separate indexes on the Donation model?  
**A:** Each index optimizes a different query pattern:
- `location: '2dsphere'` — nearby donation search
- `status: 1` — filter by status
- `donorId: 1` — "my donations" queries
- `expiryTime: 1` — cron auto-expire queries
- `createdAt: -1` — sorted listings (newest first)

**Q37.** What does the `checkExpiry()` instance method do?
```js
donationSchema.methods.checkExpiry = function () {
  if (new Date() > this.expiryTime && OPEN_DONATION_STATUSES.includes(this.status)) {
    this.status = 'expired';
    this.isExpired = true;
  }
  return this;
};
```
**A:** Checks if the donation has passed its expiry time AND is in a status that can expire (`pending` or `available`). If both conditions are true, marks it as expired. Returns `this` for chaining. Note: it doesn't save — the caller must call `.save()`.

**Q38.** Explain the `pre(/^find/)` auto-populate hook:
```js
donationSchema.pre(/^find/, function (next) {
  this.populate({ path: 'donorId', select: 'name email phone address avatar' });
  next();
});
```
**A:** The regex `/^find/` matches `find`, `findOne`, `findById`, `findOneAndUpdate`, etc. Before any find operation, it automatically joins the `donorId` reference with selected user fields. This means every donation query returns the donor's info without manual population.

**Q39.** What's the performance impact of auto-populating on every find?  
**A:** Every donation query triggers a secondary query to the User collection. If you fetch 100 donations, it runs 100+ queries (N+1 problem). For large datasets, explicit `.populate()` only when needed or using `.lean()` would be more efficient.

**Q40.** What does the `isValid` virtual return?
```js
donationSchema.virtual('isValid').get(function () {
  return new Date() < this.expiryTime && OPEN_DONATION_STATUSES.includes(this.status);
});
```
**A:** Returns `true` if the donation hasn't expired AND has a status of `pending` or `available`. It's computed on-the-fly (not stored in DB). Virtuals require `toJSON: { virtuals: true }` or `toObject: { virtuals: true }` to appear in output.

### Request.js

**Q41.** Explain the partial filter unique index:
```js
requestSchema.index(
  { ngoId: 1, donationId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);
```
**A:** Creates a unique compound index on `(ngoId, donationId)` but ONLY for documents where `status` is `pending` or `approved`. This means:
- An NGO can't have two pending requests for the same donation ✓
- An NGO CAN create a new request after the previous one was rejected or cancelled ✓

**Q42.** Why does the Request model auto-populate both `ngoId` and `donationId` on find?  
**A:** Because requests are always shown in context — you need to see which NGO requested and which donation was requested. Pre-populating avoids separate queries in controllers.

### Pickup.js

**Q43.** What are the pickup status transitions and what does each mean?
```
assigned → accepted → en_route_pickup → picked_up → en_route_delivery → delivered
                  ↓              ↓                                    ↓
              cancelled         failed                              failed
```
**A:** `assigned` = just created, volunteer notified. `accepted` = volunteer confirmed. `en_route_pickup` = heading to donor. `picked_up` = food collected. `en_route_delivery` = heading to NGO. `delivered` = complete. `failed`/`cancelled` = reverts donation status.

**Q44.** Why does the Pickup model have 3 separate `2dsphere` indexes?  
**A:** Three geographic points are tracked:
- `pickupLocation` — where to collect food (donor's location)
- `deliveryLocation` — where to deliver (NGO's location)
- `currentLocation` — volunteer's real-time position during transit

**Q45.** What are `pickupOtp` and `deliveryOtp` fields for?  
**A:** OTP verification for pickup/delivery confirmation. When a volunteer arrives, the donor shares a pickup OTP to confirm handoff. Similarly at delivery, the NGO confirms with a delivery OTP. Both have `select: false` for security.

### Message.js

**Q46.** How does the soft-delete mechanism work?
```js
deletedBySender: { type: Boolean, default: false },
deletedByReceiver: { type: Boolean, default: false },
```
**A:** When a user deletes a message, only their flag is set (not the actual document). The other user still sees it. Only when BOTH parties delete it is the message permanently removed from the database (see chatController.deleteMessage).

**Q47.** Explain the `getConversation` static method:
```js
messageSchema.statics.getConversation = function (userId1, userId2, page, limit) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2, deletedBySender: false },
      { senderId: userId2, receiverId: userId1, deletedByReceiver: false },
    ],
  }).sort({ createdAt: -1 }).skip(skip).limit(limit);
};
```
**A:** Fetches messages between two users where neither has deleted them. Uses `$or` to match messages in both directions. `deletedBySender: false` for messages user1 sent, `deletedByReceiver: false` for messages user1 received. Results are sorted newest first with pagination.

**Q48.** Explain the `getConversationList` aggregation:
```js
{ $group: { _id: { $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'] } } }
```
**A:** Groups messages by the "other person" in the conversation. If the current user is the sender, group by receiver. If the current user is the receiver, group by sender. This creates one group per unique contact, with the last message and unread count for each.

### Notification.js

**Q49.** What does the TTL index do?
```js
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```
**A:** MongoDB automatically deletes notifications older than 90 days (7,776,000 seconds). This is handled by MongoDB's background thread — no application-level cron needed. The index must be on a Date field.

**Q50.** What notification types exist and when is each created?  
**A:** `donation_posted`, `donation_requested` (when NGO requests), `request_approved`, `request_rejected`, `pickup_assigned`, `pickup_accepted`, `pickup_completed`, `donation_expired` (cron), `new_message`, `feedback_received`, `system_alert`, `nearby_donation`.

### Feedback.js

**Q51.** How does the `getAverageRating` static work?
```js
feedbackSchema.statics.getAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { targetUserId: userId, isHidden: false } },
    { $group: { _id: '$targetUserId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return result[0] || { avgRating: 0, count: 0 };
};
```
**A:** Uses MongoDB aggregation pipeline. Step 1: `$match` filters feedback for the target user (excluding hidden). Step 2: `$group` calculates average rating and total count across all matching documents. Returns `{ avgRating, count }` or defaults if no feedback exists.

**Q52.** Why is there a unique sparse index on `{ userId: 1, donationId: 1 }`?  
**A:** `unique` prevents a user from submitting multiple feedbacks for the same donation. `sparse: true` means the index only includes documents where `donationId` exists — users can still submit multiple platform reviews (which have `donationId: null`).

**Q53.** What does `isHidden` do and who can set it?  
**A:** Admin moderation feature. Hidden feedback is excluded from public view and rating calculations. Only admins can hide feedback via the `hideFeedback` controller. `hiddenReason` records why.

**Q54.** How does the feedback reply system work?
```js
reply: { text: { type: String, maxlength: 500 }, repliedAt: { type: Date } }
```
**A:** The target user (person being reviewed) can reply once to feedback. The `reply` is an embedded subdocument with text and timestamp. Only the reviewed user or admin can add a reply (enforced in controller).

**Q55.** What are feedback tags and how are they used?  
**A:** Tags are predefined labels like `on_time`, `fresh_food`, `professional`, `late`, etc. Users select applicable tags when rating. Tags enable filtering and analytics (e.g., "how often is food late?").

---

## 🔹 Section 3: Controllers (Business Logic) — 40 Questions

### authController.js

**Q56.** Walk through the `register` function line by line.  
**A:**
1. Destructure `name, email, password, role, phone, address, ngoDetails, volunteerDetails` from body
2. Check if email already exists → throw 409 if duplicate
3. Build `userData` object, conditionally adding role-specific fields
4. `User.create(userData)` → triggers pre-save hook → hashes password
5. Generate access + refresh tokens
6. Store refresh token in user document
7. Set `lastLogin` to now
8. Save with `validateBeforeSave: false` (avoids re-validating password)
9. Return sanitized user object + both tokens

**Q57.** Why does `register` use `validateBeforeSave: false` in the second save?  
**A:** After `User.create()`, the password is hashed and stored. The second `.save()` only updates `refreshToken` and `lastLogin`. Without `validateBeforeSave: false`, Mongoose would re-validate all required fields, potentially failing because `password` isn't in the document (it's `select: false`).

**Q58.** In the `login` function, why `.select('+password +refreshToken')`?  
**A:** Both fields have `select: false` in the schema. Login needs `password` to verify credentials via `user.comparePassword()`, and `refreshToken` to update it after successful login.

**Q59.** What is token rotation in `refreshAccessToken`?
```js
const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
user.refreshToken = newRefreshToken;
```
**A:** Every time a refresh token is used, BOTH tokens are regenerated. The old refresh token is invalidated (replaced in DB). This limits the window of attack if a refresh token is stolen — the stolen token becomes invalid after the legitimate user refreshes.

**Q60.** What does `request.donationId._id || request.donationId` pattern mean?  
**A:** Because of auto-populate, `donationId` might be a populated Donation object (so `._id` gives the ObjectId) or a raw ObjectId string (if populate failed). The `||` fallback handles both cases defensively.

### donationController.js

**Q61.** Why does `createDonation` set `dietType` → `isVegetarian` mapping?
```js
if (donationData.dietType === 'non_veg') donationData.isVegetarian = false;
if (donationData.dietType === 'veg') donationData.isVegetarian = true;
```
**A:** Ensures data consistency. `isVegetarian` is a boolean for easy querying, while `dietType` is the enum the user selects. Both must stay in sync. If the user sets `dietType: 'non_veg'`, `isVegetarian` must be `false`.

**Q62.** Explain the geo-query in `getDonations`:
```js
Donation.find({
  ...query,
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      $maxDistance: parseFloat(radius) * 1000,
    },
  },
})
```
**A:** `$near` finds documents closest to a GeoJSON point. `$geometry` specifies the center point. `$maxDistance` is radius in meters (radius param is in km, so multiply by 1000). Results are automatically sorted by distance (nearest first). Requires a `2dsphere` index.

**Q63.** Why does `getDonations` filter differently for donors vs other roles?
```js
if (req.user?.role === 'donor') {
  query.donorId = req.user._id;
}
```
**A:** Data isolation. Donors should only see their own donations. NGOs, volunteers, and admins should see all available donations. Without this check, donors would see everyone's donations, which is a data privacy issue.

**Q64.** How does pagination work in the donation controller?
```js
const { page, limit, skip } = getPagination(req.query);
const [donations, total] = await Promise.all([
  mongoQuery.skip(skip).limit(limit),
  Donation.countDocuments(query),
]);
```
**A:** `skip = (page - 1) * limit` calculates how many documents to skip. `limit` restricts results per page. `countDocuments` gets the total for calculating `pages: Math.ceil(total / limit)`. Both queries run in parallel with `Promise.all`.

**Q65.** Why is there a `Promise.all` with both the find and count queries?  
**A:** Performance optimization. Running them in parallel takes roughly the time of the slowest query. Running sequentially would take the sum of both. For a collection with 10,000 documents, this can save significant time.

**Q66.** What status checks prevent donation deletion?
```js
if (['assigned', 'picked_up', 'accepted', 'requested'].includes(donation.status)) {
  throw new AppError('Cannot delete a donation that is in the allocation or pickup flow.', 400);
}
```
**A:** You can only delete donations in `pending`, `available`, `delivered`, `expired`, or `cancelled` status. Deleting a donation mid-flow (requested/accepted/assigned/picked_up) would break the request-pickup chain and orphan related records.

**Q67.** What does `getNearbyDonations` filter on besides location?
```js
{ status: { $in: ['pending', 'available'] }, expiryTime: { $gt: new Date() } }
```
**A:** Only returns donations that are open for requests (`pending`/`available`) AND haven't expired yet. This prevents NGOs from discovering and requesting expired or already-claimed donations.

### requestController.js

**Q68.** What validation does `createRequest` perform before creating?  
**A:** 5 checks:
1. Donation exists → 404 if not
2. Donation status is open (`pending`/`available`/`requested`) → 400 if not
3. Donation hasn't expired → 400 if expired
4. No duplicate pending/approved request from same NGO → 409 if exists
5. (Input validation by middleware before reaching controller)

**Q69.** Why does `createRequest` set donation status to `requested`?  
**A:** Signals to other NGOs and the donor that at least one NGO has expressed interest. The donor can then review pending requests on their dashboard.

**Q70.** What happens when a request is approved? Explain the `approveRequest` code step by step.  
**A:**
1. Find the request, verify it's `pending`
2. Load the donation, verify the logged-in user owns it (or is admin)
3. Set request to `approved`, add `approvedAt` timestamp
4. Update donation: `status: 'accepted'`, `allocatedTo: ngoId`
5. **Reject all other pending requests** for the same donation
6. Create notification for the NGO
7. Emit Socket.io event to NGO's user room

**Q71.** What is this code doing?
```js
await Request.updateMany(
  { donationId: donation._id, status: 'pending', _id: { $ne: request._id } },
  { status: 'rejected', rejectionReason: 'Another request was approved.' }
);
```
**A:** When one NGO's request is approved, all OTHER pending requests for the same donation are automatically rejected with a standard reason. `$ne: request._id` excludes the approved request from the bulk rejection.

**Q72.** In `rejectRequest`, what happens to the donation status after rejection?
```js
const pendingCount = await Request.countDocuments({
  donationId: donation._id, status: 'pending',
});
if (pendingCount === 0 && donation.status === 'requested') {
  await Donation.findByIdAndUpdate(donation._id, { status: 'pending', allocatedTo: null });
}
```
**A:** After rejecting, it checks if there are any remaining pending requests. If no pending requests remain and the donation status was `requested`, it reverts to `pending` (making it open for new requests). This prevents the donation from being stuck in `requested` status with no pending requests.

**Q73.** In `cancelRequest`, explain the donation status revert logic:
```js
const pendingOthers = await Request.countDocuments({
  donationId: request.donationId, status: 'pending',
});
await Donation.findByIdAndUpdate(request.donationId, {
  status: pendingOthers > 0 ? 'requested' : 'pending',
  allocatedTo: null,
});
```
**A:** If other NGOs still have pending requests, donation stays `requested`. If no pending requests remain, donation reverts to `pending`. Either way, `allocatedTo` is cleared because the allocation is cancelled.

### pickupController.js

**Q74.** What 4 preconditions must be met before assigning a pickup?  
**A:**
1. Donation exists and has status `accepted` (NGO has been approved)
2. Donation doesn't already have an assigned volunteer
3. The assignee is a valid volunteer with `availability: true`
4. The volunteer doesn't have another active pickup already

**Q75.** What does this query check?
```js
const activePickup = await Pickup.findOne({
  volunteerId,
  status: { $in: ['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery'] },
});
```
**A:** Checks if the volunteer already has an in-progress pickup. Volunteers can only handle one pickup at a time. If they have an active task, assignment returns 409 Conflict.

**Q76.** What side effects happen when assigning a pickup?  
**A:** 5 side effects:
1. Pickup document created
2. Donation status → `assigned`, `assignedVolunteer` → volunteerId
3. Volunteer's `availability` set to `false`
4. Notification created for volunteer
5. Socket.io event emitted to volunteer's room

**Q77.** Explain the valid status transitions map:
```js
const validTransitions = {
  assigned: ['accepted', 'cancelled'],
  accepted: ['en_route_pickup', 'cancelled'],
  en_route_pickup: ['picked_up', 'failed'],
  picked_up: ['en_route_delivery'],
  en_route_delivery: ['delivered', 'failed'],
};
```
**A:** Each status can only transition to specific next states. This prevents invalid jumps (e.g., going from `assigned` directly to `delivered`). If the requested transition isn't in the array, it returns 400 with allowed transitions.

**Q78.** What happens differently when status becomes `picked_up` vs `delivered`?  
**A:**
- **picked_up**: Updates the donation status to `picked_up`, records `pickedUpAt` timestamp.
- **delivered**: Updates donation to `delivered`, records `deliveredAt`, frees the volunteer (`availability: true`), increments `totalPickups` counter, sends notification to NGO.

**Q79.** When a pickup fails, how is the donation status calculated?
```js
const d = await Donation.findById(pickup.donationId);
const revertStatus = d?.allocatedTo ? 'accepted' : 'pending';
```
**A:** If the donation has an `allocatedTo` NGO, it goes back to `accepted` (so a new volunteer can be re-assigned). If no NGO was allocated, it goes back to `pending`. This maintains the correct state for re-processing.

### chatController.js

**Q80.** How does real-time message delivery work in `sendMessage`?
```js
const online = req.app.get('onlineUsers') || {};
const receiverSocketId = online[receiverKey];
if (receiverSocketId) {
  io.to(receiverSocketId).emit('message:received', { ... });
  await Message.findByIdAndUpdate(message._id, { status: 'delivered', deliveredAt: new Date() });
}
```
**A:** Checks if the receiver is currently online (in the `onlineUsers` map). If online, emits the message directly to their socket and updates the message status from `sent` to `delivered`. If offline, the message stays as `sent` and the receiver gets it when they fetch messages later.

**Q81.** Why does `getConversation` mark messages as read?
```js
await Message.updateMany(
  { senderId: otherUserId, receiverId: req.user._id, status: { $ne: 'read' } },
  { status: 'read', readAt: new Date() }
);
```
**A:** When you open a conversation, all messages FROM the other person TO you are marked as read. This updates the unread count. It also emits a Socket.io `messages:read` event so the sender sees read receipts in real-time.

**Q82.** How does the soft-delete work in `deleteMessage`?
```js
if (senderId === userId) message.deletedBySender = true;
else if (receiverId === userId) message.deletedByReceiver = true;
if (message.deletedBySender && message.deletedByReceiver) {
  await Message.findByIdAndDelete(req.params.id);
}
```
**A:** Sender deletes: only `deletedBySender = true`, receiver still sees it. Receiver deletes: only `deletedByReceiver = true`, sender still sees it. When BOTH have deleted, the document is permanently removed from the database.

**Q83.** What does `getConversationList` return and how?  
**A:** Uses the `Message.getConversationList` static method (aggregation) to get all unique conversation partners with: their user ID, last message, and unread count. Then loops through with `Promise.all` to populate user details (name, avatar, role).

### feedbackController.js

**Q84.** What happens to the volunteer's rating after feedback is submitted?
```js
if (targetUser.role === 'volunteer') {
  const { avgRating } = await Feedback.getAverageRating(targetUser._id);
  await User.findByIdAndUpdate(targetUserId, {
    'volunteerDetails.rating': Math.round(avgRating * 10) / 10,
  });
}
```
**A:** After each feedback submission, the volunteer's overall average rating is recalculated using the aggregation pipeline. `Math.round(avgRating * 10) / 10` rounds to one decimal place (e.g., 4.666 → 4.7). This denormalized rating enables quick sorting/filtering without aggregation.

**Q85.** How does the feedback query handle rating range filters?
```js
if (minRating || maxRating) {
  query.rating = {};
  if (minRating) query.rating.$gte = parseFloat(minRating);
  if (maxRating) query.rating.$lte = parseFloat(maxRating);
}
```
**A:** Dynamically builds a MongoDB range query. `$gte` = greater than or equal, `$lte` = less than or equal. Example: `minRating=3&maxRating=5` → `{ rating: { $gte: 3, $lte: 5 } }`.

**Q86.** Why does `getFeedback` run 3 parallel queries?  
**A:** `Promise.all([find, countDocuments, aggregate])` — fetches paginated results, total count for pagination, AND rating stats (average + distribution) all at once. Running them in parallel is ~3x faster than sequential.

**Q87.** Who can reply to feedback and how is that enforced?
```js
const targetId = feedback.targetUserId._id ? ... : ...;
if (targetId !== req.user._id.toString() && req.user.role !== 'admin') {
  throw new AppError('Only the reviewed user can reply.', 403);
}
```
**A:** Only the user being reviewed (targetUser) or an admin can reply. The code extracts the target user's ID (handling populate), compares it to the logged-in user, and returns 403 if they don't match.

### notificationController.js

**Q88.** How does `getNotifications` return both notifications and unread count?
```js
const [notifications, total, unreadCount] = await Promise.all([
  Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
  Notification.countDocuments(query),
  Notification.countDocuments({ userId: req.user._id, isRead: false }),
]);
```
**A:** Three parallel queries: (1) paginated notifications matching filters, (2) total count for pagination, (3) total unread count (always for the current user, regardless of filters). This lets the frontend show both the notification list and an unread badge.

**Q89.** How does `markAsRead` ensure users can only mark their own notifications?
```js
Notification.findOneAndUpdate(
  { _id: req.params.id, userId: req.user._id },
  { isRead: true, readAt: new Date() },
  { new: true }
)
```
**A:** The query filter includes `userId: req.user._id`. If the notification belongs to a different user, `findOneAndUpdate` returns null → throws 404. This prevents users from marking other users' notifications as read.

**Q90.** What does `clearAllNotifications` do?
```js
await Notification.deleteMany({ userId: req.user._id });
```
**A:** Permanently deletes ALL notifications for the current user. Uses `userId: req.user._id` to scope deletion to only the authenticated user's notifications.

### userController.js

**Q91.** How does `updateProfile` handle role-specific fields?
```js
if (req.user.role === 'ngo' && ngoDetails) updates.ngoDetails = ngoDetails;
if (req.user.role === 'volunteer' && volunteerDetails) {
  updates['volunteerDetails.vehicleType'] = volunteerDetails.vehicleType;
}
```
**A:** Only NGOs can update `ngoDetails` and only volunteers can update `volunteerDetails`. The dot notation `'volunteerDetails.vehicleType'` updates a nested field without overwriting the entire `volunteerDetails` object (preserving `rating`, `totalPickups`, etc.).

**Q92.** Why does `getUsers` restrict non-admins?
```js
if (req.user.role !== 'admin') {
  query.role = { $in: ['ngo', 'volunteer'] };
}
```
**A:** Non-admin users can only discover NGOs and volunteers (for donation coordination). They cannot browse donor or admin accounts. Admins can see all users.

**Q93.** How does `toggleAvailability` work?
```js
user.volunteerDetails.availability = !user.volunteerDetails.availability;
await user.save({ validateBeforeSave: false });
```
**A:** Flips the boolean — if `true` → `false`, if `false` → `true`. Simple toggle via negation. `validateBeforeSave: false` skips full validation (avoids password requirement issue).

### adminController.js

**Q94.** How does the analytics endpoint calculate "waste reduced"?
```js
const wasteReduced = await Donation.aggregate([
  { $match: { status: 'delivered' } },
  { $group: { _id: null, totalKg: { $sum: '$quantity.value' } } },
]);
```
**A:** Sums up `quantity.value` across all delivered donations. `$match` filters for only successfully delivered food. `$group` with `_id: null` aggregates across all documents. `$sum` adds up the values. Note: assumes all units are comparable (but they might be kg, liters, packets, etc. — a potential data quality issue).

**Q95.** How does the donations-over-time chart query work?
```js
Donation.aggregate([
  { $match: { createdAt: { $gte: daysAgo } } },
  {
    $group: {
      _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
      count: { $sum: 1 },
      totalQuantity: { $sum: '$quantity.value' },
    },
  },
  { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
])
```
**A:** Groups donations by day, counting how many were created each day and their total quantity. `$year`, `$month`, `$dayOfMonth` extract date parts from `createdAt`. Results sorted chronologically. Used for line/bar charts on the admin dashboard.

---

## 🔹 Section 4: Middleware — 15 Questions

**Q96.** How does `asyncHandler` work?
```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
**A:** Takes an async function, returns a new function that wraps it. `Promise.resolve()` handles both sync and async functions. `.catch(next)` forwards any rejection to Express's error handler. Without this, unhandled promise rejections in controllers would crash the server.

**Q97.** How does the `errorHandler` transform Mongoose errors?
```js
if (err.name === 'CastError') error = handleCastError(err);
if (err.code === 11000) error = handleDuplicateKeyError(err);
if (err.name === 'ValidationError') error = handleValidationError(err);
```
**A:** Three transformations:
- `CastError` (invalid MongoDB ID) → 400 "Invalid {path}: {value}"
- Code 11000 (duplicate key) → 409 "Duplicate value for field '{field}'"
- `ValidationError` (schema validation) → 400 with all validation messages joined

**Q98.** What does the `handleDuplicateKeyError` function extract?
```js
const field = Object.keys(err.keyValue)[0];
const value = err.keyValue[field];
```
**A:** When MongoDB throws a duplicate key error (code 11000), `err.keyValue` contains `{ email: 'test@test.com' }`. This extracts the field name and duplicate value for a user-friendly error message.

**Q99.** How does the donation validator check expiry time is in the future?
```js
body('expiryTime')
  .isISO8601()
  .custom((value) => {
    if (new Date(value) <= new Date()) {
      throw new Error('Expiry time must be in the future');
    }
    return true;
  })
```
**A:** First validates ISO 8601 date format. Then a custom validator compares the provided date with `new Date()` (current time). If the expiry is in the past or now, throws an error. The `return true` confirms validation passed.

**Q100.** How does `mongoIdParam` work?
```js
const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];
```
**A:** Returns an array of middleware. `param(paramName)` validates URL params (e.g., `:id`). `isMongoId()` checks if it's a valid 24-character hex string (MongoDB ObjectId format). Used to prevent CastError before the controller ever queries the database.

**Q101.** Why does the donation validator check `location.coordinates.*`?
```js
body('location.coordinates').isArray({ min: 2, max: 2 }),
body('location.coordinates.*').isFloat(),
```
**A:** First checks coordinates is an array of exactly 2 elements. Then `.*` validates each element in the array is a float number. This ensures `[77.5946, 12.9716]` format (both values must be numbers, not strings).

**Q102.** How does the rate limiter use `standardHeaders` and `legacyHeaders`?  
**A:** `standardHeaders: true` sends `RateLimit-*` headers (draft-6). `legacyHeaders: false` disables `X-RateLimit-*` headers (old standard). The frontend can read these headers to show "try again in X seconds" messages.

**Q103.** What does `skipSuccessfulRequests: false` mean in the auth limiter?  
**A:** Even successful login attempts count toward the rate limit. An attacker cycling through valid credentials would still be rate-limited. If set to `true`, only failed attempts would count.

---

## 🔹 Section 5: Socket.io (Real-Time) — 20 Questions

**Q104.** How does Socket.io JWT auth middleware work?
```js
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('name role isActive');
  if (!user || !user.isActive) return next(new Error('User not found or inactive'));
  socket.user = user;
  next();
});
```
**A:** Runs before every connection. Extracts JWT from handshake auth object or authorization header. Verifies the token, loads the user, checks active status. On success, attaches `socket.user` for use in handlers. On failure, `next(new Error(...))` rejects the connection.

**Q105.** What happens on socket connection?
```js
onlineUsers[userId] = socket.id;
socket.join(`user_${userId}`);
socket.broadcast.emit('user:online', { userId, name: socket.user.name });
socket.emit('users:online', Object.keys(onlineUsers));
```
**A:** 4 things:
1. Add user to `onlineUsers` map (userId → socketId)
2. Join personal room `user_${userId}` for targeted messages
3. Tell everyone else this user came online
4. Send the list of currently online users to this user

**Q106.** What is `socket.join('user_${userId}')` doing?  
**A:** Creates/joins a Socket.io room named `user_<id>`. Rooms allow targeted messaging — `io.to('user_123').emit(...)` sends ONLY to user 123's socket. This is how notifications, chat messages, and pickup updates target specific users.

**Q107.** How does typing indicator work?
```js
socket.on('chat:typing', ({ receiverId }) => {
  socket.to(`user_${receiverId}`).emit('chat:typing', {
    senderId: userId,
    senderName: socket.user.name,
  });
});
```
**A:** When UserA types, their client emits `chat:typing` with the receiver's ID. The server forwards this to the receiver's personal room. The receiver's client shows "UserA is typing...". `socket.to()` sends to the room but NOT back to the sender.

**Q108.** How does `chat:read` mark messages as read via socket?
```js
socket.on('chat:read', async ({ senderId }) => {
  await Message.updateMany(
    { senderId, receiverId: userId, status: { $ne: 'read' } },
    { status: 'read', readAt: new Date() }
  );
  socket.to(`user_${senderId}`).emit('chat:messages-read', { readBy: userId });
});
```
**A:** When a user views a conversation, all messages FROM the sender TO the viewer are bulk-updated to `read` status. Then a `chat:messages-read` event tells the sender their messages were read (read receipts).

**Q109.** What does the donation subscription handler do?
```js
socket.on('donations:subscribe', ({ lat, lng, radius = 10 }) => {
  socket.donationSubscription = { lat, lng, radius };
  socket.join('donation-feed');
});
```
**A:** NGOs can subscribe to donation alerts for their area. Stores their location on the socket object and joins the `donation-feed` room. When new donations are posted, the server could check if the donation is within each subscriber's radius.

**Q110.** How does pickup location tracking work?
```js
socket.on('pickup:location-update', ({ pickupId, coordinates }) => {
  if (socket.user.role !== 'volunteer') return;
  io.to(`pickup_${pickupId}`).emit('pickup:location', {
    pickupId, volunteerId: userId, coordinates, updatedAt: new Date().toISOString(),
  });
});
```
**A:** Only volunteers can emit location updates (role check). The volunteer sends their GPS coordinates. These are broadcast to the `pickup_${pickupId}` room — anyone tracking that pickup (donor, NGO, admin) who joined the room sees the volunteer's real-time location.

**Q111.** How does `pickup:track` work?
```js
socket.on('pickup:track', ({ pickupId }) => {
  socket.join(`pickup_${pickupId}`);
});
```
**A:** The donor or NGO joins a pickup-specific room to receive real-time location updates from the volunteer. When they stop tracking, `pickup:untrack` leaves the room.

**Q112.** What is `socket.broadcast.emit` vs `io.emit`?  
**A:** `socket.broadcast.emit` sends to ALL connected clients EXCEPT the sender. Used for `user:online` — the user who just came online doesn't need to notify themselves. `io.emit` sends to ALL including sender.

**Q113.** Why does the disconnect handler delete from `onlineUsers`?
```js
socket.on('disconnect', (reason) => {
  delete onlineUsers[userId];
  socket.broadcast.emit('user:offline', { userId });
});
```
**A:** Removes the user from the online tracking map and tells everyone else. Without this, the `onlineUsers` map would grow indefinitely and show ghost "online" users.

---

## 🔹 Section 6: Routes — 15 Questions

**Q114.** Why does `router.use(protect)` appear at the top of most route files?  
**A:** It applies JWT authentication to ALL routes defined below it. Without it, unauthenticated users could access protected endpoints. It's middleware chaining — every request goes through `protect` first.

**Q115.** Why are auth routes `/register` and `/login` defined BEFORE `router.use(protect)`?  
**A:** These are public routes — they don't need authentication (users aren't logged in yet). Routes defined before `router.use(protect)` bypass the auth middleware.

**Q116.** What does `authorize('donor', 'admin')` do when chained in a route?
```js
router.put('/:id', mongoIdParam('id'), authorize('donor', 'admin'), updateDonation);
```
**A:** After `protect` verifies the JWT and `mongoIdParam` validates the ID, `authorize` checks that `req.user.role` is either `donor` or `admin`. If not, returns 403 Forbidden.

**Q117.** Why is `router.get('/nearby', ...)` defined before `router.get('/:id', ...)`?  
**A:** Express matches routes top-to-bottom. If `/:id` was first, requests to `/nearby` would match with `id = 'nearby'`, causing a CastError (non-ObjectId). Specific string routes must be defined before parameterized routes.

**Q118.** What middleware chain does a donation creation pass through?
```js
router.post('/', authorize('donor'), maybeParseDonationMultipart, donationValidator, createDonation);
```
**A:** 5 steps:
1. `protect` (from `router.use`) — JWT verification
2. `authorize('donor')` — only donors can create
3. `maybeParseDonationMultipart` — handles file upload if multipart
4. `donationValidator` — validates all fields
5. `createDonation` — controller logic

**Q119.** What routes exist under `/api/auth` and which are public vs protected?  
**A:**
- **Public:** `POST /register`, `POST /login`, `POST /refresh`
- **Protected:** `POST /logout`, `GET /me`, `PUT /update-profile`, `PUT /change-password`

**Q120.** How many route files exist and what does each handle?  
**A:** 10 route files: `authRoutes` (auth), `userRoutes` (profiles), `donationRoutes` (CRUD + geo), `requestRoutes` (NGO claims), `pickupRoutes` (volunteer flow), `chatRoutes` (messaging), `feedbackRoutes` (ratings), `notificationRoutes` (alerts), `adminRoutes` (management), `matchingRoutes` (geo-matching).

---

# PART B — FRONTEND CODE QUESTIONS

---

## 🔹 Section 7: Frontend Architecture — 20 Questions

### App.jsx

**Q121.** What does this code do?
```jsx
<Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
```
**A:** If the user is already logged in, navigating to `/login` redirects them to `/dashboard`. If not logged in, shows the login page. `replace` prevents the login page from appearing in browser history.

**Q122.** How does `ProtectedRoute` work?
```jsx
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
```
**A:** 3 checks in order:
1. If still loading auth state → render nothing (prevents flash)
2. If not authenticated → redirect to login
3. If authenticated but wrong role → redirect to dashboard
4. If all checks pass → render the protected content

**Q123.** Why does `ProtectedRoute` return `null` while loading?  
**A:** The auth state isn't determined yet (token may be validating with the server). Returning `null` prevents:
- Flash of login page before redirect to dashboard (if already logged in)
- Flash of protected content before redirect to login (if not logged in)

**Q124.** Why is the provider nesting order important?
```jsx
<ThemeProvider>
  <AuthProvider>
    <NotificationProvider>
      <ChatProvider>
        <DonationProvider>
          <Router>
```
**A:** Inner providers depend on outer ones:
- `NotificationProvider` and `ChatProvider` use `useAuth()` → need `AuthProvider` above
- `ChatProvider` uses `useNotification()` → needs `NotificationProvider` above
- `Router` must be inside all providers so routes can access all contexts

**Q125.** What is `<FloatingShapes />` and why is it outside the main content div?  
**A:** A decorative animated background component. It's placed at `z-index: 0` while the main content div has `z-index: 1`, creating layered depth — shapes animate behind the actual UI content.

### AuthContext.jsx

**Q126.** How does session restoration work on page refresh?
```jsx
useEffect(() => {
  const initializeSession = async () => {
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) { setLoading(false); return; }
    const response = await authAPI.getProfile();
    if (response.success) { setUser(response.data.user); setToken(savedToken); socketService.connect(savedToken); }
    else { logout(); }
  };
  initializeSession();
}, []);
```
**A:** On mount: reads token from localStorage. If no token → stop loading. If token exists → calls `GET /api/auth/me` to validate token and get fresh user data. If valid → restores user state and reconnects socket. If invalid (expired/deleted) → forces logout.

**Q127.** Why does `login` store both `user` and `auth_token` in localStorage?  
**A:** `auth_token` is needed by Axios interceptor for API calls. `user` JSON is stored for quick access to user data without an API call. On page refresh, the token validates the session, and user data is refreshed from the API.

**Q128.** What is `isAuthenticated` computed from?
```jsx
const isAuthenticated = !!user && !!token;
```
**A:** Both `user` state AND `token` state must be truthy. If either is null (e.g., after logout clears both), the user is not authenticated. The `!!` converts to boolean.

**Q129.** Why is `login` wrapped in `useCallback`?  
**A:** Prevents recreation of the function on every render. Since `login` might be passed as a prop or used in `useEffect` dependencies, `useCallback` ensures referential stability, preventing unnecessary re-renders.

**Q130.** What does `socketService.connect(accessToken)` do in the login function?  
**A:** Initializes the Socket.io connection with the JWT token for authentication. The backend's socket middleware verifies this token before allowing the connection. This enables real-time features immediately after login.

### ChatContext.jsx

**Q131.** What is optimistic update in `sendMessage`?
```jsx
const tempId = 'temp_' + Date.now();
const tempMessage = { _id: tempId, senderId: user?._id, receiverId, text, status: 'sent', createdAt: new Date().toISOString() };
setMessages(prev => ({ ...prev, [receiverId]: [...(prev[receiverId] || []), tempMessage] }));
```
**A:** The message appears in the UI immediately (with a temporary ID) BEFORE the API call completes. This makes the chat feel instant. If the API succeeds, the temp message is replaced with the real one. If it fails, the temp message is removed.

**Q132.** How does the temp message get replaced with the real message?
```jsx
setMessages((prev) => ({
  ...prev,
  [receiverId]: prev[receiverId].map((m) =>
    m._id === tempId && normalized ? normalized : m
  ),
}));
```
**A:** After the API returns, maps through messages for that contact. Finds the message with the temp ID and replaces it with the server-returned message (which has a real MongoDB `_id`, timestamps, etc.).

**Q133.** What happens if `sendMessage` fails?
```jsx
setMessages(prev => ({
  ...prev,
  [receiverId]: prev[receiverId].filter(m => m._id !== tempId)
}));
```
**A:** The optimistically-added temp message is removed from the UI, as if it was never sent. The user also sees an error toast. This prevents showing messages that weren't actually delivered.

**Q134.** How does the socket listener prevent duplicate messages?
```jsx
const mid = msg._id != null ? String(msg._id) : null;
if (mid && list.some((m) => String(m._id) === mid)) return prev;
return { ...prev, [contactId]: [...list, msg] };
```
**A:** Before adding a received message, checks if a message with the same `_id` already exists in the conversation (could happen if both HTTP response and socket event arrive). If it exists, returns the previous state unchanged.

**Q135.** How does `handleMessageReceived` determine which contact the message belongs to?
```jsx
const contactId = sid === uid && msg.receiverId ? String(msg.receiverId) : sid;
```
**A:** If the message sender is me (echoed back), the contact is the receiver. If someone else sent it, the contact is the sender. This correctly files messages into the right conversation regardless of direction.

### socket.js (Frontend Service)

**Q136.** Why is `SocketService` implemented as a class singleton?
```jsx
export const socketService = new SocketService();
```
**A:** A single instance ensures only one Socket.io connection exists across the entire app. Multiple connections would cause duplicate events, increased server load, and inconsistent online status.

**Q137.** What does `transports: ['websocket']` do?
```jsx
this.socket = io(SOCKET_URL, {
  auth: { token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```
**A:** Forces WebSocket transport only, skipping HTTP long-polling. WebSocket is faster and bidirectional. The default is to try polling first then upgrade to WebSocket — this skips the slow polling phase.

**Q138.** What reconnection strategy is configured?  
**A:** `reconnection: true` enables auto-reconnect. `reconnectionAttempts: 5` tries 5 times before giving up. `reconnectionDelay: 1000` waits 1 second between attempts. If all 5 fail, the socket stays disconnected until `connect()` is called again.

**Q139.** Why does `connect()` check `this.socket?.connected` first?
```jsx
if (this.socket && this.socket.connected) return this.socket;
```
**A:** Prevents creating duplicate connections. If already connected, returns the existing socket. Without this, calling `connect()` multiple times (e.g., on re-render) would create multiple Socket.io connections.

**Q140.** How does `disconnect()` clean up?
```jsx
disconnect() {
  if (this.socket) { this.socket.disconnect(); this.socket = null; }
}
```
**A:** Calls Socket.io's `disconnect()` to close the connection and send a disconnect event to the server. Sets `this.socket = null` so future `on/off/emit` calls are no-ops (they check `if (this.socket)`).

---

## 🔹 Section 8: API Service (api.js) — 10 Questions

**Q141.** How does the request interceptor attach auth tokens?
```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
**A:** Before every Axios request, reads the JWT from localStorage. If present, sets the `Authorization` header. This means every API call automatically includes auth — no need to manually pass tokens in components.

**Q142.** Why does the response interceptor return `response.data` instead of `response`?
```js
api.interceptors.response.use((response) => response.data, ...);
```
**A:** Unwraps Axios's response envelope. Without this, components would need `res.data.success`, `res.data.data.user`. With it, they get `res.success`, `res.data.user` directly. Cleaner API consumption.

**Q143.** How does the 401 interceptor prevent redirect loops?
```js
if (error.response?.status === 401 && !originalRequest._retry) {
  if (!originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/register')) {
    originalRequest._retry = true;
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}
```
**A:** Three protections:
1. `_retry` flag prevents infinite retry loops
2. Excludes login/register URLs (401 on these is an invalid credential, not an expired token)
3. Clears token before redirecting to prevent redirect-on-load loops

**Q144.** How does multipart donation upload work?
```js
create: (data, imageFiles = null) => {
  if (imageFiles?.length) {
    const fd = new FormData();
    fd.append('payload', JSON.stringify(data));
    imageFiles.forEach((file) => fd.append('images', file));
    return api.post('/donations', fd);
  }
  return api.post('/donations', data);
}
```
**A:** If images are provided, creates a `FormData` object. The donation data is JSON-stringified and added as `payload`. Each image file is appended under `images`. Axios auto-detects FormData and sets `Content-Type: multipart/form-data`.

**Q145.** Why does `authAPI.logout` return `Promise.resolve()` instead of calling the backend?  
**A:** The frontend logout just resolves immediately without calling `POST /api/auth/logout`. This is a shortcut — the backend endpoint exists to invalidate the refresh token, but the frontend skips it. The refresh token remains valid on the server, which is a security gap.

**Q146.** How does the `pickupsAPI.updateStatus` work?
```js
updateStatus: (id, status, extra = {}) => api.put('/pickup/status', { pickupId: id, status, ...extra }),
```
**A:** Sends the pickup ID, new status, and optional extra fields (notes, currentLocation) in the body. Unlike typical REST (PUT `/:id`), this uses a body-based ID — because the route is `PUT /pickup/status` not `PUT /pickup/:id/status`.

**Q147.** How does `usersAPI.toggleAvailability` work?  
**A:** Simple `PUT /users/volunteer/availability` with no body. The backend reads the current availability and flips it. Returns the new availability state.

**Q148.** What does `adminAPI.verifyNGO(id, status)` call?  
**A:** `api.put(`/admin/ngo/${id}/verify`, { status })` — calls the backend to set `ngoDetails.verified = true` for the specified NGO user.

**Q149.** How is the `matchingAPI` structured?
```js
getNearby: (params) => api.get('/matching/nearby', { params }),
autoAssign: (data) => api.post('/matching/auto-assign', data),
getStats: () => api.get('/matching/stats'),
```
**A:** Three endpoints: `getNearby` finds matching NGOs/volunteers for a donation (takes `donationId`, `type`, `radius`). `autoAssign` automatically picks the best volunteer. `getStats` returns area-wise matching statistics.

**Q150.** Why does the API timeout at 10 seconds?
```js
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });
```
**A:** Prevents the UI from hanging if the backend is slow/down. After 10 seconds, the request is aborted and the error interceptor handles it. Without a timeout, a dead server would leave requests pending indefinitely.

---

# PART C — WORKFLOW & SCENARIO QUESTIONS

---

## 🔹 Section 9: End-to-End Workflows — 20 Questions

**Q151.** Trace the exact API calls for: "Donor registers and posts a donation."  
**A:**
1. `POST /api/auth/register` → creates user, returns tokens
2. Socket.io connection established with token
3. `POST /api/donations` → creates donation with food details + location
4. Socket emits `donation:new` to all clients
5. Donation appears on NGO dashboards

**Q152.** Trace the exact API calls for: "NGO discovers and requests a donation."  
**A:**
1. `GET /api/donations` (or `GET /api/donations/nearby?lat=...&lng=...`) → finds available donations
2. `GET /api/donations/:id` → views donation details
3. `POST /api/requests` with `{ donationId, message, urgencyLevel }` → creates request
4. Donor receives notification via Socket.io

**Q153.** Trace the exact API calls for: "Donor approves a request."  
**A:**
1. `GET /api/requests?status=pending` → sees pending requests
2. `PUT /api/requests/:id/approve` → approves the request
3. Backend: donation → `accepted`, allocatedTo → NGO, other requests → `rejected`
4. NGO gets real-time notification

**Q154.** Trace the exact API calls for: "Volunteer completes a full pickup."  
**A:**
1. Volunteer gets notification `pickup:assigned`
2. `PUT /api/pickup/status` with `{ pickupId, status: 'accepted' }` → accepts
3. `PUT /api/pickup/status` with `{ status: 'en_route_pickup' }` → heading to donor
4. Socket emits `pickup:location-update` with GPS coordinates during transit
5. `PUT /api/pickup/status` with `{ status: 'picked_up' }` → collected food
6. `PUT /api/pickup/status` with `{ status: 'en_route_delivery' }` → heading to NGO
7. `PUT /api/pickup/status` with `{ status: 'delivered' }` → complete

**Q155.** What happens to each model when a pickup is delivered?  
**A:**
- **Pickup**: `status: 'delivered'`, `deliveredAt: Date`
- **Donation**: `status: 'delivered'`
- **User** (volunteer): `availability: true`, `totalPickups: +1`
- **Notification**: new notification for NGO
- Socket.io: `pickup_completed` event emitted to NGO

**Q156.** What happens if a donation expires while an NGO has a pending request?  
**A:** The cron job targets `available` and `requested` status. If status is `requested` and expiry passes, the donation becomes `expired`. The pending request is NOT automatically cancelled — it stays `pending` but the donation is no longer valid. (This could be a bug — should also cancel pending requests.)

**Q157.** What happens if two NGOs request the same donation simultaneously?  
**A:** Both requests are created (partial unique index allows multiple NGOs). The donation status becomes `requested`. The donor sees both requests. When one is approved, `Request.updateMany` auto-rejects all other pending requests for that donation.

**Q158.** How does the chat flow work end-to-end?  
**A:**
1. User opens chat → `GET /api/messages` fetches conversation list
2. User clicks contact → `GET /api/messages/:userId` fetches messages + marks as read
3. Socket.io emits `messages:read` to sender (read receipts)
4. User types → Socket.io `chat:typing` event sent
5. User sends → `POST /api/messages` → if receiver online, socket delivers instantly
6. Receiver's client listens for `message:received` socket event

**Q159.** What is the full notification flow?  
**A:**
1. Controller creates Notification document in MongoDB
2. Controller emits Socket.io event to user's room
3. Frontend `NotificationContext` receives socket event
4. Updates unread count badge in UI
5. User opens notifications → `GET /api/notifications`
6. User clicks notification → `PUT /api/notifications/:id/read`
7. After 90 days → MongoDB TTL index auto-deletes

**Q160.** How does the matching + auto-assign flow work?  
**A:**
1. `GET /api/matching/nearby?donationId=...&type=volunteers` → finds nearby volunteers
2. Backend calculates scores (distance, rating, availability)
3. `POST /api/matching/auto-assign` → picks best volunteer
4. Internally calls same logic as `POST /api/pickup/assign`
5. Creates pickup, updates donation, notifies volunteer

**Q161.** What happens during the avatar upload flow?  
**A:**
1. Frontend: `usersAPI.uploadAvatar(formData)` sends multipart with image file
2. Backend: Multer saves to `uploads/avatars/` with unique filename
3. `getFileUrl` constructs the full URL
4. User document updated with `avatar: URL`
5. Helmet's `cross-origin` policy allows frontend to load the image

**Q162.** How does the admin analytics dashboard get its data?  
**A:** Single call to `GET /api/admin/analytics?period=30` runs 12 parallel aggregation queries. Returns: user counts by role, donation counts by status/food type/time, request counts, pickup counts, average rating, waste reduced, recent donations, time-series data for charts.

**Q163.** What is the feedback loop after delivery?  
**A:**
1. After delivery, donor can rate the volunteer: `POST /api/feedback` with `category: 'volunteer_review'`
2. NGO can rate the donor: `POST /api/feedback` with `category: 'donor_review'`
3. Volunteer's average rating is recalculated and stored in `volunteerDetails.rating`
4. Higher-rated volunteers get better matching scores

**Q164.** What happens when an admin deactivates a user?  
**A:** `PUT /api/admin/users/:id` sets `isActive: false`. The user's JWT is still valid, but the `protect` middleware checks `user.isActive` on every request and blocks deactivated users with 401. Socket.io auth also blocks inactive users from connecting.

**Q165.** How does NGO verification work?  
**A:** `PUT /api/admin/ngo/:id/verify` sets `ngoDetails.verified = true`. This is a trust signal — verified NGOs might get priority in matching or display a verified badge in the UI.

**Q166.** What is the password change flow?  
**A:**
1. `PUT /api/auth/change-password` with `{ currentPassword, newPassword }`
2. Backend fetches user with `+password` (need current hash)
3. Verifies current password with `bcrypt.compare`
4. Sets `user.password = newPassword` → pre-save hook hashes it
5. Generates new tokens (invalidates old sessions)
6. Returns new access + refresh tokens

**Q167.** How does the donation search with filters work from frontend to backend?  
**A:**
1. Frontend: `donationsAPI.getAll({ status: 'pending', foodType: 'cooked_food', city: 'Mumbai', page: 1, limit: 10 })`
2. Axios sends as query params: `GET /api/donations?status=pending&foodType=cooked_food&city=Mumbai&page=1&limit=10`
3. Backend: controller builds MongoDB query from params, applies pagination, returns with total count

**Q168.** What is the seed data flow?  
**A:** `seed.js` creates test data: admin user, donors, NGOs, volunteers, donations, requests, pickups. Used for development and testing. Run with `node seed.js`. Must be run after MongoDB is connected.

**Q169.** How does the refresh token flow prevent replay attacks?  
**A:** Token rotation — when a refresh token is used, both tokens are replaced and the old refresh token is overwritten in the DB. If an attacker uses a stolen refresh token after the legitimate user already refreshed, the DB token won't match → rejected.

**Q170.** What is the deployment flow from code change to production?  
**A:**
1. Push code to GitHub
2. Render auto-detects push → builds backend (`npm install`) → starts (`npm start`)
3. Netlify auto-detects push → builds frontend (`npm run build`) → deploys static files
4. Render health check pings `/health` to confirm
5. Environment variables are set in respective dashboards

---

# PART D — BUG DETECTION & EDGE CASES

---

## 🔹 Section 10: Spot the Bug / Edge Cases — 15 Questions

**Q171.** The cron auto-expire checks `available` and `requested` but not `pending`. Is this a bug?  
**A:** Yes — likely a bug. The `Donation.checkExpiry()` model method includes `pending` in `OPEN_DONATION_STATUSES`, but the cron only targets `available` and `requested`. Pending donations that expire would not be auto-expired by the cron.

**Q172.** The frontend `authAPI.logout` doesn't call the backend. What's the impact?  
**A:** The refresh token remains valid in the database. If someone captured it, they could still refresh for new access tokens even after the user "logged out." Proper logout should call `POST /api/auth/logout` to clear the DB refresh token.

**Q173.** What happens if the Socket.io connection drops during a chat?  
**A:** Messages sent via HTTP (`POST /api/messages`) still work. But: (1) typing indicators stop, (2) incoming messages won't appear in real-time (need manual refresh), (3) online status is wrong. The `reconnection: true` config attempts auto-reconnect.

**Q174.** What if a volunteer's internet drops during `en_route_delivery`?  
**A:** The pickup stays in `en_route_delivery` indefinitely. No timeout mechanism exists to auto-fail stuck pickups. The admin would need to manually update the status. A production system should have a heartbeat/timeout mechanism.

**Q175.** Can a donor delete a donation that has feedback attached to it?  
**A:** Yes — there's no check for associated feedback before deletion. The feedback documents would have a `donationId` pointing to a non-existent donation (orphaned reference). This should be handled with cascade delete or soft-delete.

**Q176.** What happens if MongoDB disconnects while the server is running?  
**A:** Mongoose emits a `disconnected` event (logged as warning). It auto-attempts reconnection. During disconnection, all database queries fail — controllers would throw errors caught by `asyncHandler` and returned as 500s. The health endpoint would still respond (it doesn't query DB).

**Q177.** What's wrong with the `wasteReduced` calculation?
```js
Donation.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, totalKg: { $sum: '$quantity.value' } } }])
```
**A:** It sums all `quantity.value` regardless of unit. 10 kg + 5 liters + 3 packets = 18 "kg" — which is meaningless. Should either normalize units or sum by unit separately.

**Q178.** Can two users send messages to each other simultaneously? Any race condition?  
**A:** Yes, they can. No race condition because each message is an independent document. The `onlineUsers` check for delivery status might have a slight race (user disconnects between check and emit), but the message is still saved — just not marked as `delivered` immediately.

**Q179.** What happens if the `uploads/` directory is deleted while the server is running?  
**A:** File uploads would fail with ENOENT. The directory creation code only runs on startup. Solution: the upload middleware could check/create the directory before writing, or use cloud storage.

**Q180.** What if two admins approve different requests for the same donation simultaneously?  
**A:** Race condition. Both might pass the `status === 'pending'` check. Both would try to update the donation to `accepted`. The second one would succeed (last write wins), potentially leaving inconsistent data. Solution: use MongoDB transactions or optimistic locking.

**Q181.** Why is `getConversationList` potentially slow for users with many chats?
```js
const conversations = await Message.getConversationList(req.user._id);
const populatedConversations = await Promise.all(
  conversations.map(async (conv) => {
    const user = await User.findById(conv._id).select('name avatar role isActive');
    return { ...conv, user };
  })
);
```
**A:** For each conversation, makes a separate DB query to populate user info (N+1 queries). If a user has 50 conversations, that's 50 separate User queries. Should batch-fetch users with `User.find({ _id: { $in: ids } })`.

**Q182.** What if `VITE_API_URL` is set without the `/api` path suffix?  
**A:** All API calls would go to the wrong endpoints. Example: `api.get('/auth/me')` would hit `https://backend.com/auth/me` instead of `https://backend.com/api/auth/me`. The `/api` prefix is part of the base URL and must be included.

**Q183.** The `onlineUsers` map uses in-memory storage. What's the problem?  
**A:** (1) Lost on server restart — all users show as offline. (2) If you scale to multiple server instances, each has its own map — user online on server A appears offline on server B. Production fix: use Redis.

**Q184.** What if `expiryTime` is set to a past date during donation creation?  
**A:** The validation middleware catches it: `custom((value) => { if (new Date(value) <= new Date()) throw new Error(...) })`. The donation cannot be created with a past expiry time.

**Q185.** What happens if the image upload exceeds the `10mb` body limit?  
**A:** Express returns 413 Payload Too Large. However, the multipart upload via Multer might have its own limits configured separately. If Multer's limit is different from Express's JSON limit, there could be inconsistent behavior.

---

# PART E — QUICK-FIRE CODING QUESTIONS (50)

| # | Question | Answer |
|---|---|---|
| 186 | What does `req.user._id` contain after `protect` middleware? | The MongoDB ObjectId of the authenticated user |
| 187 | What does `.select('-password -refreshToken')` do? | Excludes those fields from the query result |
| 188 | What HTTP status code does `AppError('Not found', 404)` return? | 404 |
| 189 | What does `$in` operator do in MongoDB? | Matches any value in the given array |
| 190 | What does `$ne` operator do? | Not equal — matches all values that are not equal |
| 191 | What does `$gte` mean? | Greater than or equal to |
| 192 | What does `.lean()` do in Mongoose? | Returns plain JS objects instead of Mongoose documents (faster) |
| 193 | What does `findByIdAndUpdate` 3rd arg `{ new: true }` do? | Returns the document AFTER update (default returns before) |
| 194 | What does `{ runValidators: true }` do? | Runs schema validators on update operations |
| 195 | What is `$inc: { 'volunteerDetails.totalPickups': 1 }` doing? | Atomically incrementing totalPickups by 1 |
| 196 | What regex does `{ $regex: city, $options: 'i' }` use? | Case-insensitive partial match on the city field |
| 197 | What does `Math.ceil(total / limit)` calculate? | Total number of pages for pagination |
| 198 | What does `import.meta.env.VITE_API_URL` access? | Vite environment variable defined in `.env` |
| 199 | What does `Promise.all([q1, q2, q3])` do? | Runs all promises in parallel, resolves when ALL complete |
| 200 | What does `useCallback` do in React? | Memoizes a function to prevent recreation on re-renders |
| 201 | What does `useEffect(() => {...}, [])` (empty deps) do? | Runs the effect only once on component mount |
| 202 | What does `createContext(null)` create? | A React context with default value `null` |
| 203 | What does `<Navigate to="/login" replace />` do? | Client-side redirect, replacing current history entry |
| 204 | What does `express.Router()` create? | A modular, mountable route handler |
| 205 | What does the `...` spread operator do in `{ ...query }`? | Shallow copies all properties from `query` into a new object |
| 206 | What is `Optional Chaining (?.)` in `error.response?.status`? | Returns `undefined` instead of throwing if `response` is null |
| 207 | What does `socket.join('room')` do? | Adds the socket to a named room for targeted messaging |
| 208 | What does `io.to('room').emit('event', data)` do? | Sends event to ALL sockets in that room |
| 209 | What is `$or` in MongoDB? | Matches documents that satisfy ANY of the conditions |
| 210 | What does `sort({ createdAt: -1 })` do? | Sorts by createdAt in descending order (newest first) |
| 211 | What is `upsert: true` in MongoDB? | Insert document if no match found, update if found |
| 212 | What does `bcrypt.compare(plain, hash)` return? | A boolean promise — `true` if password matches hash |
| 213 | What does `jwt.sign({ id }, secret, { expiresIn: '7d' })` return? | A JWT string valid for 7 days |
| 214 | What does `jwt.verify(token, secret)` return? | The decoded payload (e.g., `{ id, role, iat, exp }`) |
| 215 | What does `Error.captureStackTrace(this, this.constructor)` do? | Captures stack trace, excluding constructor from trace |
| 216 | What does `next()` do in Express middleware? | Passes control to the next middleware in the chain |
| 217 | What does `next(error)` do? | Jumps to the error-handling middleware |
| 218 | What does `mongoose.Schema.Types.ObjectId` specify? | A field that references another document by its MongoDB ID |
| 219 | What does `ref: 'User'` do in a schema field? | Tells Mongoose which model to use when populating the reference |
| 220 | What does `.populate('donorId')` do? | Replaces the ObjectId with the actual referenced User document |
| 221 | What does `toObject()` do on Mongoose docs? | Converts Mongoose document to plain JavaScript object |
| 222 | What does `$sum: 1` do inside `$group`? | Counts documents in each group (like SQL COUNT) |
| 223 | What does `$avg: '$rating'` do? | Calculates average of the `rating` field across grouped docs |
| 224 | What is `$push: '$rating'` collecting? | Pushes all rating values into an array (for distribution) |
| 225 | What does `Object.keys(err.keyValue)[0]` get? | The field name that caused a duplicate key error |
| 226 | What does `parseInt(q.page, 10) || 1` do? | Parses page as base-10 integer, defaults to 1 if NaN |
| 227 | What does `Math.min(limit, 100)` prevent? | Users requesting more than 100 items per page |
| 228 | What does `{ $match: { status: 'delivered' } }` do? | Filters aggregation pipeline to only delivered documents |
| 229 | What does `require('mongoose').Types.ObjectId.createFromHexString(id)` do? | Converts string ID to ObjectId type for aggregation |
| 230 | What does `path.join(__dirname, 'uploads')` return? | Absolute path to the uploads directory |
| 231 | What does `fs.existsSync(path)` check? | Whether a file/directory exists (synchronous) |
| 232 | What does `cron.schedule('*/15 * * * *', callback)` mean? | Run callback every 15 minutes |
| 233 | What does `mongoose.connection.close()` do? | Closes all MongoDB connections in the pool |
| 234 | What does `process.exit(1)` signal? | Abnormal termination (error). `exit(0)` = clean exit |
| 235 | What does `morgan('combined')` log? | Full Apache-style HTTP logs (IP, method, URL, status, UA, time) |

---

> **Total: 235 questions** covering every controller function, every model method, every middleware, every socket event, every route, every frontend context, every API service call, real-world workflows, edge cases, and bug detection.
