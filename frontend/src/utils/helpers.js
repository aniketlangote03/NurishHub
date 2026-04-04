// Date formatting
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatRelative = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
};

// Status helpers
export const statusColors = {
  pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
  approved: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  'in-transit': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  delivered: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  expired: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  inactive: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
};

export const getStatusColor = (status) => {
  return statusColors[status?.toLowerCase()] || statusColors.pending;
};

// Role labels
export const roleLabels = {
  donor: 'Donor',
  ngo: 'NGO',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

export const roleColors = {
  donor: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
  ngo: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  volunteer: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
  admin: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
};

// Validation
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhone = (phone) => /^\+?[\d\s-]{10,}$/.test(phone);
export const validateRequired = (value) => value && value.toString().trim().length > 0;

// Truncate text
export const truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

// Generate ID
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Categories
export const donationCategories = [
  'Cooked Food', 'Raw Vegetables', 'Fruits', 'Grains & Cereals',
  'Dairy Products', 'Baked Goods', 'Canned Food', 'Beverages', 'Other',
];

// Avatar placeholder
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Number formatting
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};
