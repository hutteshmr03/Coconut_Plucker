import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { bookingsAPI } from '../../services/api';
import { launchRazorpayCheckout } from '../../services/razorpay';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getCleanServiceIcon } from '../../utils/helpers';

const TALUKAS = [
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const EmergencyBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { services, addBooking } = useApp();

  const activeServices = (services || []).filter((s) => s.status === 'active');
  const [selectedServiceId, setSelectedServiceId] = useState(activeServices[0]?.id || 'svc_trim');
  const [taluka, setTaluka] = useState(currentUser?.taluka || 'North Goa');
  const [treeCount, setTreeCount] = useState(1);
  const [address, setAddress] = useState(currentUser?.address || '');
  const [hazardDescription, setHazardDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTaluka(currentUser?.taluka || 'North Goa');
      setAddress(currentUser?.address || '');
      setHazardDescription('');
      setError('');
    }
  }, [isOpen, currentUser?.taluka, currentUser?.address]);

  const selectedService = (services || []).find((s) => s.id === selectedServiceId) || services?.[0];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!address.trim()) {
      setError('Please provide the property address for emergency dispatch');
      return;
    }
    if (!hazardDescription.trim()) {
      setError('Please describe the emergency hazard or urgency');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const baseAmount = (selectedService?.base_rate || 100) * Number(treeCount || 1);
    const surchargeAmount = baseAmount * 0.2; // 20% urgent surcharge
    const totalAmount = baseAmount + surchargeAmount;

    const payload = {
      customer_id: currentUser?.id,
      service_id: selectedService?.id || 'svc_trim',
      taluka,
      tree_count: Number(treeCount) || 1,
      address: address.trim(),
      hazard_notes: hazardDescription.trim(),
      booking_type: 'urgent',
      scheduled_at: new Date().toISOString(),
      base_amount: baseAmount,
      surcharge_amount: surchargeAmount,
      quote_amount: totalAmount,
      actual_amount: totalAmount,
      payment_status: 'paid',
      payment_method: 'UPI'
    };

    try {
      const orderRes = await bookingsAPI.createRazorpayOrder({
        service_id: payload.service_id,
        service_name: selectedService?.name || 'Urgent Tree Service',
        tree_count: payload.tree_count,
        booking_type: 'urgent'
      });

      const activeKey = orderRes?.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (orderRes?.mode === 'razorpay' && activeKey && orderRes?.order_id) {
        await launchRazorpayCheckout({
          amount: totalAmount,
          orderId: orderRes.order_id,
          serviceName: `${selectedService?.name || 'Urgent Dispatch'} (${payload.tree_count})`,
          customerName: currentUser?.full_name || '',
          customerPhone: currentUser?.phone || '',
          customerEmail: currentUser?.email || '',
          key: activeKey,
          onSuccess: async (paymentRecord) => {
            try {
              await addBooking({
                ...payload,
                razorpay_payment_id: paymentRecord?.payment_id,
                razorpay_order_id: paymentRecord?.order_id,
                razorpay_signature: paymentRecord?.signature,
                payment_id: paymentRecord?.payment_id,
                payment_method: paymentRecord?.payment_method || 'Razorpay Online'
              });
              setIsDispatched(true);
              setTimeout(() => {
                setIsDispatched(false);
                setIsSubmitting(false);
                onClose();
                if (onSuccess) onSuccess();
              }, 1500);
            } catch (bookErr) {
              setError(bookErr.message || 'Failed to confirm emergency booking after payment');
              setIsSubmitting(false);
            }
          },
          onDismiss: () => setIsSubmitting(false),
          onError: (errMsg) => {
            setError(errMsg || 'Payment failed for emergency dispatch');
            setIsSubmitting(false);
          }
        });
        return;
      }

      await addBooking(payload);
      setIsDispatched(true);
      setTimeout(() => {
        setIsDispatched(false);
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to dispatch emergency request');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Emergency Climber Dispatch (Same-Day)"
      footer={
        isDispatched ? null : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSubmit}
              disabled={isSubmitting}
              icon={AlertTriangle}
            >
              {isSubmitting ? 'Dispatching...' : 'Confirm Emergency Request'}
            </Button>
          </>
        )
      }
    >
      {isDispatched ? (
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <CheckCircle size={48} color="var(--teal)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: 'var(--teal-dark)', marginBottom: '6px' }}>Emergency Request Placed!</h3>
          <p className="cell-muted" style={{ fontSize: '13.5px' }}>
            Dispatch operators and on-duty climbers in {taluka} have been alerted.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: 'rgba(179, 64, 44, 0.08)',
              border: '1px solid rgba(179, 64, 44, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12.5px',
              color: 'var(--ink)'
            }}
          >
            <b>🚨 Urgent Response Protocol:</b> Same-day emergency response with 20% urgent fee. An admin will call immediately to confirm dispatch.
          </div>

          {error && <div className="field-error" style={{ marginBottom: '12px' }}>{error}</div>}

          <Select
            label="Emergency Service Type"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={activeServices.map((s) => ({ value: s.id, label: `${getCleanServiceIcon(s)} ${s.name} (₹${s.base_rate}/${s.unit})` }))}
            required
          />

          <div className="field-row">
            <Select
              label="Taluka"
              value={taluka}
              onChange={(e) => setTaluka(e.target.value)}
              options={TALUKAS}
              required
            />
            <Input
              label="Affected Trees / Units"
              type="number"
              min="1"
              max="50"
              value={treeCount}
              onChange={(e) => setTreeCount(e.target.value)}
              required
            />
          </div>

          <Input
            label="Property Address for Dispatch"
            placeholder="Complete street address or landmark"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <div className="field">
            <label>Emergency Notes / Hazard Description <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="field-textarea"
              rows={3}
              placeholder="e.g., Heavy coconut branch cracked and hanging dangerously above power lines."
              value={hazardDescription}
              onChange={(e) => setHazardDescription(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
                fontSize: '13.5px'
              }}
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
