import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { availabilityAPI, bookingsAPI } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';
import { EmergencyBookingModal } from './EmergencyBookingModal';
import { RazorpayPaymentModal } from './RazorpayPaymentModal';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Plus,
  Calendar,
  Zap,
  PhoneCall,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Lock,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Minus,
  ShoppingCart,
  Trash2,
  Edit3
} from 'lucide-react';
import { getTalukaDayConfig, formatScheduledDateLabel, getServiceImage, SERVICE_IMAGES, compressImageFile } from '../../utils/helpers';

export const BookingWizard = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const {
    services,
    customers,
    addService,
    addBooking,
    selectedServiceForBooking,
    setSelectedServiceForBooking,
    schedulingConfig
  } = useApp();

  const customerProfile = customers?.find((c) => c.id === currentUser?.id || c.phone === currentUser?.phone) || currentUser;

  const TALUKAS = [
    { value: '', label: '-- Select one --' },
    { value: 'North Goa', label: t('taluka_north_goa', 'North Goa') },
    { value: 'South Goa', label: t('taluka_south_goa', 'South Goa') },
    { value: 'Kushavati', label: t('taluka_kushavati', 'Kushavati') }
  ];

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(
    selectedServiceForBooking?.id || services[0]?.id || ''
  );
  const [serviceCart, setServiceCart] = useState([]);
  const [treeCount, setTreeCount] = useState(1);
  const [heightCategory, setHeightCategory] = useState('medium'); // 'low' | 'medium' | 'high'
  const [taluka, setTaluka] = useState(
    customerProfile?.taluka || currentUser?.taluka || 'South Goa'
  );
  const [address, setAddress] = useState(
    customerProfile?.address || currentUser?.address || ''
  );
  const [bookingType, setBookingType] = useState('standard'); // 'standard' | 'urgent'

  // Backend quote calculation breakdown
  const [quoteData, setQuoteData] = useState({
    base_amount: 0,
    surcharge_rate: 0,
    surcharge_label: null,
    surcharge_amount: 0,
    quote_amount: 0
  });

  // Step 3: Server-driven availability state & Advance Booking
  const [availabilityData, setAvailabilityData] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [customAdvanceDate, setCustomAdvanceDate] = useState('');
  const [customDateError, setCustomDateError] = useState('');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [treePhoto, setTreePhoto] = useState(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingPhoto(true);
      setPhotoError('');
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.72);
        setTreePhoto(compressed);
      } catch (err) {
        console.error('Tree photo compression error:', err);
        setPhotoError('Could not process photo. Please try choosing a smaller image.');
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  useEffect(() => {
    if (customerProfile?.taluka && (!taluka || taluka === '')) {
      setTaluka(customerProfile.taluka);
    }
    if (customerProfile?.address && (!address || address === '')) {
      setAddress(customerProfile.address);
    }
  }, [customerProfile?.taluka, customerProfile?.address]);

  useEffect(() => {
    if (selectedServiceForBooking) {
      setSelectedServiceId(selectedServiceForBooking.id);
      setStep(2);
    }
  }, [selectedServiceForBooking]);

  const activeService = services.find((s) => s.id === selectedServiceId) || services[0];

  // Backend calculation contract: Request quote from backend API
  useEffect(() => {
    let isMounted = true;
    if (activeService) {
      bookingsAPI
        .calculateQuote(activeService.id, activeService.base_rate, treeCount, bookingType)
        .then((res) => {
          if (isMounted && res) {
            setQuoteData(res);
          }
        })
        .catch((err) => {
          console.warn('Quote calculation error:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeService?.id, activeService?.base_rate, treeCount, bookingType]);

  // Section B.3: Fetch server-driven availability whenever taluka, service, or bookingType changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAvailability(true);
    setCustomDateError('');

    availabilityAPI
      .getAvailability(taluka, activeService?.id, bookingType, schedulingConfig)
      .then((res) => {
        if (isMounted && res) {
          setAvailabilityData(res);
          // Set initial date from server's first available date if nothing chosen yet or invalid for current mode
          if (res.available_dates && res.available_dates.length > 0) {
            setScheduledDate((prev) => {
              if (!prev) return res.available_dates[0].date;
              const config = getTalukaDayConfig(taluka, bookingType, schedulingConfig);
              const cur = new Date(prev + 'T00:00:00');
              return config.allowedIndices.includes(cur.getDay()) ? prev : res.available_dates[0].date;
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Availability load error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAvailability(false);
      });

    return () => {
      isMounted = false;
    };
  }, [taluka, activeService?.id, bookingType, schedulingConfig]);

  // Section A.1: Height Category strictly gated by service object's requires_height_category flag
  const isHeightCategoryRequired = activeService?.requires_height_category === true;

  // Handle custom advance date input with taluka schedule / urgent booking verification
  const handleAdvanceDateInput = (val) => {
    setCustomAdvanceDate(val);
    if (!val) {
      setCustomDateError('');
      return;
    }
    const chosen = new Date(val + 'T00:00:00');
    if (isNaN(chosen.getTime())) {
      setCustomDateError('Invalid date format');
      return;
    }
    const dayOfWeek = chosen.getDay();
    const config = getTalukaDayConfig(taluka, bookingType, schedulingConfig);
    const dayName = chosen.toLocaleDateString('en-IN', { weekday: 'long' });

    if (!config.allowedIndices.includes(dayOfWeek)) {
      if (bookingType === 'urgent') {
        setCustomDateError(
          `Urgent bookings are available on any day except Sunday (Monday to Saturday). Sunday (${val}) is not available.`
        );
      } else {
        setCustomDateError(
          `Service in ${taluka} is allocated on ${config.description}. ${dayName} (${val}) is not an allocated service day. Please pick a ${config.dayNames.join(', ')}.`
        );
      }
      setScheduledDate('');
    } else {
      setCustomDateError('');
      setScheduledDate(val);
      setErrors((prev) => ({ ...prev, scheduledDate: '' }));
    }
  };

  // Validation Step 2 (Property Details)
  const validateStep2 = () => {
    const errs = {};
    if (!treeCount || treeCount < 1) errs.treeCount = 'Quantity must be at least 1';
    if (!taluka) errs.taluka = 'Please select a Taluka';
    if (!address.trim()) errs.address = 'Please enter address';

    // Section A.1: Height Category required ONLY when requires_height_category === true
    if (isHeightCategoryRequired && !heightCategory) {
      errs.heightCategory = 'Height category tier is mandatory for this service';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validation Step 3 (Schedule)
  const validateStep3 = () => {
    const errs = {};
    if (!scheduledDate) {
      errs.scheduledDate = `Please select an available service date.`;
    } else {
      const chosen = new Date(scheduledDate + 'T00:00:00');
      const config = getTalukaDayConfig(taluka, bookingType, schedulingConfig);
      if (!config.allowedIndices.includes(chosen.getDay())) {
        errs.scheduledDate = bookingType === 'urgent'
          ? `Urgent bookings are available Monday through Saturday (excluding Sunday).`
          : `Selected date is not an allocated day for ${taluka} (${config.description}).`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Dynamic calculation for multi-service cart
  const currentItems = serviceCart.length > 0 ? serviceCart : [{
    serviceId: activeService.id,
    serviceName: activeService.name,
    icon: activeService.icon,
    base_rate: Number(activeService.base_rate),
    unit: activeService.unit,
    treeCount: Number(treeCount || 1),
    heightCategory: isHeightCategoryRequired ? heightCategory : null,
    requires_height_category: isHeightCategoryRequired
  }];

  const totalBase = currentItems.reduce((acc, item) => acc + (Number(item.base_rate) * Number(item.treeCount)), 0);
  const totalGst = totalBase * (bookingType === 'urgent' ? 0.20 : 0.18);
  const totalAmount = totalBase + totalGst;
  const totalTreeCount = currentItems.reduce((acc, item) => acc + Number(item.treeCount), 0);

  // Upfront Payment Gateway Flow (Razorpay)
  const handleOpenPayment = (e) => {
    if (e) e.preventDefault();
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentRecord) => {
    const scheduledAt = `${scheduledDate}T09:00:00Z`;
    const finalAmount = totalAmount;

    const bookingPayload = {
      customer_id: currentUser?.id,
      service_id: currentItems[0].serviceId,
      service_name: currentItems.map((i) => i.serviceName).join(' + '),
      services: currentItems,
      tree_count: totalTreeCount,
      height_category: isHeightCategoryRequired ? heightCategory : null,
      taluka,
      address,
      tree_photo: treePhoto,
      scheduled_at: scheduledAt,
      booking_type: bookingType,
      base_amount: totalBase,
      surcharge_amount: Number(quoteData?.surcharge_amount || 0),
      gst_amount: totalGst,
      quote_amount: finalAmount,
      actual_amount: finalAmount,
      payment_status: 'paid',
      payment_id: paymentRecord?.payment_id || `pay_rzp_${Date.now().toString(36)}`,
      payment_method: paymentRecord?.payment_method || 'UPI (Razorpay)',
      gateway: 'Razorpay',
      paid_at: paymentRecord?.paid_at || new Date().toISOString()
    };

    addBooking(bookingPayload);
    setSelectedServiceForBooking(null);
    setServiceCart([]);
    if (onComplete) onComplete();
  };

  const handleSelectService = (svcId) => {
    setSelectedServiceId(svcId);
    const existing = serviceCart.find(i => i.serviceId === svcId);
    if (existing) {
      setTreeCount(existing.treeCount);
      if (existing.heightCategory) setHeightCategory(existing.heightCategory);
    } else {
      setTreeCount(1);
      setHeightCategory('medium');
    }
  };

  const handleAddAnotherService = () => {
    // Ensure active service is saved in serviceCart
    setServiceCart((prev) => {
      const existingIdx = prev.findIndex(item => item.serviceId === activeService.id);
      const newItem = {
        serviceId: activeService.id,
        serviceName: activeService.name,
        icon: activeService.icon,
        base_rate: Number(activeService.base_rate),
        unit: activeService.unit,
        treeCount: Number(treeCount),
        heightCategory: isHeightCategoryRequired ? heightCategory : null,
        requires_height_category: isHeightCategoryRequired
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newItem;
        return copy;
      }
      return [...prev, newItem];
    });

    const addedIds = (serviceCart.length > 0 ? serviceCart : [{ serviceId: activeService.id }]).map(i => i.serviceId);
    const nextUnadded = services.find(s => !addedIds.includes(s.id) && s.status === 'active');
    if (nextUnadded) {
      setSelectedServiceId(nextUnadded.id);
    }
    setTreeCount(1);
    setHeightCategory('medium');
    setStep(1);
  };

  const handleEditService = (svcId) => {
    const item = currentItems.find((i) => i.serviceId === svcId) || services.find((s) => s.id === svcId);
    if (item) {
      setSelectedServiceId(item.serviceId || item.id);
      setTreeCount(item.treeCount || 1);
      if (item.heightCategory) {
        setHeightCategory(item.heightCategory);
      }
      setStep(2);
    }
  };

  const handleUpdateQuantity = (svcId, delta) => {
    setServiceCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.serviceId === svcId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newCount = Math.max(1, (copy[existingIdx].treeCount || 1) + delta);
        copy[existingIdx] = { ...copy[existingIdx], treeCount: newCount };
        if (svcId === activeService.id) {
          setTreeCount(newCount);
        }
        return copy;
      } else {
        const newCount = Math.max(1, Number(treeCount || 1) + delta);
        setTreeCount(newCount);
        return [{
          serviceId: activeService.id,
          serviceName: activeService.name,
          icon: activeService.icon,
          base_rate: Number(activeService.base_rate),
          unit: activeService.unit,
          treeCount: newCount,
          heightCategory: isHeightCategoryRequired ? heightCategory : null,
          requires_height_category: isHeightCategoryRequired
        }];
      }
    });
  };

  const handleDirectSetQuantity = (svcId, rawVal) => {
    if (rawVal === '') {
      // Allow user to clear before typing new number
      setServiceCart((prev) => {
        const existingIdx = prev.findIndex((item) => item.serviceId === svcId);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = { ...copy[existingIdx], treeCount: '' };
          return copy;
        }
        return prev;
      });
      return;
    }
    let parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 1;
    if (parsed > 999) parsed = 999;

    setServiceCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.serviceId === svcId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], treeCount: parsed };
        if (svcId === activeService.id) {
          setTreeCount(parsed);
        }
        return copy;
      } else {
        setTreeCount(parsed);
        return [{
          serviceId: activeService.id,
          serviceName: activeService.name,
          icon: activeService.icon,
          base_rate: Number(activeService.base_rate),
          unit: activeService.unit,
          treeCount: parsed,
          heightCategory: isHeightCategoryRequired ? heightCategory : null,
          requires_height_category: isHeightCategoryRequired
        }];
      }
    });
  };

  const handleRemoveFromCart = (svcId) => {
    setServiceCart((prev) => {
      const currentList = prev.length > 0 ? prev : [{
        serviceId: activeService.id,
        serviceName: activeService.name,
        icon: activeService.icon,
        base_rate: Number(activeService.base_rate),
        unit: activeService.unit,
        treeCount: Number(treeCount || 1),
        heightCategory: isHeightCategoryRequired ? heightCategory : null,
        requires_height_category: isHeightCategoryRequired
      }];
      const updated = currentList.filter((item) => item.serviceId !== svcId);
      if (updated.length > 0) {
        setSelectedServiceId(updated[0].serviceId);
        setTreeCount(updated[0].treeCount);
        if (updated[0].heightCategory) setHeightCategory(updated[0].heightCategory);
      } else {
        setSelectedServiceId(services[0]?.id || '');
        setTreeCount(1);
        setStep(1);
      }
      return updated;
    });
  };

  // Selected date object from availability data
  const selectedDateObj = availabilityData?.available_dates?.find(
    (d) => d.date === scheduledDate
  );

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div key={step} className="wizard-step-container">
        {/* Step 1: Choose Service */}
        {step === 1 && (
          <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--ink)' }}>{t('wiz_step_1_title')}</h3>
              <p className="cell-muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                {t('wiz_step_1_sub')}
              </p>
            </div>

            {serviceCart.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'flex-end',
                  gap: '4px',
                  background: '#131921',
                  color: '#FFFFFF',
                  border: '1px solid #232f3e',
                  padding: '5px 12px 5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease'
                }}
                title="View Shopping Cart"
              >
                <svg width="28" height="20" viewBox="0 0 38 26" fill="none" style={{ display: 'block' }}>
                  <path
                    d="M2 3h5l3.8 13.5h17l3.8-9.5H9"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="13" cy="22.5" r="2.2" fill="#FFFFFF" />
                  <circle cx="26" cy="22.5" r="2.2" fill="#FFFFFF" />
                </svg>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1, paddingBottom: '2px' }}>
                  Cart
                </span>
              </button>
            )}
          </div>

          <div className="svc-pick-grid">
            {services
              .filter((s) => s.status === 'active')
              .map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                const inCart = serviceCart.find((i) => i.serviceId === svc.id);
                const bgImg = getServiceImage(svc);

                return (
                  <div
                    key={svc.id}
                    className={`svc-pick ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectService(svc.id)}
                    style={{
                      position: 'relative',
                      border: inCart ? '2px solid #FF9900' : isSelected ? '2px solid var(--teal)' : '1px solid var(--line)',
                      boxShadow: inCart ? '0 4px 12px rgba(255, 153, 0, 0.18)' : 'none'
                    }}
                  >
                    <div className="svc-pick-thumb-wrap">
                      <img src={bgImg} alt={svc.name} className="svc-pick-thumb" />
                      {isSelected && !inCart && (
                        <span className="svc-pick-selected-badge">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                      {inCart && (
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#FFD814',
                          color: '#0F1111',
                          border: '1px solid #FCD200',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.18)'
                        }}>
                          🛒 In Cart ({inCart.treeCount})
                        </span>
                      )}
                      {svc.requires_height_category && (
                        <span className="svc-pick-height-chip">
                          {t('badge_big_tree')}
                        </span>
                      )}
                    </div>
                    <div className="svc-pick-body">
                      <h4>{svc.name}</h4>
                      <div className="svc-pick-rate">
                        <span className="rate-num">₹{svc.base_rate}</span>
                        <span className="rate-unit">/{svc.unit.replace('per ', '')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
              {serviceCart.length > 0 ? (
                <>
                  <span style={{ color: 'var(--ink-soft)' }}>Cart Subtotal ({serviceCart.length} service{serviceCart.length > 1 ? 's' : ''}):</span>{' '}
                  <b style={{ fontSize: '16px', color: '#B12704', fontWeight: '800' }}>₹{totalBase.toFixed(2)}</b>
                </>
              ) : (
                <span style={{ color: 'var(--ink-soft)' }}>Choose a service to configure trees & details</span>
              )}
            </div>

            <Button
              variant="primary"
              type="button"
              icon={ArrowRight}
              onClick={(e) => {
                e.preventDefault();
                if (selectedServiceId) setStep(2);
              }}
            >
              {serviceCart.length > 0 ? 'Proceed to Details' : t('wiz_next_step')}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Property & Job Details */}
      {step === 2 && (
        <Card>
          <h3>
            {activeService.icon} {activeService.name} — {t('wiz_step_2_title')}
          </h3>
          <p className="cell-muted" style={{ marginBottom: '20px' }}>
            {t('wiz_step_2_sub')}
          </p>

          <div className="field-row">
            <Input
              label={t('wiz_tree_count')}
              type="number"
              min="1"
              value={treeCount}
              onChange={(e) => setTreeCount(e.target.value)}
              required
              error={errors.treeCount}
            />

            <Select
              label={t('signup_taluka')}
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              options={TALUKAS}
              required
              error={errors.taluka}
              hint="Determines schedule days and local climber allocation"
            />
          </div>

          {/* Section A.1: Height Category rendered ONLY for Tree Branch Cutting */}
          {isHeightCategoryRequired && (
            <div
              style={{
                background: 'rgba(216, 163, 61, 0.08)',
                border: '1px solid rgba(216, 163, 61, 0.25)',
                padding: '16px',
                borderRadius: 'var(--radius)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={16} color="var(--amber)" />
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ink)' }}>
                  Tree Height / Chainsaw Level
                </span>
              </div>
              <Select
                label="Select Tree Height Range"
                value={heightCategory}
                onChange={(e) => setHeightCategory(e.target.value)}
                options={[
                  { value: 'low', label: 'Low (Under 25 ft)' },
                  { value: 'medium', label: 'Medium (25 to 45 ft)' },
                  { value: 'high', label: 'Very Tall / High (Above 45 ft)' }
                ]}
                required
                error={errors.heightCategory}
              />
            </div>
          )}

          {/* Dynamic Saved Addresses Quick Toggle */}
          {(() => {
            const allSaved = (
              Array.isArray(customerProfile?.addresses) && customerProfile.addresses.length > 0
                ? customerProfile.addresses
                : [customerProfile?.address || currentUser?.address, customerProfile?.secondary_address || currentUser?.secondary_address]
            ).filter(Boolean);

            if (allSaved.length <= 1) return null;

            return (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {allSaved.map((savedAddr, sIdx) => {
                  const isSelected = address === savedAddr;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setAddress(savedAddr)}
                      style={{
                        background: isSelected ? 'var(--teal)' : 'var(--cream)',
                        color: isSelected ? '#FFFFFF' : 'var(--ink)',
                        border: '1px solid ' + (isSelected ? 'var(--teal)' : 'var(--line)'),
                        padding: '5px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Address {sIdx + 1}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Canonical single address/location field per Section A.2 */}
          <Input
            label={t('wiz_address')}
            placeholder="House No, Village/Town, Landmark, Goa"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            error={errors.address}
          />

          {/* Feature 4: 1-Snap Tree Photo Helper */}
          <div
            style={{
              background: 'var(--paper)',
              border: '1.5px dashed var(--line)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginTop: '14px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="var(--teal)" /> 1-Snap Tree Photo (Optional)
                </b>
                <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                  Attach a photo so the climber brings the right ladder height & safety ropes.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="tree-photo-input"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                  disabled={isCompressingPhoto}
                />
                {isCompressingPhoto ? (
                  <span
                    style={{
                      background: 'rgba(31, 138, 130, 0.08)',
                      border: '1px solid var(--teal)',
                      color: 'var(--teal-dark)',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ⏳ Optimizing photo...
                  </span>
                ) : !treePhoto ? (
                  <label
                    htmlFor="tree-photo-input"
                    style={{
                      background: 'rgba(31, 138, 130, 0.08)',
                      border: '1px solid var(--teal)',
                      color: 'var(--teal-dark)',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={14} /> Snap / Upload Photo
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={treePhoto}
                      alt="Tree preview"
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setTreePhoto(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            {photoError && (
              <div style={{ color: 'var(--danger)', fontSize: '11.5px', marginTop: '6px', fontWeight: '600' }}>
                {photoError}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button
              variant="ghost"
              type="button"
              icon={ArrowLeft}
              onClick={(e) => {
                e.preventDefault();
                setStep(1);
              }}
            >
              {t('btn_back')}
            </Button>
            <Button
              variant="primary"
              type="button"
              icon={ArrowRight}
              onClick={(e) => {
                e.preventDefault();
                if (validateStep2()) {
                  setServiceCart((prev) => {
                    const existingIdx = prev.findIndex(item => item.serviceId === activeService.id);
                    const newItem = {
                      serviceId: activeService.id,
                      serviceName: activeService.name,
                      icon: activeService.icon,
                      base_rate: Number(activeService.base_rate),
                      unit: activeService.unit,
                      treeCount: Number(treeCount),
                      heightCategory: isHeightCategoryRequired ? heightCategory : null,
                      requires_height_category: isHeightCategoryRequired
                    };
                    if (existingIdx >= 0) {
                      const copy = [...prev];
                      copy[existingIdx] = newItem;
                      return copy;
                    }
                    return [...prev, newItem];
                  });
                  setStep(3);
                }
              }}
            >
              {t('wiz_next_schedule')}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Schedule Selection (Section B.3: Server-driven availability) */}
      {step === 3 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3>{t('wiz_step_3_title')}</h3>
              <p className="cell-muted">
                {t('wiz_step_3_sub')} <b>{t(`taluka_${taluka.toLowerCase().replace(/\s+/g, '_')}`, taluka)}</b>.
              </p>
            </div>
            {bookingType === 'urgent' && (
              <span
                style={{
                  background: 'rgba(179, 64, 44, 0.12)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(179, 64, 44, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11.5px',
                  fontWeight: '700'
                }}
              >
                ⚡ Urgent Dispatch Active (+20% Surcharge)
              </span>
            )}
          </div>

          {/* Server Availability Notice */}
          <div
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Calendar size={20} color={bookingType === 'urgent' ? 'var(--danger)' : 'var(--teal)'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
              <b>{availabilityData?.message || `Loading available service days for ${taluka}...`}</b>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                {bookingType === 'urgent'
                  ? <>⚡ Urgent Schedule: <b>Monday, Tuesday, Wednesday, Thursday, Friday, Saturday (Any day except Sunday)</b></>
                  : <>🌿 Standard Allocation for {taluka}: <b>{availabilityData?.allowed_days?.join(', ') || 'Standard Allocated Days'}</b></>
                }
              </div>
            </div>
          </div>

          {isLoadingAvailability ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-soft)' }}>
              Checking server availability for {taluka}...
            </div>
          ) : (
            <>
              {/* Available Dates Selection (Strictly server-returned dates) */}
              <div className="field">
                <label>Select Available Service Date ({taluka}) *</label>
                {availabilityData?.available_dates?.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                      gap: '10px',
                      marginTop: '6px'
                    }}
                  >
                    {availabilityData.available_dates.map((d) => {
                      const isSelected = scheduledDate === d.date;
                      return (
                        <div
                          key={d.date}
                          onClick={() => {
                            setScheduledDate(d.date);
                            setCustomDateError('');
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: `1.5px solid ${isSelected ? 'var(--teal)' : 'var(--line)'}`,
                            background: isSelected ? 'rgba(31, 138, 130, 0.08)' : 'var(--paper)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <b style={{ fontSize: '13px', color: isSelected ? 'var(--teal)' : 'var(--ink)' }}>
                            {d.label}
                          </b>
                          <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                            {d.day_name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="field-error" style={{ padding: '10px 0' }}>
                    No bookable days available currently for {taluka}.
                  </div>
                )}
                {errors.scheduledDate && <div className="field-error">{errors.scheduledDate}</div>}
              </div>

              {/* Custom / Future Date Picker with Taluka Schedule Validation */}
              <div style={{
                marginTop: '18px',
                padding: '14px 16px',
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ink)', margin: 0 }}>
                    🗓️ {t('wiz_customize_date', 'Customize the Date')}
                  </label>
                  <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                    {bookingType === 'urgent'
                      ? '⚡ Urgent: Any future day except Sunday'
                      : `🌿 Normal: ${getTalukaDayConfig(taluka, 'standard', schedulingConfig).description}`
                    }
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    value={scheduledDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const chosen = new Date(val + 'T00:00:00');
                      const dayOfWeek = chosen.getDay();
                      const config = getTalukaDayConfig(taluka, bookingType, schedulingConfig);
                      if (!config.allowedIndices.includes(dayOfWeek)) {
                        setCustomDateError(
                          bookingType === 'urgent'
                            ? 'Urgent bookings cannot be scheduled on Sundays. Please choose Monday through Saturday.'
                            : `Selected day (${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek]}) is not an allocated day for ${taluka} (${config.description}).`
                        );
                      } else {
                        setCustomDateError('');
                        setScheduledDate(val);
                      }
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: customDateError ? '1.5px solid var(--danger)' : '1.5px solid var(--line)',
                      background: 'var(--paper)',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      color: 'var(--ink)',
                      outline: 'none',
                      flex: 1,
                      minWidth: '200px'
                    }}
                  />
                  {scheduledDate && (
                    <span style={{ fontSize: '13px', color: 'var(--teal-dark)', fontWeight: '700' }}>
                      ✓ {formatScheduledDateLabel(scheduledDate)}
                    </span>
                  )}
                </div>
                {customDateError && (
                  <div className="field-error" style={{ marginTop: '8px', fontSize: '12px' }}>
                    {customDateError}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Amazon / Flipkart Style Shopping Cart Box */}
          <div style={{
            background: 'var(--paper)',
            border: '1px solid #D5D9D9',
            borderRadius: '10px',
            padding: '18px 20px',
            marginTop: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingBottom: '12px',
              borderBottom: '1.5px solid var(--line)',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={19} color="#0F1111" />
                <b style={{ fontSize: '15.5px', color: '#0F1111', fontWeight: '800' }}>
                  Shopping Cart
                </b>
                <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                  ({currentItems.length} service{currentItems.length > 1 ? 's' : ''})
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: '600' }}>
                Price
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {currentItems.map((item, idx) => {
                const svcObj = services.find((s) => s.id === item.serviceId);
                const bgImg = getServiceImage(svcObj || item);

                return (
                  <div
                    key={item.serviceId || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      paddingBottom: '14px',
                      borderBottom: idx < currentItems.length - 1 ? '1px solid var(--line)' : 'none',
                      gap: '14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '240px' }}>
                      <img
                        src={bgImg}
                        alt={item.serviceName}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid var(--line)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#007185' }}>
                          {item.serviceName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                          ₹{item.base_rate} per {item.unit ? item.unit.replace('per ', '') : 'tree'}
                          {item.heightCategory ? ` • Height: ${item.heightCategory}` : ''}
                        </div>

                        {/* Inline Typable Stepper & Delete Symbol */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {/* Quantity Pill Stepper with Typable Input */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#F0F2F2',
                            border: '1px solid #D5D9D9',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                            overflow: 'hidden'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.serviceId, -1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px 9px',
                                cursor: 'pointer',
                                color: '#0F1111',
                                fontWeight: '800',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Decrease"
                            >
                              −
                            </button>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F1111', paddingLeft: '4px' }}>
                              Qty:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={item.treeCount}
                              onChange={(e) => handleDirectSetQuantity(item.serviceId, e.target.value)}
                              onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                                  handleDirectSetQuantity(item.serviceId, 1);
                                }
                              }}
                              style={{
                                width: '38px',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'center',
                                fontWeight: '700',
                                fontSize: '13px',
                                color: '#0F1111',
                                padding: '3px 0',
                                outline: 'none'
                              }}
                              title="Enter quantity"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.serviceId, 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px 9px',
                                cursor: 'pointer',
                                color: '#0F1111',
                                fontWeight: '800',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Increase"
                            >
                              +
                            </button>
                          </div>

                          {/* Delete Symbol Button Only */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.serviceId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#B12704',
                              cursor: 'pointer',
                              padding: '5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              transition: 'background 0.15s'
                            }}
                            title={t('btn_delete', 'Delete')}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(177, 39, 4, 0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <Trash2 size={16} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: '16px', color: '#B12704', fontWeight: '800' }}>
                        ₹{(Number(item.base_rate) * Number(item.treeCount)).toFixed(2)}
                      </b>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Amazon Style Price Breakdown Footer */}
            <div style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ink-soft)' }}>
                <span>Items Subtotal:</span>
                <span>₹{totalBase.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ink-soft)' }}>
                <span>{bookingType === 'urgent' ? '⚡ Urgent GST (20%):' : 'Estimated GST (18%):'}</span>
                <span>+ ₹{totalGst.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: '800',
                color: '#0F1111',
                marginTop: '4px',
                paddingTop: '6px',
                borderTop: '1px dashed var(--line)'
              }}>
                <span>Order Total:</span>
                <span style={{ color: '#B12704', fontSize: '18px' }}>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              icon={ArrowLeft}
              onClick={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              {t('btn_back')}
            </Button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                type="button"
                icon={Plus}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddAnotherService();
                }}
                style={{
                  border: '1.5px solid var(--teal)',
                  color: 'var(--teal-dark)',
                  background: 'var(--paper)',
                  fontWeight: '600'
                }}
              >
                {t('wiz_add_service', 'Add Service')}
              </Button>
              <Button
                variant="primary"
                type="button"
                icon={ArrowRight}
                onClick={(e) => {
                  e.preventDefault();
                  if (validateStep3()) {
                    handleOpenPayment();
                  }
                }}
              >
                {t('wiz_confirm_and_pay', 'Confirm & Pay')} (₹{totalAmount.toFixed(2)})
              </Button>
            </div>
          </div>
        </Card>
      )}
      </div>

      {/* Razorpay Upfront Payment Modal */}
      <RazorpayPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={totalAmount}
        serviceName={currentItems.map((i) => `${i.serviceName} (${i.treeCount})`).join(', ')}
        bookingDetails={{
          taluka,
          treeCount: totalTreeCount,
          bookingType,
          scheduledDate
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Emergency Service Booking Modal (Section B.4) */}
      <EmergencyBookingModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSuccess={() => {
          if (onComplete) onComplete();
        }}
      />
    </div>
  );
};
