/** Maps pickup record status → next volunteer action (backend pickup status machine). */
export const PICKUP_NEXT_STATUS = {
  assigned: 'accepted',
  accepted: 'en_route_pickup',
  en_route_pickup: 'picked_up',
  picked_up: 'en_route_delivery',
  en_route_delivery: 'delivered',
};

export const PICKUP_STEP_LABELS = {
  assigned: 'Accept task',
  accepted: 'Heading to donor',
  en_route_pickup: 'Food collected',
  picked_up: 'Heading to NGO',
  en_route_delivery: 'Mark delivered',
};
