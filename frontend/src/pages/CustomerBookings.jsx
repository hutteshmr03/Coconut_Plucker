import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ReviewModal } from '../components/customer/ReviewModal';
import { Star, CreditCard, Plus, MapPin, Check } from 'lucide-react';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>My Bookings & Status History</h3>
          <p className="cell-muted">Track assignments, verify completion, pay online, and review your climbers.</p>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={() => setCurrentView('cust-book')}>
          New Booking
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customerBookings.map((b) => {
          const svc = services.find((s) => s.id === b.service_id);
          const pro = professionals.find((p) => p.id === b.professional_id);
          const currentStepIdx = STATUS_ORDER.indexOf(b.status);
          const isCompleted = b.status === 'completed';
          const isPaid = b.payment_status === 'paid';

          const formattedDate = new Date(b.scheduled_at).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          return (
            <div key={b.id} className="booking-card">
              {/* Header */}
              <div className="bk-head">
                <div>
                  <h4>
                    {svc?.icon} {svc?.name} · <span style={{ color: 'var(--teal)' }}>{b.booking_number}</span>
                    {b.booking_type === 'urgent' && (
                      <span
                        style={{
                          marginLeft: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          border: '1px solid #FDE68A'
                        }}
                      >
                        ⚡ URGENT
                      </span>
                    )}
                  </h4>
                  <div className="cell-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <MapPin size={14} color="var(--ink-soft)" />
                    <span>
                      {b.tree_count} {svc?.unit?.replace('per ', '') || 'unit'}s · {b.address}, {b.taluka} · Scheduled for {formattedDate}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={b.status} />
                  <div className="cell-strong" style={{ marginTop: '6px', fontSize: '16px' }}>
                    ₹{Number(b.actual_amount || b.quote_amount).toFixed(2)}
                  </div>
                  {isPaid && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        color: 'var(--teal)',
                        fontWeight: '700',
                        marginTop: '2px'
                      }}
                    >
                      <Check size={12} strokeWidth={3} /> Paid ({b.payment_method || 'UPI'})
                    </span>
                  )}
                </div>
              </div>

              {/* Urgent Price Breakdown Line Items */}
              {b.booking_type === 'urgent' && b.surcharge_amount > 0 && (
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

              {/* Status Timeline */}
              {b.status !== 'cancelled' ? (
                <div className="timeline">
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
                          {stepObj.isDone ? <Check size={13} strokeWidth={3} /> : idx + 1}
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
                            {isDone ? <Check size={13} strokeWidth={3} /> : idx + 1}
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

              {/* Assigned Professional Profile Snippet */}
              {pro && (
                <div className="worker-mini">
                  <div className="worker-avatar">
                    {getDisplayName(pro)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="cell-strong" style={{ fontSize: '13.5px' }}>
                      {getDisplayName(pro)}
                    </div>
                    <div className="cell-muted">
                      {pro.experience_years} years climbing · Taluka: {pro.taluka} {pro.safety_cert ? '· Certified' : ''}
                    </div>
                  </div>
                  <div className="star-rate">
                    {'★'.repeat(Math.round(pro.rating_avg))}
                    <span style={{ fontSize: '12px', color: 'var(--ink-soft)', marginLeft: '4px' }}>
                      ({pro.rating_avg})
                    </span>
                  </div>
                </div>
              )}

              {/* Actions: Pay and Review */}
              <div
                className="top-actions"
                style={{
                  justifyContent: 'flex-end',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)'
                }}
              >
                {isCompleted && !isPaid && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    onClick={() => payBooking(b.id)}
                  >
                    Pay ₹{Number(b.actual_amount || b.quote_amount).toFixed(2)} Online
                  </Button>
                )}

                {isCompleted && isPaid && (
                  <span
                    className="badge green"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={12} /> Paid
                  </span>
                )}

                {isCompleted && !b.rating && (
                  <Button
                    variant="gold"
                    size="sm"
                    icon={Star}
                    onClick={() => setReviewingBooking(b)}
                  >
                    Rate & Review Professional
                  </Button>
                )}

                {isCompleted && b.rating && (
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                    Your Rating: <span className="star-rate">{'★'.repeat(b.rating)}</span> {b.comment ? `— "${b.comment}"` : ''}
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
