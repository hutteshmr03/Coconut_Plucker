import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CheckCircle2 } from 'lucide-react';

export const CompleteJobModal = ({ isOpen, onClose, onConfirm, booking }) => {
  const [actualAmount, setActualAmount] = useState(booking?.quote_amount || '');

  if (!booking) return null;

  const isPaidUpfront = booking.payment_status === 'paid';
  const numericActual = Number(actualAmount) || Number(booking.quote_amount || 0);
  const numericQuote = Number(booking.quote_amount || 0);
  const diff = numericActual - numericQuote;
  const hasExtraCharge = isPaidUpfront && diff > 0;

  const handleComplete = (e) => {
    e.preventDefault();
    onConfirm(booking.id, numericActual);
    onClose();
  };

  const getHintText = () => {
    if (!isPaidUpfront) {
      return "The customer will receive an instant payment link for this exact amount";
    }
    if (hasExtraCharge) {
      return `Initial ₹${numericQuote.toFixed(2)} was paid upfront. Customer will receive a payment link for the extra ₹${diff.toFixed(2)}.`;
    }
    return `Full payment of ₹${numericQuote.toFixed(2)} was already collected upfront.`;
  };

  const getButtonLabel = () => {
    if (hasExtraCharge) {
      return `Mark Completed & Request Extra ₹${diff.toFixed(2)}`;
    }
    if (isPaidUpfront) {
      return "Mark Job Completed";
    }
    return "Mark Completed & Request Payment";
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
            {getButtonLabel()}
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
            hint={getHintText()}
          />
        </div>
      </form>
    </Modal>
  );
};
