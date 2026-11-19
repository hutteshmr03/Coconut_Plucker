import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDisplayName, getServiceImage } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CreditCard, Plus, MapPin, Check } from 'lucide-react';

export const CustomerBookings = () => {
  const { currentUser } = useAuth();
  const {
    bookings,
    services,
    professionals,
    currentCustomerId,
    payBooking,
    setCurrentView
  } = useApp();

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
          const isCompleted = b.status === 'completed';
          const totalAmt = Number(b.actual_amount || b.quote_amount || 0);

          const formattedDate = new Date(b.scheduled_at).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          return (
            <div key={b.id} className="booking-card">
              {/* Header: Grid 56px 1fr auto, gap 12px */}
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
                  <div className="bk-right-price">
                    <div className="bk-price">
                      ₹{totalAmt.toFixed(2)}
                    </div>
                    <div className="bk-payment-label" style={{ color: 'var(--teal)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={12} strokeWidth={3} /> Paid · {b.payment_method ? (b.payment_method.startsWith('UPI') ? 'UPI' : b.payment_method.split(' ')[0]) : 'UPI'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Row: Fixed-width pin icon + text */}
              <div className="bk-address-row">
                <MapPin size={16} color="var(--ink-soft)" className="bk-address-pin" />
                <span>{b.address}, {b.taluka}</span>
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

              {/* Cancelled Notice */}
              {b.status === 'cancelled' && (
                <div style={{ color: 'var(--danger)', fontSize: '13px', margin: '10px 0' }}>
                  This booking request was cancelled.
                </div>
              )}

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
            </div>
          );
        })}
      </div>
    </div>
  );
};
