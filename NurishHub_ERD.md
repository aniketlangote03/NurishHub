# NurishHub – Entity Relationship Diagram

---

## 📊 ERD Diagram

![NurishHub Entity Relationship Diagram](d:\ngo project\NurishHub_ERD.png)

---

## 🗂️ Collections & Fields Reference

### USERS
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | MongoDB ObjectId primary key |
| | name | TEXT | Full name |
| | email | TEXT | Unique login email |
| | password | TEXT | bcrypt hashed, hidden from queries |
| | role | TEXT | `donor` / `ngo` / `volunteer` / `admin` |
| | phone | TEXT | Contact number |
| | address | TEXT | Text address |
| | city | TEXT | City for filtering |
| | avatar | TEXT | Profile image URL |
| | isActive | BOOLEAN | Account active status |
| | lastLogin | TIMESTAMP | Last login time |
| | refreshToken | TEXT | JWT refresh token (hidden) |
| | ngo_regNumber | TEXT | NGO registration number |
| | ngo_verified | BOOLEAN | Admin-approved flag |
| | vol_vehicleType | TEXT | `bicycle` / `motorcycle` / `car` / `van` |
| | vol_availability | BOOLEAN | Ready for new pickup? |
| | vol_rating | NUMERIC | Calculated avg rating (0–5) |
| | vol_totalPickups | INTEGER | Lifetime delivery count |
| | createdAt | TIMESTAMP | Account creation time |

---

### DONATIONS
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | donorId | UUID | → USERS (donor who posted) |
| FK | allocatedTo | UUID | → USERS (NGO approved) |
| FK | assignedVolunteer | UUID | → USERS (volunteer assigned) |
| | foodName | TEXT | Name of food item |
| | foodType | TEXT | `cooked_food` / `dry_ration` / `packaged` / `beverages` |
| | dietType | TEXT | `veg` / `non_veg` |
| | isVegetarian | BOOLEAN | Shortcut boolean for diet type |
| | quantity_value | NUMERIC | Amount of food |
| | quantity_unit | TEXT | `kg` / `liters` / `packets` / `servings` |
| | expiryTime | TIMESTAMP | Food expiry deadline |
| | status | TEXT | `pending→requested→accepted→assigned→picked_up→delivered` |
| | location_lng | NUMERIC | Longitude (GeoJSON 2dsphere) |
| | location_lat | NUMERIC | Latitude |
| | address | TEXT | Pickup address |
| | city | TEXT | City for text search |
| | description | TEXT | Additional notes |
| | isExpired | BOOLEAN | Expiry flag |
| | createdAt | TIMESTAMP | Listing creation time |

---

### REQUESTS
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | ngoId | UUID | → USERS (NGO submitting) |
| FK | donationId | UUID | → DONATIONS (targeted donation) |
| | status | TEXT | `pending` / `approved` / `rejected` / `cancelled` |
| | message | TEXT | NGO's request message |
| | urgencyLevel | TEXT | `low` / `medium` / `high` / `critical` |
| | beneficiaryCount | INTEGER | Number of people benefiting |
| | approvedAt | TIMESTAMP | When approved |
| | rejectedAt | TIMESTAMP | When rejected |
| | rejectionReason | TEXT | Reason for rejection |
| | createdAt | TIMESTAMP | Request creation time |

---

### PICKUPS
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | donationId | UUID | → DONATIONS |
| FK | volunteerId | UUID | → USERS (volunteer) |
| FK | ngoId | UUID | → USERS (receiving NGO) |
| FK | donorId | UUID | → USERS (food source donor) |
| | status | TEXT | `assigned→accepted→en_route_pickup→picked_up→en_route_delivery→delivered` |
| | pickupLoc_lng | NUMERIC | Donor's longitude |
| | pickupLoc_lat | NUMERIC | Donor's latitude |
| | deliveryLoc_lng | NUMERIC | NGO's longitude |
| | deliveryLoc_lat | NUMERIC | NGO's latitude |
| | currentLoc_lng | NUMERIC | Live volunteer longitude |
| | currentLoc_lat | NUMERIC | Live volunteer latitude |
| | pickupOtp | TEXT | OTP for donor handoff (hidden) |
| | deliveryOtp | TEXT | OTP for NGO handoff (hidden) |
| | assignedAt | TIMESTAMP | Task assigned time |
| | pickedUpAt | TIMESTAMP | Food collected time |
| | deliveredAt | TIMESTAMP | Delivery completed time |
| | failureReason | TEXT | Reason if failed |
| | createdAt | TIMESTAMP | Pickup record creation |

---

### MESSAGES
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | senderId | UUID | → USERS |
| FK | receiverId | UUID | → USERS |
| | text | TEXT | Message content |
| | status | TEXT | `sent` / `delivered` / `read` |
| | deletedBySender | BOOLEAN | Soft-delete for sender |
| | deletedByReceiver | BOOLEAN | Soft-delete for receiver |
| | deliveredAt | TIMESTAMP | Socket delivery time |
| | readAt | TIMESTAMP | Read receipt time |
| | createdAt | TIMESTAMP | Message sent time |

---

### NOTIFICATIONS
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | userId | UUID | → USERS (recipient) |
| | title | TEXT | Short heading |
| | message | TEXT | Full notification body |
| | type | TEXT | `request_approved` / `pickup_assigned` / `donation_expired` etc. |
| | isRead | BOOLEAN | Read status |
| | readAt | TIMESTAMP | When read |
| | relatedId | UUID | Reference to related document |
| | relatedModel | TEXT | `Donation` / `Pickup` / `Request` |
| | createdAt | TIMESTAMP | Auto-deleted after 90 days (TTL index) |

---

### FEEDBACK
| Label | Field | Type | Description |
|---|---|---|---|
| PK | _id | UUID | Primary key |
| FK | userId | UUID | → USERS (reviewer) |
| FK | targetUserId | UUID | → USERS (person being reviewed) |
| FK | donationId | UUID | → DONATIONS |
| FK | pickupId | UUID | → PICKUPS |
| | rating | INTEGER | 1 to 5 stars |
| | comment | TEXT | Written review |
| | tags | TEXT | `on_time` / `fresh_food` / `professional` / `late` |
| | category | TEXT | `volunteer_review` / `donor_review` / `platform_review` |
| | isHidden | BOOLEAN | Admin moderation flag |
| | hiddenReason | TEXT | Reason if hidden |
| | reply_text | TEXT | Target user's reply |
| | reply_repliedAt | TIMESTAMP | Reply timestamp |
| | createdAt | TIMESTAMP | Review creation time |

---

## 🔗 Relationships

| From Table | Field | → | To Table | Cardinality |
|---|---|---|---|---|
| USERS | _id | → | DONATIONS.donorId | 1 : N |
| USERS | _id | → | DONATIONS.allocatedTo | 1 : N |
| USERS | _id | → | DONATIONS.assignedVolunteer | 1 : N |
| DONATIONS | _id | → | REQUESTS.donationId | 1 : N |
| USERS | _id | → | REQUESTS.ngoId | 1 : N |
| DONATIONS | _id | → | PICKUPS.donationId | 1 : 1 |
| USERS | _id | → | PICKUPS.volunteerId | 1 : N |
| USERS | _id | → | PICKUPS.ngoId | 1 : N |
| USERS | _id | → | PICKUPS.donorId | 1 : N |
| USERS | _id | → | MESSAGES.senderId | 1 : N |
| USERS | _id | → | MESSAGES.receiverId | 1 : N |
| USERS | _id | → | NOTIFICATIONS.userId | 1 : N |
| USERS | _id | → | FEEDBACK.userId | 1 : N |
| USERS | _id | → | FEEDBACK.targetUserId | 1 : N |
| DONATIONS | _id | → | FEEDBACK.donationId | 1 : N |
| PICKUPS | _id | → | FEEDBACK.pickupId | 1 : N |
