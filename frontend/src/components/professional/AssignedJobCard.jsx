import React, { useState } from 'react';
import { getDisplayName } from '../../utils/helpers';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Play, CheckCircle, MapPin, Calendar, Phone, AlertCircle, Camera, Eye } from 'lucide-react';

export const AssignedJobCard = ({
  booking,
  service,
  customer,
  onStartJob,
  onCompleteJob
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
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

      {/* Feature: Customer Attached Tree Photo */}
      {booking.tree_photo && (
        <div
          style={{
            marginTop: '12px',
            background: 'rgba(31, 138, 130, 0.06)',
            border: '1px solid rgba(31, 138, 130, 0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={booking.tree_photo}
              alt="Tree Snapshot"
              onClick={() => setIsPhotoModalOpen(true)}
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--teal-dark)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Camera size={14} /> 1-Snap Tree Photo Attached
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                Uploaded by customer for height & safety rope inspection
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--teal)',
              color: 'var(--teal-dark)',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Eye size={13} /> View Snap
          </button>
        </div>
      )}

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

      {/* Tree Photo Lightbox Modal */}
      {isPhotoModalOpen && (
        <Modal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          title={`Customer Tree Snapshot · ${booking.booking_number}`}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={booking.tree_photo}
              alt="Tree full snapshot"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}
            />
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ink-soft)' }}>
              Location: <b>{booking.address}, {booking.taluka}</b>
              {booking.height_category && (
                <span> · Height Tier: <b>{booking.height_category}</b></span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
