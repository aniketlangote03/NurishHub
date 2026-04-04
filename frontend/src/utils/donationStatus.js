/** Human-readable labels for donation lifecycle (viva / UI) */
export const DONATION_STATUS_LABELS = {
  pending: 'Pending',
  available: 'Available',
  requested: 'Requested',
  accepted: 'Accepted',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const DONATION_STATUS_FLOW =
  'Pending → Requested → Accepted → Assigned → Picked up → Delivered';
