import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDisplayName, getServiceImage } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ReviewModal } from '../components/customer/ReviewModal';
import { Star, CreditCard, Plus, MapPin, Check, Phone } from 'lucide-react';

const WhatsAppIcon = ({ size = 18, color = '#FFFFFF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const STATUS_ORDER = ['requested', 'assigned', 'in_progress', 'completed'];

export const CustomerBookings = () => {
  const { currentUser } = useAuth();
  const {
    bookings,
    services,
    professionals,
    currentCustomerId,
    payBooking,
    reviewBooking,
    setCurrentView
  } = useApp();

  const [reviewingBooking, setReviewingBooking] = useState(null);

  const activeCustId = currentUser?.id || currentCustomerId;
  const customerBookings = bookings
    .filter((b) => b.customer_id === activeCustId || b.customer_id === currentUser?.id || b.customer_id === currentCustomerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (customerBookings.length === 0) {
    return (
      <EmptyState
        title="No Bookings Yet"
        description="You have not requested any tree harvest or trimming services. Book your first service today!"
        actionLabel="Book a Service"
        onAction={() => setCurrentView('cust-book')}
      />
    );
  }

  return (
    <div className="my-bookings-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>My Bookings & Status History</h3>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={() => setCurrentView('cust-book')}>
          New Booking
        </Button>
      </div>

      <div className="my-bookings-grid">
        {customerBookings.map((b) => {
          const svc = services.find((s) => s.id === b.service_id);
          const pro = professionals.find((p) => p.id === b.professional_id);
          const currentStepIdx = STATUS_ORDER.indexOf(b.status);
          const isCompleted = b.status === 'completed';
          const totalAmt = Number(b.actual_amount || b.quote_amount || 0);
          const paidAmt = Number(b.paid_amount != null ? b.paid_amount : (b.payment_status === 'paid' ? (b.quote_amount || 0) : 0));
          const balanceDue = Math.max(0, totalAmt - paidAmt);
          const isFullyPaid = b.payment_status === 'paid' && balanceDue === 0;
          const isBalancePending = balanceDue > 0;

          const formattedDate = new Date(b.scheduled_at).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          return (
            <div key={b.id} className="booking-card">
              {/* Header: Grid 64px 1fr auto, gap 12px */}
              <div className="bk-head">
                <img
                  src={getServiceImage(svc || b)}
                  alt={svc?.name || b.service_name}
                  className="bk-thumb"
                />
                <div className="bk-middle">
                  <h4 className="bk-title">
                    <span>{svc?.name || b.service_name}</span>
                    <span style={{ color: 'var(--teal)', marginLeft: '4px' }}>· {b.booking_number}</span>
                    {b.booking_type === 'urgent' && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginLeft: '6px',
                          padding: '2px 7px',
                          borderRadius: '12px',
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          border: '1px solid #FDE68A'
                        }}
                      >
                        ⚡ URGENT
                      </span>
                    )}
                  </h4>
                  <div className="bk-meta">
                    {b.tree_count} {svc?.unit?.replace('per ', '') || 'unit'}s · {formattedDate}
                  </div>
                </div>

                <div className="bk-right">
                  <StatusBadge status={b.status} />
                  <div className="bk-price">
                    ₹{totalAmt.toFixed(2)}
                  </div>
                  {isFullyPaid && (
                    <div className="bk-payment-label" style={{ color: 'var(--teal)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={12} strokeWidth={3} /> Paid ({b.payment_method || 'UPI'})
                      </span>
                    </div>
                  )}
                  {isBalancePending && (
                    <div className="bk-payment-label" style={{ color: '#D97706' }}>
                      ₹{balanceDue.toFixed(2)} Balance Due
                    </div>
                  )}
                </div>
              </div>

              {/* Address Row: Fixed-width pin icon + text */}
              <div className="bk-address-row">
                <MapPin size={16} color="var(--ink-soft)" className="bk-address-pin" />
                <span>{b.address}, {b.taluka}</span>
              </div>

              {/* Price Breakdown Box (2-column grid, labels left, values right) */}
              {isBalancePending && (
                <div className="bk-price-breakdown">
                  <span style={{ color: '#92400E' }}>Paid Upfront:</span>
                  <b style={{ color: '#92400E', textAlign: 'right' }}>₹{paidAmt.toFixed(2)}</b>
                  <span style={{ color: '#92400E' }}>Revised Total:</span>
                  <b style={{ color: '#92400E', textAlign: 'right' }}>₹{totalAmt.toFixed(2)}</b>
                  <span style={{ color: '#92400E', fontWeight: '700' }}>Extra Balance Due:</span>
                  <b style={{ color: '#B45309', textAlign: 'right', fontWeight: '800' }}>₹{balanceDue.toFixed(2)}</b>
                </div>
              )}

              {/* Urgent Price Breakdown Line Items */}
              {b.booking_type === 'urgent' && b.surcharge_amount > 0 && !isBalancePending && (
                <div
                  style={{
                    background: 'var(--cream)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    margin: '10px 0',
                    fontSize: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: 'var(--ink-soft)' }}>
                    Base: <b>₹{Number(b.base_amount || b.quote_amount - b.surcharge_amount).toFixed(2)}</b>
                  </span>
                  <span style={{ color: '#D97706', fontWeight: 600 }}>
                    Urgent Surcharge (20% GST): <b>+₹{Number(b.surcharge_amount).toFixed(2)}</b>
                  </span>
                  <span style={{ color: 'var(--ink)' }}>
                    Total: <b>₹{Number(b.actual_amount || b.quote_amount).toFixed(2)}</b>
                  </span>
                </div>
              )}

              {/* Urgent Confirmation Call Notice */}
              {b.booking_type === 'urgent' && !b.call_confirmed && b.status === 'requested' && (
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    margin: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#92400E',
                    fontSize: '12.5px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📞</span>
                  <div>
                    <b>Pending Confirmation Call:</b> Our admin team is reviewing your urgent booking and will call you shortly to confirm before assigning a climber.
                  </div>
                </div>
              )}

              {/* Progress Stepper (4 equal columns, centered 28px circles, labels 12px centered min-height 2.4em) */}
              {b.status !== 'cancelled' ? (
                <div className={`timeline ${b.booking_type === 'urgent' ? 'urgent-timeline' : ''}`}>
                  {b.booking_type === 'urgent' ? (
                    // 5-step Urgent Timeline with Confirmation Call step
                    [
                      { key: 'requested', label: 'Requested', isDone: true, isCurrent: false },
                      {
                        key: 'call',
                        label: b.call_confirmed ? 'Call Confirmed' : 'Confirmation Call',
                        isDone: b.call_confirmed || currentStepIdx >= 1,
                        isCurrent: !b.call_confirmed && b.status === 'requested'
                      },
                      {
                        key: 'assigned',
                        label: 'Climber Assigned',
                        isDone: currentStepIdx >= 1 || isCompleted,
                        isCurrent: b.call_confirmed && b.status === 'requested'
                      },
                      {
                        key: 'in_progress',
                        label: 'In Progress',
                        isDone: currentStepIdx >= 2 || isCompleted,
                        isCurrent: b.status === 'in_progress'
                      },
                      {
                        key: 'completed',
                        label: 'Completed',
                        isDone: isCompleted,
                        isCurrent: false
                      }
                    ].map((stepObj, idx) => (
                      <div
                        key={stepObj.key}
                        className={`tl-step ${stepObj.isDone ? 'done' : stepObj.isCurrent ? 'on' : ''}`}
                      >
                        <div className="dot">
                          {stepObj.isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>
                        <div className="lbl">{stepObj.label}</div>
                      </div>
                    ))
                  ) : (
                    // Standard 4-step Timeline
                    STATUS_ORDER.map((stepKey, idx) => {
                      const isDone = idx < currentStepIdx || isCompleted;
                      const isCurrent = idx === currentStepIdx && !isCompleted;
                      const stepLabels = {
                        requested: 'Requested',
                        assigned: 'Professional Assigned',
                        in_progress: 'In Progress',
                        completed: 'Completed'
                      };

                      return (
                        <div
                          key={stepKey}
                          className={`tl-step ${isDone ? 'done' : isCurrent ? 'on' : ''}`}
                        >
                          <div className="dot">
                            {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                          </div>
                          <div className="lbl">{stepLabels[stepKey]}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--danger)', fontSize: '13px', margin: '10px 0' }}>
                  This booking request was cancelled.
                </div>
              )}

              {/* Professional Card (No trailing dot, badge left-aligned on own row, 48px 2-col buttons) */}
              {pro ? (
                <div className={`bk-pro-card ${b.status === 'in_progress' ? 'in-progress' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="worker-avatar" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                      {getDisplayName(pro)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: '14px', color: 'var(--ink)', display: 'block' }}>{getDisplayName(pro)}</b>
                      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{pro.experience_years || 5} yrs exp · {pro.taluka || b.taluka}</span>
                        <span>·</span>
                        <span className="star-rate">
                          {'★'.repeat(Math.round(pro.rating_avg || 5))} ({pro.rating_avg || '5.0'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2-column grid buttons (48px height, equal width) */}
                  {b.status !== 'cancelled' && (
                    <div className="bk-pro-buttons" style={{ marginTop: '14px' }}>
                      <a
                        href={`tel:${pro.phone || '9822123456'}`}
                        className="bk-btn-pro"
                        style={{
                          background: 'var(--teal)',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={16} />
                        <span>Call Climber</span>
                      </a>
                      <a
                        href={`https://wa.me/91${pro.phone || '9822123456'}?text=Hello%20${encodeURIComponent(getDisplayName(pro))},%20my%20Coconut%20Plucker%20booking%20is%20${b.booking_number}.%20Here%20is%20my%20address:%20${encodeURIComponent(b.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bk-btn-pro"
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        <WhatsAppIcon size={18} color="#FFFFFF" />
                        <span>WhatsApp Location</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Customer Uploaded Tree Photo if available */}
              {b.tree_photo && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={b.tree_photo}
                    alt="Uploaded Tree"
                    style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--line)' }}
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                    📸 Customer Tree Reference Photo attached
                  </span>
                </div>
              )}

              {/* Bottom Actions Area (pinned to bottom with margin-top: auto) */}
              <div className="bk-bottom-actions">
                {isCompleted && isBalancePending && (
                  <Button
                    variant="primary"
                    icon={CreditCard}
                    className="bk-pay-btn"
                    onClick={() => payBooking(b.id)}
                  >
                    Pay ₹{balanceDue.toFixed(2)} Balance Online
                  </Button>
                )}

                {isCompleted && !b.rating && (
                  <Button
                    variant="gold"
                    icon={Star}
                    style={{ width: '100%', height: '48px', minHeight: '48px' }}
                    onClick={() => setReviewingBooking(b)}
                  >
                    Rate & Review Professional
                  </Button>
                )}

                {isCompleted && b.rating && (
                  <div className="bk-review-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', color: 'var(--ink-soft)' }}>Your Review:</span>
                      <span className="star-rate">{'★'.repeat(b.rating)}</span>
                    </div>
                    {b.comment && (
                      <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', color: 'var(--ink)', lineHeight: '1.4' }}>
                        "{b.comment}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewingBooking}
        onClose={() => setReviewingBooking(null)}
        booking={reviewingBooking}
        onSubmit={reviewBooking}
      />
    </div>
  );
};
