import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
  INITIAL_PROFESSIONALS,
  INITIAL_BOOKINGS,
  INITIAL_INCIDENTS
} from '../services/mockData';
import { normalizeTaluka } from '../utils/helpers';
import { superAdminAPI } from '../services/api';

export { normalizeTaluka };

const AppContext = createContext();

const STORAGE_KEY = "coconut_plucker_state_v8";

export const AppProvider = ({ children }) => {
  const { currentUser, role: authRole } = useAuth();

  // Load saved state or use initial seed with strictly normalized talukas and verified service flags
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_services");
      let list = saved ? JSON.parse(saved) : INITIAL_SERVICES;
      if (!Array.isArray(list) || list.length === 0) list = INITIAL_SERVICES;
      // Filter out legacy discontinued services
      list = list.filter((s) => s.id !== 'svc_orchard' && s.id !== 'svc_waste');
      return list;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_customers");
      const list = saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
      if (!Array.isArray(list)) return INITIAL_CUSTOMERS;
      return list.map((c) => ({ ...c, taluka: normalizeTaluka(c?.taluka) }));
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [professionals, setProfessionals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_pros");
      const list = saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
      if (!Array.isArray(list)) return INITIAL_PROFESSIONALS;
      return list.map((p) => ({ ...p, taluka: normalizeTaluka(p?.taluka) }));
    } catch {
      return INITIAL_PROFESSIONALS;
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_bookings");
      const list = saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
      if (!Array.isArray(list)) return INITIAL_BOOKINGS;
      return list
        .filter((b) => b.id !== 'bkg_003' && b.booking_number !== 'CP-1003')
        .map((b) => ({ ...b, taluka: normalizeTaluka(b?.taluka) }));
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_incidents");
      const list = saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
      if (!Array.isArray(list)) return INITIAL_INCIDENTS;
      return list;
    } catch {
      return INITIAL_INCIDENTS;
    }
  });

  const DEFAULT_SCHEDULING = {
    northDays: ['Monday', 'Tuesday', 'Wednesday'],
    southDays: ['Thursday', 'Friday'],
    kushavatiDays: ['Saturday'],
    maxDailyBookings: 15
  };

  const [schedulingConfig, setSchedulingConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_scheduling");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULING;
  });

  const [currentRole, setCurrentRole] = useState("customer"); // 'customer' | 'professional' | 'admin'
  const [currentCustomerId, setCurrentCustomerId] = useState(currentUser?.id || "cus_001");
  const [currentProfessionalId, setCurrentProfessionalId] = useState(currentUser?.id || "wrk_001");
  const [currentView, setCurrentView] = useState("cust-book");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  // Sync logged in user from AuthContext
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'customer') {
        setCurrentCustomerId(currentUser.id);
        setCustomers((prev) => {
          if (!prev.some((c) => c.id === currentUser.id)) {
            return [...prev, { ...currentUser, taluka: normalizeTaluka(currentUser.taluka) }];
          }
          return prev.map((c) => (c.id === currentUser.id ? { ...c, ...currentUser } : c));
        });
      } else if (currentUser.role === 'professional') {
        setCurrentProfessionalId(currentUser.id);
        setProfessionals((prev) => {
          if (!prev.some((p) => p.id === currentUser.id)) {
            return [
              ...prev,
              {
                ...currentUser,
                status: currentUser.status || 'approved',
                skills: currentUser.skills || ['svc_coconut', 'svc_areca', 'svc_palm', 'svc_trim'],
                rating_avg: currentUser.rating_avg || 5.0,
                taluka: normalizeTaluka(currentUser.taluka)
              }
            ];
          }
          return prev.map((p) => (p.id === currentUser.id ? { ...p, ...currentUser } : p));
        });
      }
    }
  }, [currentUser]);

  // Sync to local storage with defensive try/catch
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_services", JSON.stringify(services));
    } catch (e) {
      console.warn("Storage write failed for services:", e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_customers", JSON.stringify(customers));
    } catch (e) {
      console.warn("Storage write failed for customers:", e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_pros", JSON.stringify(professionals));
    } catch (e) {
      console.warn("Storage write failed for pros:", e);
    }
  }, [professionals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_bookings", JSON.stringify(bookings));
    } catch (e) {
      console.warn("Storage write failed for bookings:", e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_incidents", JSON.stringify(incidents));
    } catch (e) {
      console.warn("Storage write failed for incidents:", e);
    }
  }, [incidents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + "_scheduling", JSON.stringify(schedulingConfig));
    } catch (e) {
      console.warn("Storage write failed for scheduling:", e);
    }
  }, [schedulingConfig]);

  const updateSchedulingConfig = (newConfig) => {
    setSchedulingConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      superAdminAPI.updateSchedulingConfig(merged).catch(() => {});
      return merged;
    });
    showToast("Regional scheduling configuration updated and applied to customer booking!", "success");
  };

  // Toast Notification helper
  const showToast = (message, type = "info") => {
    const id = "toast_" + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Helper getters
  const currentCustomer = customers.find((c) => c.id === currentCustomerId) || customers[0];
  const currentProfessional = professionals.find((p) => p.id === currentProfessionalId) || professionals[0];

  // Actions
  const addBooking = (bookingData) => {
    const newId = "bkg_" + Date.now().toString(36);
    const bookingNumber = "CP-" + (1000 + bookings.length + 1);
    const isUrgent = bookingData.booking_type === 'urgent';
    const quoteAmt = Number(bookingData.quote_amount || 0);
    const resolvedCustId = bookingData.customer_id || currentUser?.id || currentCustomerId;
    const newBooking = {
      id: newId,
      booking_number: bookingNumber,
      customer_id: resolvedCustId,
      professional_id: null,
      status: "requested",
      booking_type: bookingData.booking_type || 'standard',
      call_confirmed: !isUrgent, // Urgent bookings require Admin confirmation call before assignment
      base_amount: Number(bookingData.base_amount || bookingData.quote_amount),
      surcharge_amount: Number(bookingData.surcharge_amount || 0),
      quote_amount: quoteAmt,
      actual_amount: bookingData.actual_amount || quoteAmt,
      payment_status: bookingData.payment_status || "paid",
      payment_method: bookingData.payment_method || "UPI",
      paid_at: bookingData.paid_at || new Date().toISOString(),
      rating: null,
      comment: null,
      created_at: new Date().toISOString(),
      ...bookingData
    };
    setBookings((prev) => [newBooking, ...prev]);
    showToast(
      isUrgent
        ? `⚡ Payment of ₹${quoteAmt.toFixed(2)} received! Urgent Booking ${bookingNumber} placed (Awaiting Admin confirmation call).`
        : `💳 Payment of ₹${quoteAmt.toFixed(2)} confirmed! Booking ${bookingNumber} placed successfully.`,
      isUrgent ? "warning" : "success"
    );
    return newBooking;
  };

  const confirmBookingCall = (bookingId, custObj) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, call_confirmed: true }
          : b
      )
    );
    const displayName = custObj ? getDisplayName(custObj) : 'Customer';
    const phoneInfo = custObj?.phone ? ` (${custObj.phone})` : '';
    showToast(`📞 Connecting to ${displayName}${phoneInfo}... Call confirmation recorded.`, "success");
  };

  const assignBooking = (bookingId, professionalId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, professional_id: professionalId, status: "assigned" }
          : b
      )
    );
    showToast("Professional assigned to booking", "success");
  };

  const startJob = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "in_progress" } : b
      )
    );
    showToast("Job marked in progress. Stay safe!", "success");
  };

  const completeJob = (bookingId, actualAmount) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const finalAmt = Number(actualAmount || b.quote_amount);
        return {
          ...b,
          status: "completed",
          actual_amount: finalAmt,
          paid_amount: finalAmt,
          payment_status: "paid"
        };
      })
    );
    showToast("Job marked complete. Full payment received upfront.", "success");
  };

  const payBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const total = Number(b.actual_amount || b.quote_amount);
        return {
          ...b,
          paid_amount: total,
          payment_status: "paid"
        };
      })
    );
    showToast("Payment processed successfully!", "success");
  };

  const reviewBooking = (bookingId, rating, comment) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, rating, comment } : b
      )
    );

    // Recalculate average rating for assigned professional
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking && booking.professional_id) {
      const proBookings = bookings.filter(
        (b) => b.professional_id === booking.professional_id && (b.id === bookingId ? rating : b.rating)
      );
      const sum = proBookings.reduce((acc, curr) => acc + (curr.id === bookingId ? rating : (curr.rating || 0)), 0);
      const rawAvg = proBookings.length > 0 ? sum / proBookings.length : Number(rating || 5);
      const avg = isNaN(rawAvg) ? 5.0 : Math.max(1.0, Math.min(5.0, Math.round(rawAvg * 10) / 10));
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === booking.professional_id ? { ...p, rating_avg: avg } : p
        )
      );
    }

    showToast("Thank you for submitting your review!", "success");
  };

  const addService = (serviceData) => {
    const newService = {
      id: "svc_" + Date.now().toString(36),
      status: "active",
      ...serviceData
    };
    setServices((prev) => [...prev, newService]);
    showToast(`Service "${serviceData.name}" added to catalog!`, "success");
  };

  const updateService = (serviceId, updatedData) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updatedData } : s))
    );
    showToast("Service updated successfully", "success");
  };

  const toggleServiceStatus = (serviceId) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, status: s.status === "active" ? "inactive" : "active" }
          : s
      )
    );
    showToast("Service status updated", "info");
  };

  const deleteService = (serviceId) => {
    const target = services.find((s) => s.id === serviceId);
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    showToast(`Service "${target?.name || 'Item'}" deleted from catalog`, "warning");
  };

  const verifyProfessional = (proId, decision) => {
    setProfessionals((prev) =>
      prev.map((p) =>
        p.id === proId
          ? { ...p, status: decision === "approve" ? "approved" : "rejected" }
          : p
      )
    );
    showToast(
      `Professional ${decision === "approve" ? "Approved" : "Rejected"}`,
      decision === "approve" ? "success" : "warning"
    );
  };

  const addProfessional = (proData) => {
    const newId = proData.id || ("wrk_" + Date.now().toString(36));
    const newPro = {
      id: newId,
      full_name: proData.full_name,
      phone: proData.phone,
      taluka: proData.taluka,
      experience_years: Number(proData.experience_years) || 1,
      safety_cert: proData.safety_cert || 'Certified Climber',
      rating_avg: Number(proData.rating_avg) || 5.0,
      skills: proData.skills || ['svc_coconut', 'svc_palm'],
      status: proData.status || 'approved',
      created_at: new Date().toISOString()
    };
    setProfessionals((prev) => [newPro, ...prev]);
    showToast(`Professional Climber "${proData.full_name}" onboarded successfully!`, "success");
    return newPro;
  };

  const addIncident = (incidentData) => {
    const newIncident = {
      id: "inc_" + Date.now().toString(36),
      status: "open",
      created_at: new Date().toISOString(),
      ...incidentData
    };
    setIncidents((prev) => [newIncident, ...prev]);
    showToast("Safety incident report submitted", "warning");
  };

  const resolveIncident = (incidentId) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId ? { ...i, status: "resolved" } : i
      )
    );
    showToast("Incident marked as resolved", "success");
  };

  const updateCustomerProfile = (profileData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === currentCustomerId ? { ...c, ...profileData } : c))
    );
    showToast("Profile updated successfully", "success");
  };

  const updateProfessionalProfile = (profileData) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === currentProfessionalId ? { ...p, ...profileData } : p))
    );
    showToast("Professional profile updated", "success");
  };

  return (
    <AppContext.Provider
      value={{
        services,
        customers,
        professionals,
        bookings,
        incidents,
        currentRole,
        setCurrentRole,
        currentCustomerId,
        setCurrentCustomerId,
        currentProfessionalId,
        setCurrentProfessionalId,
        currentCustomer,
        currentProfessional,
        currentView,
        setCurrentView,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toasts,
        showToast,
        selectedServiceForBooking,
        setSelectedServiceForBooking,
        // Action methods
        addBooking,
        confirmBookingCall,
        assignBooking,
        startJob,
        completeJob,
        payBooking,
        reviewBooking,
        addService,
        updateService,
        toggleServiceStatus,
        deleteService,
        verifyProfessional,
        addProfessional,
        addIncident,
        resolveIncident,
        updateCustomerProfile,
        updateProfessionalProfile,
        schedulingConfig,
        updateSchedulingConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
