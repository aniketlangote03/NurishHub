# NurishHub — Use Case Diagram

---

## 📊 UML Use Case Diagram

![NurishHub Use Case Diagram](d:\ngo project\NurishHub_UseCase_UML.png)

---

## 🎭 Actors

| Actor | Role | Access Level |
|---|---|---|
| 👤 **Guest** | Unauthenticated visitor | Browse & Register only |
| 🍱 **Donor** | Individual / restaurant donating food | Full donation lifecycle control |
| 🏢 **NGO** | Verified organisation claiming food | Request & track donations |
| 🚴 **Volunteer** | Delivery agent handling pickup & handoff | Manage assigned tasks |
| 🛡️ **Admin** | Platform administrator | Full system control |

---

## 📋 Use Case Descriptions

### 🔐 Authentication Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Register / Login | All | Create account with role, or login with email+password using JWT |
| Change Password | All (logged in) | Verify current password, set new one, invalidate all sessions |
| Update Profile | All (logged in) | Edit name, phone, location, avatar, and role-specific details |

### 🍛 Donation Management Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Create Food Listing | Donor | Post food with name, quantity, type, expiry, and location |
| Browse Nearby Donations | Guest, Donor, NGO | Search donations filtered by proximity, food type, or status |
| Edit Donation | Donor | Update details while donation is in `pending` status |
| Delete Donation | Donor, Admin | Remove if not in active request/pickup flow |

### 📋 Request & Approval Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Submit Donation Request | NGO | Claim an available donation with urgency level and message |
| Approve Request | Donor | Accept one NGO's request; system auto-rejects all others |
| Reject Request | Donor | Decline an NGO's request with a reason |
| Cancel Request | NGO | Withdraw own pending request; donation reverts if no others pending |

### 🚚 Pickup & Logistics Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Assign Volunteer | Donor, Admin | Manually pick a volunteer for the approved donation |
| Auto-Assign Volunteer | Admin | System picks nearest, highest-rated available volunteer |
| Accept Pickup Task | Volunteer | Volunteer confirms they will handle the delivery |
| Update Transit Status | Volunteer | Progress through `en_route_pickup → picked_up → en_route_delivery → delivered` |
| Verify Pickup OTP | Volunteer + Donor | OTP shared by donor to confirm handoff at source |
| Verify Delivery OTP | Volunteer + NGO | OTP shared by NGO to confirm arrival at destination |

### 💬 Communication Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Send / Receive Messages | All (logged in) | Real-time 1:1 chat via Socket.io |
| View Chat History | All (logged in) | Paginated conversation history per contact |
| View Notifications | All (logged in) | List of system alerts with read/unread state |

### ⭐ Feedback Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Submit Rating & Review | Donor, NGO | Rate volunteer or donor after delivery with 1-5 stars + tags |
| Reply to Feedback | Donor, NGO, Volunteer | The reviewed user can reply once to their review |

### ⚙️ Admin-Only Use Cases

| Use Case | Actors | Description |
|---|---|---|
| Verify NGO Account | Admin | Approve newly registered NGOs after credential check |
| Deactivate User | Admin | Block a user; JWT middleware immediately rejects their requests |
| View Analytics Dashboard | Admin | Charts for donations over time, food saved, user growth |
| Moderate Feedback | Admin | Hide inappropriate reviews from public visibility |

---

## 🔗 `<<include>>` Relationships

| Base Use Case | Includes | Meaning |
|---|---|---|
| Submit Donation Request | Browse Nearby Donations | NGO must first find a donation before requesting |
| Assign Volunteer | Approve Request | Volunteer assignment only possible after approval |
| Verify OTP | Update Transit Status | OTP verification triggers the next status transition |

---

## 🔄 Actor-to-Use-Case Matrix

| Use Case | Guest | Donor | NGO | Volunteer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Food Listing | ❌ | ✅ | ❌ | ❌ | ❌ |
| Browse Donations | ✅ | ✅ | ✅ | ❌ | ✅ |
| Submit Request | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve Request | ❌ | ✅ | ❌ | ❌ | ✅ |
| Assign Volunteer | ❌ | ✅ | ❌ | ❌ | ✅ |
| Auto-Assign | ❌ | ❌ | ❌ | ❌ | ✅ |
| Accept Pickup | ❌ | ❌ | ❌ | ✅ | ❌ |
| Update Transit Status | ❌ | ❌ | ❌ | ✅ | ❌ |
| Verify OTP | ❌ | ✅ | ✅ | ✅ | ❌ |
| Send Messages | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submit Rating | ❌ | ✅ | ✅ | ❌ | ❌ |
| Verify NGO | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ❌ | ✅ |
| Deactivate User | ❌ | ❌ | ❌ | ❌ | ✅ |
