import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CheckCircle2 } from 'lucide-react';

export const CompleteJobModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [actualAmount, setActualAmount] = useState(booking?.quote_amount || '');

  if (!booking) return null;

  const handleComplete = (e) => {
    e.preventDefault();
    onConfirm(booking.id, Number(actualAmount) || booking.quote_amount);
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
            Mark Completed & Request Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleComplete}>
        <p className="cell-muted" style={{ marginBottom: '16px' }}>
          Confirm the final billed amount for this service. Adjust only if additional trees were serviced on customer request.
        </p>

        <div className="kpi-line">
          <span>Initial Quoted Amount</span>
          <b>₹{Number(booking.quote_amount).toFixed(2)}</b>
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

        <div style={{ marginTop: '16px' }}>
          <Input
            label="Final Amount to Bill (₹)"
            type="number"
            value={actualAmount}
            onChange={(e) => setActualAmount(e.target.value)}
            required
            hint="The customer will receive an instant payment link for this exact amount"
          />
        </div>
      </form>
    </Modal>
  );
};
