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
import {
  superAdminAPI,
  bookingsAPI,
  servicesAPI,
  adminAPI,
  customerAPI,
  professionalAPI
} from '../services/api';

export { normalizeTaluka };

const AppContext = createContext();

const STORAGE_KEY = "paddeli_state_v1";

const sanitizeServicesList = (list) =>
  list
    .filter((s) => s.id !== 'svc_orchard' && s.id !== 'svc_waste')
    .map((s) => {
      let cleanIcon = s.icon;
      if (!cleanIcon || cleanIcon.startsWith('data:') || cleanIcon.length > 10) {
        const defaultSvc = INITIAL_SERVICES.find((init) => init.id === s.id);
        cleanIcon = defaultSvc?.icon || '🌴';
      }
      return {
        ...s,
        icon: cleanIcon,
        image: s.image || (s.icon && s.icon.startsWith('data:image') ? s.icon : null) || s.image_url,
        image_url: s.image_url || (s.icon && s.icon.startsWith('data:image') ? s.icon : null) || s.image
      };
    });

export const AppProvider = ({ children }) => {
  const { currentUser, role: authRole, token } = useAuth();

  // Load saved state or use initial seed with strictly normalized talukas and verified service flags
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_services");
      let list = saved ? JSON.parse(saved) : INITIAL_SERVICES;
      if (!Array.isArray(list) || list.length === 0) list = INITIAL_SERVICES;
      // Filter out legacy discontinued services
      list = list.filter((s) => s.id !== 'svc_orchard' && s.id !== 'svc_waste');
      // Sanitize icon so base64 strings never leak into icon text
      list = list.map((s) => {
        let cleanIcon = s.icon;
        if (!cleanIcon || cleanIcon.startsWith('data:') || cleanIcon.length > 10) {
          const defaultSvc = INITIAL_SERVICES.find((init) => init.id === s.id);
          cleanIcon = defaultSvc?.icon || '🌴';
        }
        return {
          ...s,
          icon: cleanIcon,
          image: s.image || (s.icon && s.icon.startsWith('data:image') ? s.icon : null) || s.image_url,
          image_url: s.image_url || (s.icon && s.icon.startsWith('data:image') ? s.icon : null) || s.image
        };
      });
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
  const [currentCustomerId, setCurrentCustomerId] = useState(currentUser?.id || null);
  const [currentProfessionalId, setCurrentProfessionalId] = useState(currentUser?.id || null);
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

  // Hydrate live state from MySQL backend (nrlnxfke_paddeli) on load and role/login changes
  useEffect(() => {
    let cancelled = false;
    const isRealJwt = Boolean(token && !String(token).startsWith('token_'));

    const loadFromBackend = async () => {
      // 1. Public/Admin service catalog & regional scheduling
      try {
        const svcCall = (authRole === 'admin' || authRole === 'super_admin')
          ? servicesAPI.getAllServicesAdmin()
          : servicesAPI.getActiveServices();
        const remoteServices = await svcCall;
        if (!cancelled && Array.isArray(remoteServices) && remoteServices.length > 0) {
          setServices(sanitizeServicesList(remoteServices));
        }
      } catch (e) {
        console.warn('[Backend] Services fetch fallback:', e.message);
      }

      try {
        const cfg = await adminAPI.getSchedulingConfig();
        if (!cancelled && cfg && (cfg.north_days || cfg.northDays)) {
          setSchedulingConfig({
            northDays: cfg.north_days || cfg.northDays || DEFAULT_SCHEDULING.northDays,
            southDays: cfg.south_days || cfg.southDays || DEFAULT_SCHEDULING.southDays,
            kushavatiDays: cfg.kushavati_days || cfg.kushavatiDays || DEFAULT_SCHEDULING.kushavatiDays,
            maxDailyBookings: Number(cfg.max_daily_slots || cfg.maxDailyBookings || 15)
          });
        }
      } catch (e) {
        console.warn('[Backend] Scheduling config fetch fallback:', e.message);
      }

      if (!currentUser) return;

      // 2. Role-specific live data from MySQL
      if ((authRole === 'admin' || authRole === 'super_admin') && isRealJwt) {
        const [bkRes, custRes, proRes, incRes] = await Promise.allSettled([
          adminAPI.getAllBookings(),
          adminAPI.getCustomers(),
          adminAPI.getProfessionals(),
          adminAPI.getIncidents()
        ]);
        if (cancelled) return;
        if (bkRes.status === 'fulfilled' && Array.isArray(bkRes.value)) {
          setBookings(bkRes.value.map((b) => ({ ...b, taluka: normalizeTaluka(b?.taluka) })));
        }
        if (custRes.status === 'fulfilled' && Array.isArray(custRes.value)) {
          setCustomers(custRes.value.map((c) => ({ ...c, taluka: normalizeTaluka(c?.taluka) })));
        }
        if (proRes.status === 'fulfilled' && Array.isArray(proRes.value)) {
          setProfessionals(proRes.value.map((p) => ({ ...p, taluka: normalizeTaluka(p?.taluka) })));
        }
        if (incRes.status === 'fulfilled' && Array.isArray(incRes.value)) {
          setIncidents(incRes.value);
        }
      } else if (authRole === 'customer' && isRealJwt) {
        try {
          const myBk = await bookingsAPI.getMyBookings();
          if (!cancelled && Array.isArray(myBk)) {
            setBookings(myBk.map((b) => ({ ...b, taluka: normalizeTaluka(b?.taluka) })));
          }
        } catch (e) {
          console.warn('[Backend] Customer bookings fetch fallback:', e.message);
        }
      } else if (authRole === 'professional' && isRealJwt) {
        try {
          const proBk = await professionalAPI.getMyBookings();
          if (!cancelled && Array.isArray(proBk)) {
            setBookings(proBk.map((b) => ({ ...b, taluka: normalizeTaluka(b?.taluka) })));
            // Populate customer names/phones for AssignedJobCard display
            const derivedCustomers = proBk
              .filter((b) => b.customer_id)
              .map((b) => ({
                id: b.customer_id,
                full_name: b.customer_name || 'Customer',
                phone: b.customer_phone || '',
                taluka: normalizeTaluka(b.taluka)
              }));
            if (derivedCustomers.length > 0) {
              setCustomers((prev) => {
                const map = new Map(prev.map((c) => [c.id, c]));
                derivedCustomers.forEach((dc) => map.set(dc.id, { ...(map.get(dc.id) || {}), ...dc }));
                return Array.from(map.values());
              });
            }
          }
        } catch (e) {
          console.warn('[Backend] Professional bookings fetch fallback:', e.message);
        }
      }
    };

    loadFromBackend();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, authRole, token, currentView]);

  const updateSchedulingConfig = (newConfig) => {
    const merged = { ...schedulingConfig, ...newConfig };
    setSchedulingConfig(merged);
    adminAPI
      .updateSchedulingConfig(merged)
      .then(() => {
        showToast("Regional scheduling configuration updated and applied to customer booking!", "success");
      })
      .catch((err) => {
        console.warn('[Backend] Scheduling update fallback:', err.message);
        if (err.message && (err.message.includes('Authentication') || err.message.includes('expired') || err.message.includes('privileges'))) {
          showToast("Session expired — please Sign Out and Log In again to save scheduling to server.", "error");
        } else {
          showToast("Regional scheduling saved locally (server unreachable).", "warning");
        }
      });
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
  const currentCustomer = customers.find((c) => c.id === currentCustomerId) || customers[0] || null;
  const currentProfessional = professionals.find((p) => p.id === currentProfessionalId) || professionals[0] || null;

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

    // Asynchronously notify backend API and dispatch booking notification email to contact@paddeli.com
    try {
      const custObj = customers.find((c) => c.id === resolvedCustId) || currentUser;
      const custName = custObj?.full_name || custObj?.name || currentUser?.full_name || currentUser?.name || 'Customer';
      const custPhone = custObj?.phone || currentUser?.phone || 'N/A';
      const svcName = bookingData.service_name || (services.find((s) => s.id === bookingData.service_id)?.name) || 'Coconut Harvesting';

      bookingsAPI.createBooking({
        customer_id: resolvedCustId ? String(resolvedCustId) : undefined,
        customer_name: custName,
        customer_phone: custPhone,
        service_id: String(bookingData.service_id || 'svc_coconut'),
        service_name: svcName,
        booking_number: bookingNumber,
        tree_count: Number(bookingData.tree_count || 1),
        height_category: bookingData.height_category || null,
        taluka: bookingData.taluka || 'North Goa',
        address: bookingData.address || 'Goa',
        scheduled_at: bookingData.scheduled_at || new Date().toISOString(),
        booking_type: bookingData.booking_type || 'standard',
        payment_method: bookingData.payment_method || 'UPI',
        hazard_notes: bookingData.hazard_notes || '',
        tree_photo: bookingData.tree_photo || null
      }).then((created) => {
        if (created?.id) {
          setBookings((prev) =>
            prev.map((b) => (b.id === newId ? { ...b, ...created, taluka: normalizeTaluka(created.taluka) } : b))
          );
        }
      }).catch((err) => {
        console.warn('Backend booking sync warning:', err);
      });
    } catch (e) {
      console.warn('Backend booking dispatch error:', e);
    }

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
    adminAPI.confirmBookingCall(bookingId).catch((err) => console.warn('[Backend] Confirm call sync:', err.message));
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
    adminAPI.assignBooking(bookingId, professionalId).catch((err) => console.warn('[Backend] Assign sync:', err.message));
    showToast("Professional assigned to booking", "success");
  };

  const startJob = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "in_progress" } : b
      )
    );
    professionalAPI.startBooking(bookingId).catch((err) => console.warn('[Backend] Start job sync:', err.message));
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
    professionalAPI.completeBooking(bookingId).catch((err) => console.warn('[Backend] Complete job sync:', err.message));
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
    const tempId = "svc_" + Date.now().toString(36);
    const newService = {
      id: tempId,
      status: "active",
      ...serviceData
    };
    setServices((prev) => [...prev, newService]);
    servicesAPI
      .createService(serviceData)
      .then((created) => {
        if (created?.id) {
          setServices((prev) =>
            sanitizeServicesList(prev.map((s) => (s.id === tempId ? { ...s, ...created } : s)))
          );
        }
      })
      .catch((err) => console.warn('[Backend] Create service sync:', err.message));
    showToast(`Service "${serviceData.name}" added to catalog!`, "success");
  };

  const updateService = (serviceId, updatedData) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updatedData } : s))
    );
    servicesAPI
      .updateService(serviceId, updatedData)
      .catch((err) => console.warn('[Backend] Update service sync:', err.message));
    showToast("Service updated successfully", "success");
  };

  const toggleServiceStatus = (serviceId) => {
    const target = services.find((s) => s.id === serviceId);
    const nextStatus = target?.status === "active" ? "inactive" : "active";
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, status: nextStatus }
          : s
      )
    );
    servicesAPI
      .updateServiceStatus(serviceId, nextStatus)
      .catch((err) => console.warn('[Backend] Service status sync:', err.message));
    showToast("Service status updated", "info");
  };

  const deleteService = (serviceId) => {
    const target = services.find((s) => s.id === serviceId);
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    servicesAPI
      .deleteService(serviceId)
      .catch((err) => console.warn('[Backend] Delete service sync:', err.message));
    showToast(`Service "${target?.name || 'Item'}" deleted from catalog`, "warning");
  };

  const verifyProfessional = (proId, decision) => {
    const nextStatus = decision === "approve" ? "approved" : "rejected";
    setProfessionals((prev) =>
      prev.map((p) =>
        p.id === proId
          ? { ...p, status: nextStatus }
          : p
      )
    );
    adminAPI
      .verifyProfessional(proId, nextStatus)
      .catch((err) => console.warn('[Backend] Verify pro sync:', err.message));
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
    adminAPI
      .createProfessional(proData)
      .then((created) => {
        if (created?.id) {
          setProfessionals((prev) =>
            prev.map((p) => (p.id === newId ? { ...p, ...created, taluka: normalizeTaluka(created.taluka) } : p))
          );
        }
      })
      .catch((err) => console.warn('[Backend] Create professional sync:', err.message));
    showToast(`Professional Climber "${proData.full_name}" onboarded successfully!`, "success");
    return newPro;
  };

  const addIncident = (incidentData) => {
    const tempId = "inc_" + Date.now().toString(36);
    const newIncident = {
      id: tempId,
      status: "open",
      created_at: new Date().toISOString(),
      ...incidentData
    };
    setIncidents((prev) => [newIncident, ...prev]);
    adminAPI
      .createIncident(incidentData)
      .then((created) => {
        if (created?.id) {
          setIncidents((prev) => prev.map((i) => (i.id === tempId ? { ...i, ...created } : i)));
        }
      })
      .catch((err) => console.warn('[Backend] Create incident sync:', err.message));
    showToast("Safety incident report submitted", "warning");
  };

  const resolveIncident = (incidentId) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId ? { ...i, status: "resolved" } : i
      )
    );
    adminAPI
      .updateIncident(incidentId, "resolved")
      .catch((err) => console.warn('[Backend] Resolve incident sync:', err.message));
    showToast("Incident marked as resolved", "success");
  };

  const updateCustomerProfile = (profileData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === currentCustomerId ? { ...c, ...profileData } : c))
    );
    customerAPI
      .updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        taluka: profileData.taluka,
        address: profileData.address
      })
      .catch((err) => console.warn('[Backend] Update customer profile sync:', err.message));
    showToast("Profile updated successfully", "success");
  };

  const updateProfessionalProfile = (profileData) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === currentProfessionalId ? { ...p, ...profileData } : p))
    );
    professionalAPI
      .updateProfile({
        full_name: profileData.full_name,
        taluka: profileData.taluka,
        experience_years: profileData.experience_years,
        safety_cert: profileData.safety_cert,
        skills: profileData.skills
      })
      .catch((err) => console.warn('[Backend] Update pro profile sync:', err.message));
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
