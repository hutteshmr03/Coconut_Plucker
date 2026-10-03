// API client module connecting the React frontend to the FastAPI backend (/api)
// Designed according to Backend Specification API-001 through API-035

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('cp_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`[API] Fallback for ${endpoint}:`, err.message);
    throw err;
  }
}

// API-001 to API-004: Authentication
export const authAPI = {
  requestOTP: (phone) => request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOTP: (phone, otp, requestId) => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp, requestId }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' })
};

// API-005 to API-006: Customer
export const customerAPI = {
  getProfile: () => request('/customers/me'),
  updateProfile: (data) => request('/customers/me', { method: 'PUT', body: JSON.stringify(data) })
};

// API-007, API-008, API-025 to API-028: Services
export const servicesAPI = {
  getActiveServices: () => request('/services'),
  getServiceDetails: (id) => request(`/services/${id}`),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  getAllServicesAdmin: () => request('/services/admin'),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateServiceStatus: (id, status) => request(`/services/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};

// API-009 to API-013: Bookings & Quotes
export const bookingsAPI = {
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  calculateQuote: async (serviceId, baseRate, treeCount, bookingType = 'standard') => {
    try {
      return await request('/bookings/quote', {
        method: 'POST',
        body: JSON.stringify({ service_id: serviceId, tree_count: treeCount, booking_type: bookingType })
      });
    } catch {
      // Backend calculation simulation: 20% GST for urgent, 18% GST for normal
      const base = Number(baseRate || 0) * Number(treeCount || 1);
      const isUrgent = bookingType === 'urgent';
      const gstRate = isUrgent ? 0.20 : 0.18;
      const gstLabel = isUrgent ? '20% Urgent GST' : '18% GST';
      const gstAmount = Math.round(base * gstRate * 100) / 100;
      const total = Math.round((base + gstAmount) * 100) / 100;
      return {
        base_amount: base,
        surcharge_rate: 0,
        surcharge_label: gstLabel,
        surcharge_amount: 0,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        quote_amount: total
      };
    }
  },
  getMyBookings: () => request('/bookings'),
  getBookingDetails: (id) => request(`/bookings/${id}`),
  payBooking: (id, data) => request(`/bookings/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  reviewBooking: (id, data) => request(`/bookings/${id}/review`, { method: 'POST', body: JSON.stringify(data) })
};

// Section B.3: Server-driven Taluka Availability
export const availabilityAPI = {
  getAvailability: async (taluka, serviceId, bookingType = 'standard', customScheduling = null) => {
    let sched = customScheduling;
    if (!sched) {
      try {
        const saved = localStorage.getItem('coconut_plucker_state_v6_scheduling');
        if (saved) sched = JSON.parse(saved);
      } catch {}
    }

    const queryParams = new URLSearchParams({
      taluka: taluka || '',
      service_id: serviceId || '',
      booking_type: bookingType
    });

    if (sched?.northDays?.length) queryParams.set('north_days', sched.northDays.join(','));
    if (sched?.southDays?.length) queryParams.set('south_days', sched.southDays.join(','));
    if (sched?.kushavatiDays?.length) queryParams.set('kushavati_days', sched.kushavatiDays.join(','));

    try {
      return await request(`/availability?${queryParams.toString()}`);
    } catch {
      // Fallback server calculation simulation until live FastAPI route is invoked
      return getSimulatedServerAvailability(taluka, serviceId, bookingType, sched);
    }
  }
};

// Server-side availability simulation contract
function getSimulatedServerAvailability(taluka = 'North Goa', serviceId = '', bookingType = 'standard', customScheduling = null) {
  const isUrgent = bookingType === 'urgent';
  let sched = customScheduling;
  if (!sched) {
    try {
      const saved = localStorage.getItem('coconut_plucker_state_v6_scheduling');
      if (saved) sched = JSON.parse(saved);
    } catch {}
  }

  const clean = (taluka || '').toLowerCase();
  const isNorth = clean.includes('north');
  const isKushavati = clean.includes('kushavati');

  let allowedDayNames = [];
  if (isUrgent) {
    allowedDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  } else if (isNorth) {
    allowedDayNames = sched?.northDays || ['Monday', 'Tuesday', 'Wednesday'];
  } else if (isKushavati) {
    allowedDayNames = sched?.kushavatiDays || ['Saturday'];
  } else {
    // South Goa
    allowedDayNames = sched?.southDays || ['Thursday', 'Friday'];
  }

  const DAY_NAME_TO_INDEX = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const allowedDays = allowedDayNames
    .map((d) => DAY_NAME_TO_INDEX[d])
    .filter((idx) => typeof idx === 'number');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const availableDates = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + i);
    const dayOfWeek = candidate.getDay();

    if (allowedDays.includes(dayOfWeek)) {
      const iso = candidate.toISOString().slice(0, 10);
      const dayName = dayNames[dayOfWeek];
      const formatted = candidate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      availableDates.push({
        date: iso,
        day_name: dayName,
        label: `${formatted} ${dayName}`,
        time_slots: [
          { value: '08:00', label: '08:00 AM – 10:00 AM' },
          { value: '10:00', label: '10:00 AM – 12:00 PM' },
          { value: '14:00', label: '02:00 PM – 04:00 PM' },
          { value: '16:00', label: '04:00 PM – 06:00 PM' }
        ]
      });
    }
  }

  const nextAvailable = availableDates[0];
  const message = isUrgent
    ? `⚡ Urgent Priority: Next available dispatch is ${nextAvailable ? `${nextAvailable.day_name}, ${new Date(nextAvailable.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'tomorrow'} (Monday to Saturday available).`
    : (nextAvailable
        ? `Next available day for ${taluka} is ${nextAvailable.day_name}, ${new Date(nextAvailable.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
        : `No service days available in the next 14 days for ${taluka}.`);

  return {
    taluka,
    service_id: serviceId,
    booking_type: bookingType,
    allowed_days: allowedDayNames,
    available_dates: availableDates,
    next_available_date: nextAvailable ? nextAvailable.date : null,
    message
  };
}

// API-014 to API-020: Professional
export const professionalAPI = {
  getProfile: () => request('/professionals/me'),
  updateProfile: (data) => request('/professionals/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateSkills: (serviceIds) => request('/professionals/me/skills', { method: 'PUT', body: JSON.stringify({ service_ids: serviceIds }) }),
  getMyBookings: () => request('/professionals/me/bookings'),
  getBookingDetails: (id) => request(`/professionals/me/bookings/${id}`),
  startBooking: (id) => request(`/professionals/me/bookings/${id}/start`, { method: 'POST' }),
  completeBooking: (id) => request(`/professionals/me/bookings/${id}/complete`, { method: 'POST' })
};

// API-021 to API-035: Admin
export const adminAPI = {
  getDashboard: () => request('/admin/dashboard'),
  getCustomers: () => request('/admin/customers'),
  getProfessionals: () => request('/admin/professionals'),
  verifyProfessional: (id, decision, reason) => request(`/admin/professionals/${id}/verify`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),
  getAllBookings: () => request('/admin/bookings'),
  confirmBookingCall: (id) => request(`/admin/bookings/${id}/confirm-call`, { method: 'POST' }),
  assignBooking: (id, professionalId) => request(`/admin/bookings/${id}/assign`, { method: 'POST', body: JSON.stringify({ professional_id: professionalId }) }),
  getPayments: () => request('/admin/payments'),
  getReviews: () => request('/admin/reviews'),
  getIncidents: () => request('/admin/incidents'),
  updateIncident: (id, status) => request(`/admin/incidents/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getReports: () => request('/admin/reports')
};

// Super Admin Endpoints
export const superAdminAPI = {
  login: (username, password) => request('/super-admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getAdmins: () => request('/super-admin/admins'),
  createAdmin: (data) => request('/super-admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminStatus: (id, status) => request(`/super-admin/admins/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteAdmin: (id) => request(`/super-admin/admins/${id}`, { method: 'DELETE' }),
  changePassword: (currentPassword, newPassword) => request('/super-admin/change-password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) }),
  getAuditLogs: (params) => request(`/super-admin/audit-logs${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getSchedulingConfig: () => request('/super-admin/scheduling-config'),
  updateSchedulingConfig: (data) => request('/super-admin/scheduling-config', { method: 'PUT', body: JSON.stringify(data) })
};

