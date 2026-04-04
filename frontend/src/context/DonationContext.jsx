import { createContext, useState, useCallback } from 'react';
import { donationsAPI, requestsAPI, pickupsAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

export const DonationContext = createContext(null);

export function DonationProvider({ children }) {
  const [donations, setDonations] = useState([]);
  const [nearbyDonations, setNearbyDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { error } = useNotification();

  // ─── Fetch Donations ────────────────────────────────────────────────────────
  const fetchDonations = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const res = await donationsAPI.getAll(filters);
      if (res.success) {
        setDonations(res.data.donations || []);
      }
    } catch (err) {
      error('Failed to load donations: ' + err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchNearby = useCallback(async (lat, lng, radius) => {
    try {
      const res = await donationsAPI.getNearby(lat, lng, radius);
      if (res.success) {
        setNearbyDonations(res.data.donations || []);
      }
    } catch (err) {
      error('Failed to find nearby donations: ' + err);
    }
  }, [error]);

  // ─── Optimistic Updates ─────────────────────────────────────────────────────
  
  // Create Donation
  const addDonation = async (donationData, imageFiles = null) => {
    try {
      const res = await donationsAPI.create(donationData, imageFiles);
      if (res.success) {
        setDonations((prev) => [res.data.donation, ...prev]);
        return { success: true, data: res.data.donation };
      }
      return { success: false, error: res.message || 'Create failed' };
    } catch (err) {
      error('Error creating donation: ' + err);
      return { success: false, error: err };
    }
  };

  // Update Donation Status (Optimistic)
  const updateDonationStatus = async (donationId, newStatus) => {
    // 1. Snapshot previous state
    const previousDonations = [...donations];
    
    // 2. Optimistic Update
    setDonations(prev => prev.map(d => 
      d._id === donationId ? { ...d, status: newStatus } : d
    ));

    // 3. API Call
    try {
      const res = await donationsAPI.update(donationId, { status: newStatus });
      if (!res.success) throw new Error(res.message);
    } catch (err) {
      // 4. Rollback on failure
      setDonations(previousDonations);
      error('Failed to update status. Reverted changes: ' + err);
    }
  };

  // NGO Approves a Request (Optimistic)
  const approveNgoRequest = async (requestId, donationId) => {
    const previousDonations = [...donations];
    
    // Optimistic Update: Mark the donation as assigned
    setDonations(prev => prev.map(d => 
      d._id === donationId ? { ...d, status: 'accepted' } : d
    ));

    try {
      const res = await requestsAPI.approve(requestId);
      if (!res.success) throw new Error(res.message);
    } catch (err) {
      setDonations(previousDonations);
      error('Failed to approve request: ' + err);
    }
  };

  // Volunteer Accepts Pickup (Optimistic)
  const acceptPickup = async (pickupId, donationId) => {
    const previousDonations = [...donations];
    
    // Optimistic: Mark the donation as picked_up or related status
    setDonations(prev => prev.map(d => 
      d._id === donationId ? { ...d, status: 'picked_up' } : d
    ));

    try {
      // The backend uses 'accepted' for pickup status, and updates donation status to 'picked_up'
      const res = await pickupsAPI.updateStatus(pickupId, 'accepted');
      if (!res.success) throw new Error(res.message);
    } catch (err) {
      setDonations(previousDonations);
      error('Failed to accept pickup: ' + err);
    }
  };

  return (
    <DonationContext.Provider value={{
      donations,
      nearbyDonations,
      loading,
      fetchDonations,
      fetchNearby,
      addDonation,
      updateDonationStatus,
      approveNgoRequest,
      acceptPickup,
    }}>
      {children}
    </DonationContext.Provider>
  );
}
