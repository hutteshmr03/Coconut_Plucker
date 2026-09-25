import React from 'react';
import { getDisplayName } from '../../utils/helpers';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { Play, CheckCircle, MapPin, Calendar, Phone, AlertCircle } from 'lucide-react';

export const AssignedJobCard = ({
  booking,
  service,
  customer,
  onStartJob,
  onCompleteJob
}) => {
  const isAssigned = booking.status === 'assigned';
  const isInProgress = booking.status === 'in_progress';
  const isCompleted = booking.status === 'completed';

  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="booking-card">
      <div className="bk-head">
        <div>
          <h4>
            {service?.icon} {service?.name} · <span style={{ color: 'var(--teal)' }}>{booking.booking_number}</span>
            {booking.booking_type === 'urgent' && (
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
                ⚡ URGENT PRIORITY
              </span>
            )}
          </h4>
          <div className="cell-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <MapPin size={14} color="var(--ink-soft)" />
            <span>
              {booking.address}, {booking.taluka}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusBadge status={booking.status} />
          <div className="cell-strong" style={{ marginTop: '6px', fontSize: '15px' }}>
            ₹{Number(booking.actual_amount || booking.quote_amount).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ marginTop: '12px', background: 'var(--cream)', padding: '12px 14px', borderRadius: '10px' }}>
        <div>
          <div className="kpi-line" style={{ padding: '4px 0' }}>
            <span>Customer</span>
            <b>{getDisplayName(customer)}</b>
          </div>
          <div className="kpi-line" style={{ padding: '4px 0' }}>
            <span>Contact</span>
            <b>{customer?.phone || '—'}</b>
          </div>
          <div className="kpi-line" style={{ padding: '4px 0' }}>
            <span>Quantity</span>
            <b>{booking.tree_count} {service?.unit.replace('per ', '')}s</b>
          </div>
        </div>
        <div>
          <div className="kpi-line" style={{ padding: '4px 0' }}>
            <span>Scheduled</span>
            <b>{scheduledDate}</b>
          </div>
          {booking.height_category && (
            <div className="kpi-line" style={{ padding: '4px 0' }}>
              <span>Height Tier</span>
              <b style={{ textTransform: 'capitalize', color: 'var(--amber)' }}>
                {booking.height_category} Altitude
              </b>
            </div>
          )}
          <div className="kpi-line" style={{ padding: '4px 0' }}>
            <span>Payment</span>
            <b style={{ textTransform: 'capitalize' }}>{booking.payment_status}</b>
          </div>
        </div>
      </div>

      {booking.job_notes && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--ink-soft)' }}>
          <b>Customer Note:</b> "{booking.job_notes}"
        </div>
      )}

      {/* Action buttons */}
      <div className="top-actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
        {isAssigned && (
          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={() => onStartJob(booking)}
          >
            Start Job (Safety Check)
          </Button>
        )}

        {isInProgress && (
          <Button
            variant="gold"
            size="sm"
            icon={CheckCircle}
            onClick={() => onCompleteJob(booking)}
          >
            Mark Job Completed
          </Button>
        )}

        {isCompleted && booking.rating && (
          <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
            Customer Review: <span className="star-rate">{'★'.repeat(booking.rating)}</span> {booking.comment ? `— "${booking.comment}"` : ''}
          </div>
        )}
      </div>
    </div>
  );
};
