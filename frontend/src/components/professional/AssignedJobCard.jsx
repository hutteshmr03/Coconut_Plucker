import React, { useState } from 'react';
import { getDisplayName, getServiceImage } from '../../utils/helpers';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Play, CheckCircle, MapPin, Phone, Camera, Eye, Check } from 'lucide-react';

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

  const totalAmt = Number(booking.actual_amount || booking.quote_amount || 0);

  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Clean and parse payment info avoiding nested parentheses or overflowing handles
  const isPaid = booking.payment_status === 'paid';
  const rawMethod = booking.payment_method || 'UPI';
  let methodLabel = 'UPI';
  let upiHandle = '';

  if (rawMethod.includes('(') && rawMethod.includes(')')) {
    const match = rawMethod.match(/^([^(]+)\(([^)]+)\)$/);
    if (match) {
      methodLabel = match[1].trim();
      upiHandle = match[2].trim().replace(/[()]/g, '');
    } else {
      methodLabel = rawMethod.replace(/[()]/g, '').trim();
    }
  } else {
    methodLabel = rawMethod;
  }

  return (
    <div className="booking-card">
      {/* 3-Column Header Grid */}
      <div className="bk-head">
        <img
          src={getServiceImage(service || booking)}
          alt={service?.name || booking.service_name}
          className="bk-thumb"
          width="64"
          height="64"
        />
        <div className="bk-middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h4 className="bk-title">
              {service?.name || booking.service_name}
            </h4>
            {booking.booking_type === 'urgent' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
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
          </div>
          <div className="bk-id">
            {booking.booking_number}
          </div>
          <div className="bk-meta">
            {booking.tree_count} {service?.unit?.replace('per ', '') || 'tree'}s · {scheduledDate}
          </div>
        </div>

        <div className="bk-right">
          <StatusBadge status={booking.status} />
          <div className="bk-price">
            ₹{totalAmt.toFixed(2)}
          </div>
          {isPaid ? (
            <div style={{ textAlign: 'right', marginTop: '2px' }}>
              <div
                className="bk-payment-label"
                style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                <Check size={12} strokeWidth={3} /> Paid · {methodLabel}
              </div>
              {upiHandle && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={upiHandle}
                >
                  {upiHandle}
                </div>
              )}
            </div>
          ) : (
            <div className="bk-payment-label" style={{ color: 'var(--ink-soft)' }}>
              <span style={{ textTransform: 'capitalize' }}>{booking.payment_status || 'Pending'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Row */}
      <div className="bk-address-row">
        <MapPin size={16} color="var(--ink-soft)" className="bk-address-pin" />
        <span>{booking.address}, {booking.taluka}</span>
      </div>

      {/* Job Details Key-Value Box */}
      <div className="bk-job-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div className="bk-job-row">
            <span>Customer</span>
            <b>{getDisplayName(customer)}</b>
          </div>
          <div className="bk-job-row">
            <span>Contact</span>
            {customer?.phone ? (
              <a href={`tel:${customer.phone}`} className="phone-link-pill">
                <Phone size={11} /> {customer.phone}
              </a>
            ) : (
              <b>—</b>
            )}
          </div>
          <div className="bk-job-row">
            <span>Quantity</span>
            <b>{booking.tree_count} {service?.unit?.replace('per ', '') || 'tree'}s</b>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div className="bk-job-row">
            <span>Scheduled</span>
            <b className="nowrap">{scheduledDate}</b>
          </div>
          <div className="bk-job-row">
            <span>{booking.height_category ? 'Height Tier' : 'Service Area'}</span>
            <b>{booking.height_category ? `${booking.height_category} Altitude` : booking.taluka}</b>
          </div>
          <div className="bk-job-row">
            <span>Payment</span>
            <b style={{ textTransform: 'capitalize' }}>{booking.payment_status || 'Pending'}</b>
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
                width: '44px',
                height: '44px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--teal-dark)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Camera size={14} /> 1-Snap Tree Photo Attached
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
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
              padding: '4px 10px',
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
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: 'var(--ink-soft)',
            background: 'var(--cream)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--line)'
          }}
        >
          <b>Customer Note:</b> "{booking.job_notes}"
        </div>
      )}

      {/* Action Buttons Area */}
      <div className="bk-bottom-actions">
        {isAssigned && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="primary"
              size="md"
              icon={Play}
              className="bk-action-btn"
              onClick={() => onStartJob(booking)}
            >
              Start Job (Safety Check)
            </Button>
          </div>
        )}

        {isInProgress && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="gold"
              size="md"
              icon={CheckCircle}
              className="bk-action-btn"
              onClick={() => onCompleteJob(booking)}
            >
              Mark Job Completed
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="bk-completed-bar">
            <div className="bk-completed-status">
              <Check size={16} strokeWidth={3} />
              <span>Job Completed</span>
            </div>
            {booking.rating ? (
              <div className="bk-completed-rating">
                <span className="star-rate">{'★'.repeat(booking.rating)}{'☆'.repeat(Math.max(0, 5 - booking.rating))}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-soft)' }}>({booking.rating}/5)</span>
              </div>
            ) : (
              <div className="bk-completed-rating unrated">
                <span>Pending Review</span>
              </div>
            )}
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
