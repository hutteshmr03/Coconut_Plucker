import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
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
  Lock
} from 'lucide-react';
import { getTalukaDayConfig, formatScheduledDateLabel } from '../../utils/helpers';

const TALUKAS = [
  { value: '', label: '-- Select one --' },
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const BookingWizard = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const {
    services,
    addService,
    addBooking,
    selectedServiceForBooking,
    setSelectedServiceForBooking
  } = useApp();

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(
    selectedServiceForBooking?.id || services[0]?.id || ''
  );
  const [treeCount, setTreeCount] = useState(1);
  const [heightCategory, setHeightCategory] = useState('medium'); // 'low' | 'medium' | 'high'
  const [taluka, setTaluka] = useState('');
  const [address, setAddress] = useState('');
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

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState('100');
  const [newServiceUnit, setNewServiceUnit] = useState('per tree');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceReqHeight, setNewServiceReqHeight] = useState(false);
  const [modalError, setModalError] = useState('');

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
      .getAvailability(taluka, activeService?.id, bookingType)
      .then((res) => {
        if (isMounted && res) {
          setAvailabilityData(res);
          // Set initial date from server's first available date if nothing chosen yet or invalid for current mode
          if (res.available_dates && res.available_dates.length > 0) {
            setScheduledDate((prev) => {
              if (!prev) return res.available_dates[0].date;
              const config = getTalukaDayConfig(taluka, bookingType);
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
  }, [taluka, activeService?.id, bookingType]);

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
    const config = getTalukaDayConfig(taluka, bookingType);
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
      const config = getTalukaDayConfig(taluka, bookingType);
      if (!config.allowedIndices.includes(chosen.getDay())) {
        errs.scheduledDate = bookingType === 'urgent'
          ? `Urgent bookings are available Monday through Saturday (excluding Sunday).`
          : `Selected date is not an allocated day for ${taluka} (${config.description}).`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Upfront Payment Gateway Flow (Razorpay)
  const handleOpenPayment = (e) => {
    if (e) e.preventDefault();
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentRecord) => {
    const scheduledAt = `${scheduledDate}T09:00:00Z`;
    const finalAmount = Number(
      quoteData?.quote_amount ||
        Number(activeService.base_rate) * Number(treeCount) * (bookingType === 'urgent' ? 1.2 : 1.18)
    );

    const bookingPayload = {
      customer_id: currentUser?.id,
      service_id: activeService.id,
      tree_count: Number(treeCount),
      height_category: isHeightCategoryRequired ? heightCategory : null,
      taluka,
      address,
      scheduled_at: scheduledAt,
      booking_type: bookingType,
      base_amount: Number(quoteData.base_amount || Number(activeService.base_rate) * Number(treeCount)),
      surcharge_amount: Number(quoteData.surcharge_amount || 0),
      gst_amount: Number(
        quoteData.gst_amount ||
          Number(activeService.base_rate) * Number(treeCount) * (bookingType === 'urgent' ? 0.2 : 0.18)
      ),
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
    if (onComplete) onComplete();
  };

  // Handle adding custom service
  const handleCreateCustomService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      setModalError('Please enter the service name');
      return;
    }
    if (!newServiceRate || Number(newServiceRate) <= 0) {
      setModalError('Please enter a valid base rate');
      return;
    }

    const createdService = {
      id: 'svc_' + Date.now().toString(36),
      name: newServiceName.trim(),
      base_rate: Number(newServiceRate),
      unit: newServiceUnit,
      icon: '🌴',
      desc: newServiceDesc.trim() || 'Custom requested tree service',
      requires_height_category: newServiceReqHeight,
      status: 'active'
    };

    addService(createdService);
    setSelectedServiceId(createdService.id);
    setIsAddServiceModalOpen(false);
    setNewServiceName('');
    setNewServiceDesc('');
    setModalError('');
  };

  // Selected date object from availability data
  const selectedDateObj = availabilityData?.available_dates?.find(
    (d) => d.date === scheduledDate
  );

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Step Indicators */}
      <div className="wizard-steps">
        <div className={`wiz-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
          {step > 1 ? <Check size={14} /> : '1'} <span>Choose Service</span>
        </div>
        <div className={`wiz-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
          {step > 2 ? <Check size={14} /> : '2'} <span>Property Details</span>
        </div>
        <div className={`wiz-step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>
          {step > 3 ? <Check size={14} /> : '3'} <span>Schedule</span>
        </div>
        <div className={`wiz-step ${step === 4 ? 'active' : ''}`}>
          <span>4</span> <span>Quote & Confirm</span>
        </div>
      </div>

      {/* Step 1: Choose Service */}
      {step === 1 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3>Choose a Service</h3>
              <p className="cell-muted">
                Select a tree harvest or maintenance service from the catalog below.
              </p>
            </div>
            <Button
              variant="gold"
              size="sm"
              icon={Plus}
              onClick={() => setIsAddServiceModalOpen(true)}
            >
              Add Other Service
            </Button>
          </div>

          <div className="svc-pick-grid">
            {services
              .filter((s) => s.status === 'active')
              .map((svc) => {
                const isSelected = selectedServiceId === svc.id;
                return (
                  <div
                    key={svc.id}
                    className={`svc-pick ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedServiceId(svc.id)}
                  >
                    <div className="svc-ic">{svc.icon}</div>
                    <h4>{svc.name}</h4>
                    <span>
                      ₹{svc.base_rate} / {svc.unit.replace('per ', '')}
                    </span>
                    {svc.requires_height_category && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--amber)',
                          marginTop: '6px',
                          fontWeight: '700'
                        }}
                      >
                        *Height Category Required
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Add Service Banner if service is not found */}
          <div
            style={{
              background: 'var(--cream)',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--radius)',
              padding: '16px 20px',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <b style={{ color: 'var(--ink)', fontSize: '13.5px', display: 'block' }}>
                Can't find the exact service you need?
              </b>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                Add a custom service request (e.g. tree spraying, special fruit picking).
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
              onClick={() => setIsAddServiceModalOpen(true)}
            >
              Add Service
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              variant="primary"
              type="button"
              icon={ArrowRight}
              onClick={(e) => {
                e.preventDefault();
                if (selectedServiceId) setStep(2);
              }}
            >
              Continue to Property Details
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Property & Job Details */}
      {step === 2 && (
        <Card>
          <h3>
            {activeService.icon} {activeService.name} — Property Details
          </h3>
          <p className="cell-muted" style={{ marginBottom: '20px' }}>
            Specify tree quantity, property Taluka, and service address.
          </p>

          <div className="field-row">
            <Input
              label={`Number of ${activeService.unit.replace('per ', '')}s`}
              type="number"
              min="1"
              value={treeCount}
              onChange={(e) => setTreeCount(e.target.value)}
              required
              error={errors.treeCount}
            />

            <Select
              label="Taluka (Region)"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              options={TALUKAS}
              required
              error={errors.taluka}
              hint="Determines server schedule allocation & verified workforce assignment"
            />
          </div>

          {/* Section A.1: Height Category rendered ONLY for Canopy / Tree Trimming (requires_height_category: true) */}
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
                  Height Category (Applies to Canopy / Tree Trimming)
                </span>
              </div>
              <Select
                label="Select Canopy Working Height Range"
                value={heightCategory}
                onChange={(e) => setHeightCategory(e.target.value)}
                options={[
                  { value: 'low', label: 'Low (e.g. Under 25 ft)' },
                  { value: 'medium', label: 'Medium (e.g. 25 to 45 ft)' },
                  { value: 'high', label: 'High Altitude (e.g. Above 45 ft)' }
                ]}
                required
                error={errors.heightCategory}
              />
            </div>
          )}

          {/* Canonical single address/location field per Section A.2 */}
          <Input
            label="Property Street Address & Location"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            error={errors.address}
          />

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
              Back
            </Button>
            <Button
              variant="primary"
              type="button"
              icon={ArrowRight}
              onClick={(e) => {
                e.preventDefault();
                if (validateStep2()) setStep(3);
              }}
            >
              Continue to Schedule
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Schedule Selection (Section B.3: Server-driven availability) */}
      {step === 3 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3>Schedule the Booking</h3>
              <p className="cell-muted">
                Select an available service day allocated for <b>{taluka}</b>.
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

          {/* Separate Selectable Cards: Normal Booking vs Urgent Booking */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '22px'
          }}>
            {/* Card 1: Normal Booking */}
            <div
              onClick={() => setBookingType('standard')}
              style={{
                border: bookingType === 'standard' ? '2px solid var(--teal)' : '1.5px solid var(--line)',
                background: bookingType === 'standard' ? 'rgba(31, 138, 130, 0.06)' : 'var(--paper)',
                borderRadius: '12px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: bookingType === 'standard' ? '0 4px 12px rgba(31, 138, 130, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🌿</span>
                  <b style={{ fontSize: '15px', color: 'var(--ink)' }}>Normal Booking</b>
                </div>
                <span style={{
                  background: bookingType === 'standard' ? 'var(--teal)' : 'var(--cream)',
                  color: bookingType === 'standard' ? '#FFFFFF' : 'var(--ink-soft)',
                  border: bookingType === 'standard' ? 'none' : '1px solid var(--line)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  Standard Rate
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: '0 0 10px', lineHeight: '1.4' }}>
                Standard allocated scheduling days for <b>{taluka}</b>.
              </p>
              <div style={{ fontSize: '11.5px', color: 'var(--teal-dark)', fontWeight: '600' }}>
                🗓️ Allocated: {(taluka || '').toLowerCase().includes('north') ? 'Monday, Tuesday, Wednesday' : 'Thursday, Friday, Saturday'}
              </div>
            </div>

            {/* Card 2: Urgent Booking */}
            <div
              onClick={() => setBookingType('urgent')}
              style={{
                border: bookingType === 'urgent' ? '2px solid var(--danger)' : '1.5px solid rgba(179, 64, 44, 0.35)',
                background: bookingType === 'urgent' ? 'rgba(179, 64, 44, 0.08)' : 'rgba(179, 64, 44, 0.02)',
                borderRadius: '12px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: bookingType === 'urgent' ? '0 4px 14px rgba(179, 64, 44, 0.18)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <b style={{ fontSize: '15px', color: 'var(--danger)' }}>Urgent Booking</b>
                </div>
                <span style={{
                  background: 'var(--danger)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  +20% GST
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: '0 0 10px', lineHeight: '1.4' }}>
                Priority same-day/next-day dispatch. <b>Any day except Sunday (Mon–Sat)</b>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: '700' }}>
                  🚨 Mon to Sat (Excluding Sunday)
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEmergencyModalOpen(true);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  1-Click Dispatch
                </button>
              </div>
            </div>
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
                    🗓️ Select Custom / Future Date for {taluka}
                  </label>
                  <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                    {bookingType === 'urgent'
                      ? '⚡ Urgent: Any future day except Sunday'
                      : `🌿 Normal: ${(taluka || '').toLowerCase().includes('north') ? 'Monday, Tuesday, Wednesday' : 'Thursday, Friday, Saturday'}`
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
                      const config = getTalukaDayConfig(taluka, bookingType);
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button
              variant="ghost"
              type="button"
              icon={ArrowLeft}
              onClick={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              type="button"
              icon={ArrowRight}
              onClick={(e) => {
                e.preventDefault();
                if (validateStep3()) setStep(4);
              }}
            >
              Review Quote & Confirm
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Quote & Confirm */}
      {step === 4 && (
        <Card>
          <h3>Review & Confirm Booking</h3>
          <p className="cell-muted" style={{ marginBottom: '20px' }}>
            Review your service details, address, and calculated instant quote with GST breakdown.
          </p>

          <div className="kpi-line">
            <span>Service</span>
            <b>
              {activeService.icon} {activeService.name}
            </b>
          </div>
          <div className="kpi-line">
            <span>Booking Type</span>
            <b>
              {bookingType === 'urgent' ? (
                <span style={{ color: 'var(--danger)', fontWeight: '700' }}>⚡ Urgent Priority (+20% GST)</span>
              ) : (
                <span>🌿 Standard Schedule</span>
              )}
            </b>
          </div>
          <div className="kpi-line">
            <span>Quantity</span>
            <b>
              {treeCount} {activeService.unit.replace('per ', '')}s
            </b>
          </div>
          <div className="kpi-line">
            <span>Taluka</span>
            <b>{taluka}</b>
          </div>
          <div className="kpi-line">
            <span>Scheduled Service Date</span>
            <b>
              {selectedDateObj?.label || (scheduledDate ? formatScheduledDateLabel(scheduledDate) : scheduledDate)}
            </b>
          </div>
          {isHeightCategoryRequired && (
            <div className="kpi-line">
              <span>Height Category</span>
              <b style={{ textTransform: 'capitalize' }}>{heightCategory}</b>
            </div>
          )}
          <div className="kpi-line">
            <span>Service Address</span>
            <b>{address}</b>
          </div>

          {/* Itemized Quote Box with 20% GST for Urgent / 18% GST for Normal */}
          <div className="quote-box" style={{ marginTop: '20px' }}>
            <div className="ql-row">
              <span>Base Service (₹{activeService.base_rate} × {treeCount})</span>
              <span>₹{(Number(quoteData?.base_amount || (Number(activeService.base_rate) * Number(treeCount)))).toFixed(2)}</span>
            </div>

            <div className="ql-row" style={{ color: bookingType === 'urgent' ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: bookingType === 'urgent' ? '600' : 'normal' }}>
              <span>{bookingType === 'urgent' ? '⚡ Urgent Service GST (20% GST)' : 'GST (18% Goods & Services Tax)'}</span>
              <span>+ ₹{(Number(quoteData?.gst_amount || ((Number(activeService.base_rate) * Number(treeCount)) * (bookingType === 'urgent' ? 0.20 : 0.18)))).toFixed(2)}</span>
            </div>

            <div className="ql-total">
              <span>Total Estimated Quote</span>
              <span>₹{(quoteData?.quote_amount || ((Number(activeService.base_rate) * Number(treeCount)) * (bookingType === 'urgent' ? 1.20 : 1.18))).toFixed(2)}</span>
            </div>
            <div className="ql-note">
              🛡️ Verified safe climb guaranteed. Payment processed securely upfront.
            </div>
          </div>

          {/* Payment Method Notice & Gateway Trust Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(12, 35, 64, 0.05) 0%, rgba(49, 130, 206, 0.08) 100%)',
              border: '1.5px solid rgba(49, 130, 206, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              marginTop: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: '#0c2340',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Lock size={22} color="#68d391" />
              </div>
              <div>
                <b style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
                  Razorpay Upfront Gateway Checkout
                </b>
                <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                  Pay securely using <b>UPI / QR</b>, <b>Credit/Debit Cards</b>, or <b>Net Banking</b>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '11px', background: 'var(--paper)', border: '1px solid var(--line)', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                📱 UPI / GPay / PhonePe
              </span>
              <span style={{ fontSize: '11px', background: 'var(--paper)', border: '1px solid var(--line)', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                💳 Visa / MasterCard / RuPay
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <Button
              variant="ghost"
              type="button"
              icon={ArrowLeft}
              onClick={(e) => {
                e.preventDefault();
                setStep(3);
              }}
            >
              Back
            </Button>
            <Button
              variant="gold"
              size="lg"
              type="button"
              icon={Lock}
              onClick={handleOpenPayment}
            >
              Proceed to Pay ₹{(quoteData?.quote_amount || ((Number(activeService.base_rate) * Number(treeCount)) * (bookingType === 'urgent' ? 1.20 : 1.18))).toFixed(2)} via Razorpay
            </Button>
          </div>
        </Card>
      )}

      {/* Razorpay Upfront Payment Modal */}
      <RazorpayPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={
          quoteData?.quote_amount ||
          Number(activeService.base_rate) * Number(treeCount) * (bookingType === 'urgent' ? 1.2 : 1.18)
        }
        serviceName={activeService?.name}
        bookingDetails={{
          taluka,
          treeCount,
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

      {/* Add Custom Service Modal */}
      <Modal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        title="Add / Request a Service"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCustomService}>
              Add & Select Service
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomService}>
          <p className="cell-muted" style={{ marginBottom: '14px', fontSize: '13px' }}>
            Add a service that is not in the list. It will be added to the catalog and selected for your booking.
          </p>

          {modalError && <div className="field-error" style={{ marginBottom: '12px' }}>{modalError}</div>}

          <Input
            label="Service Name"
            placeholder="e.g. Tree Pruning / Leaf Clearance"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            required
          />

          <div className="field-row">
            <Input
              label="Estimated Base Rate (₹)"
              type="number"
              value={newServiceRate}
              onChange={(e) => setNewServiceRate(e.target.value)}
              required
            />
            <Select
              label="Pricing Unit"
              value={newServiceUnit}
              onChange={(e) => setNewServiceUnit(e.target.value)}
              options={[
                { value: 'per tree', label: 'per tree' },
                { value: 'per visit', label: 'per visit' },
                { value: 'per acre', label: 'per acre' }
              ]}
              required
            />
          </div>

          <div className="field">
            <label>Service Description (Optional)</label>
            <textarea
              placeholder="Describe the nature of work needed..."
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
