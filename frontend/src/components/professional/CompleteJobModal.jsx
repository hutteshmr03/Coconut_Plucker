import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2 } from 'lucide-react';

export const CompleteJobModal = ({ isOpen, onClose, onConfirm, booking }) => {
  if (!booking) return null;

  const numericQuote = Number(booking.quote_amount || 0);

  const handleComplete = (e) => {
    if (e) e.preventDefault();
    onConfirm(booking.id, numericQuote);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Complete Booking ${booking.booking_number}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" icon={CheckCircle2} onClick={handleComplete}>
            Mark Job Completed
          </Button>
        </>
      }
    >
      <form onSubmit={handleComplete}>
        <div className="kpi-line">
          <span>Initial Quoted Amount</span>
          <b>₹{numericQuote.toFixed(2)}</b>
        </div>
        <div className="kpi-line">
          <span>Tree Count Serviced</span>
          <b>{booking.tree_count} trees</b>
        </div>
        {booking.height_category && (
          <div className="kpi-line">
            <span>Height Category</span>
            <b style={{ textTransform: 'capitalize' }}>{booking.height_category}</b>
          </div>
        )}

        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(31, 138, 130, 0.08)',
          border: '1px solid rgba(31, 138, 130, 0.2)',
          borderRadius: '8px',
          fontSize: '12.5px',
          color: 'var(--teal)',
          fontWeight: '600'
        }}>
          ✓ Full payment of ₹{numericQuote.toFixed(2)} was received upfront.
        </div>
      </form>
    </Modal>
  );
};
