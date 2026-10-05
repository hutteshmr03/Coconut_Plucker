import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle,
  QrCode,
  Lock,
  ArrowRight,
  Clock,
  RotateCcw,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { formatScheduledDateLabel } from '../../utils/helpers';

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', icon: '🏛️' },
  { id: 'sbi', name: 'State Bank of India', icon: '🏦' },
  { id: 'icici', name: 'ICICI Bank', icon: '🏢' },
  { id: 'axis', name: 'Axis Bank', icon: '🏧' },
  { id: 'kotak', name: 'Kotak Mahindra', icon: '🏛️' },
  { id: 'bob', name: 'Bank of Baroda', icon: '🏦' }
];

export const RazorpayPaymentModal = ({
  isOpen,
  onClose,
  amount,
  serviceName,
  bookingDetails,
  onPaymentSuccess
}) => {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiMethod, setUpiMethod] = useState('qr'); // 'qr' (scanner 1st) | 'id'
  const [upiId, setUpiId] = useState('');
  const [qrTimeRemaining, setQrTimeRemaining] = useState(600); // 10 minutes timer (600s)

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Bank selection
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedRecord, setCompletedRecord] = useState(null);
  const [error, setError] = useState('');

  const numAmount = Number(amount || 0);

  // 10-minute QR code countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess || activeTab !== 'upi' || upiMethod !== 'qr') return;

    const timer = setInterval(() => {
      setQrTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSuccess, activeTab, upiMethod]);

  // Reset timer on open or switching to QR
  useEffect(() => {
    if (isOpen && upiMethod === 'qr') {
      setQrTimeRemaining(600);
    }
  }, [isOpen, upiMethod]);

  const formatQrTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePay = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (activeTab === 'upi' && upiMethod === 'id' && (!upiId || !upiId.includes('@'))) {
      setError('Please enter a valid UPI ID (e.g. mobile@upi or name@okhdfcbank)');
      return;
    }

    if (activeTab === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        setError('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setError('Please enter a valid MM/YY expiry');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter a valid 3-digit CVV');
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      const paymentRecord = {
        payment_id: 'pay_rzp_' + Date.now().toString(36),
        order_id: 'order_rzp_' + Math.random().toString(36).slice(2, 9),
        amount: numAmount,
        currency: 'INR',
        payment_method: activeTab === 'upi' ? `UPI (${upiMethod === 'qr' ? 'QR Code' : upiId})` : activeTab === 'card' ? 'Credit/Debit Card' : `Net Banking (${selectedBank.toUpperCase()})`,
        gateway: 'Razorpay',
        paid_at: new Date().toISOString()
      };
      setCompletedRecord(paymentRecord);
    }, 1200);
  };

  const handleOkClick = () => {
    setIsSuccess(false);
    onClose();
    if (onPaymentSuccess && completedRecord) {
      onPaymentSuccess(completedRecord);
    }
  };

  const handleModalClose = () => {
    if (isProcessing) return;
    if (isSuccess && completedRecord) {
      handleOkClick();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isSuccess ? "Booking Confirmed" : "Payment Options"}
      maxWidth={isSuccess ? '450px' : '520px'}
    >
      <div style={{ padding: '2px 0' }}>
        {isSuccess ? (
          /* Booking Confirmation */
          <div style={{ textAlign: 'center', padding: '6px 4px 4px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(56, 161, 105, 0.12)',
              border: '2px solid #38A169',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <CheckCircle size={38} color="#38A169" />
            </div>

            <h3 style={{ color: '#22242A', fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
              Booking Confirmed!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#666668', marginBottom: '16px' }}>
              Payment of <b style={{ color: '#1E88E5' }}>₹{numAmount.toFixed(2)}</b> was received successfully.
            </p>

            {/* Ticket Summary Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #EBEBF2',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                borderBottom: '1.5px dashed #EBEBF2'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#666668', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Service
                  </span>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#22242A', marginTop: '2px' }}>
                    {serviceName || 'Coconut Plucker'}
                  </div>
                </div>
                <span style={{
                  background: 'rgba(56, 161, 105, 0.12)',
                  color: '#276749',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  ✓ PAID
                </span>
              </div>

              {bookingDetails?.scheduledDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#666668' }}>Date:</span>
                  <span style={{ fontWeight: '700', color: '#22242A' }}>
                    {formatScheduledDateLabel(bookingDetails.scheduledDate)}
                  </span>
                </div>
              )}

              {bookingDetails?.taluka && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#666668' }}>Location:</span>
                  <span style={{ fontWeight: '600', color: '#22242A' }}>
                    {bookingDetails.taluka}, Goa
                  </span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13.5px',
                paddingTop: '8px',
                borderTop: '1.5px dashed #EBEBF2'
              }}>
                <span style={{ color: '#666668', fontWeight: '600' }}>Amount Paid:</span>
                <span style={{ fontWeight: '800', color: '#1E88E5', fontSize: '15px' }}>
                  ₹{numAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOkClick}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(30, 136, 229, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Payment Method Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('upi'); setError(''); }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: activeTab === 'upi' ? '2px solid #1E88E5' : '1px solid #EBEBF2',
                  background: activeTab === 'upi' ? '#EFF6FF' : '#FFFFFF',
                  color: activeTab === 'upi' ? '#1E88E5' : '#49494D',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'upi' ? '0 2px 8px rgba(30, 136, 229, 0.18)' : 'none'
                }}
              >
                <Smartphone size={18} />
                <span>UPI (QR / ID)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setError(''); }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: activeTab === 'card' ? '2px solid #1E88E5' : '1px solid #EBEBF2',
                  background: activeTab === 'card' ? '#EFF6FF' : '#FFFFFF',
                  color: activeTab === 'card' ? '#1E88E5' : '#49494D',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'card' ? '0 2px 8px rgba(30, 136, 229, 0.18)' : 'none'
                }}
              >
                <CreditCard size={18} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('netbanking'); setError(''); }}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: activeTab === 'netbanking' ? '2px solid #1E88E5' : '1px solid #EBEBF2',
                  background: activeTab === 'netbanking' ? '#EFF6FF' : '#FFFFFF',
                  color: activeTab === 'netbanking' ? '#1E88E5' : '#49494D',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === 'netbanking' ? '0 2px 8px rgba(30, 136, 229, 0.18)' : 'none'
                }}
              >
                <Building2 size={18} />
                <span>Net Banking</span>
              </button>
            </div>

            {error && (
              <div className="field-error" style={{ marginBottom: '14px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {/* TAB 1: UPI / QR CODE */}
            {activeTab === 'upi' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiMethod('qr');
                      setQrTimeRemaining(600);
                      setError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      border: upiMethod === 'qr' ? '1.5px solid #1E88E5' : '1px solid #EBEBF2',
                      background: upiMethod === 'qr' ? '#EFF6FF' : '#F5F5FA',
                      color: upiMethod === 'qr' ? '#1E88E5' : '#49494D',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <QrCode size={15} />
                    <span>Scan QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUpiMethod('id');
                      setError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      border: upiMethod === 'id' ? '1.5px solid #1E88E5' : '1px solid #EBEBF2',
                      background: upiMethod === 'id' ? '#EFF6FF' : '#F5F5FA',
                      color: upiMethod === 'id' ? '#1E88E5' : '#49494D',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Smartphone size={15} />
                    <span>Pay via UPI ID</span>
                  </button>
                </div>

                {upiMethod === 'qr' ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      background: '#FAFAFC',
                      borderRadius: '12px',
                      border: '1.5px solid #EBEBF2',
                      marginBottom: '12px'
                    }}
                  >
                    {/* Time Left Badge Without Border */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'transparent',
                      color: '#1E88E5',
                      border: 'none',
                      padding: '2px 8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      marginBottom: '12px'
                    }}>
                      <Clock size={14} color="#1E88E5" />
                      <span>
                        {qrTimeRemaining > 0
                          ? `Time left to pay: ${formatQrTimer(qrTimeRemaining)}`
                          : 'QR Code Expired'}
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div
                      style={{
                        width: '136px',
                        height: '136px',
                        background: '#FFFFFF',
                        border: '2px solid #22242A',
                        borderRadius: '12px',
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    >
                      {qrTimeRemaining > 0 ? (
                        <QrCode size={108} color="#22242A" />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                          <RotateCcw size={28} color="#1E88E5" style={{ margin: '0 auto 6px' }} />
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1E88E5' }}>Expired</div>
                        </div>
                      )}
                    </div>

                    {qrTimeRemaining === 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setQrTimeRemaining(600)}
                          style={{
                            background: '#1E88E5',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Regenerate QR Code</span>
                        </button>
                      </div>
                    )}

                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#22242A', marginTop: '4px' }}>
                      Scan the QR using any UPI app on your phone
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#666668', marginTop: '3px' }}>
                      Auto-detects payment verification on completion • ₹{numAmount.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input
                      label="Enter Your UPI ID"
                      placeholder="e.g. mobile@upi or username@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '11.5px', color: '#666668', marginTop: '4px' }}>
                      A payment request will be sent to your UPI app
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARDS */}
            {activeTab === 'card' && (
              <div>
                <Input
                  label="Card Number (Visa, MasterCard, RuPay)"
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                    setCardNumber(formatted);
                  }}
                  required
                />
                <div className="field-row">
                  <Input
                    label="Expiry Date (MM/YY)"
                    placeholder="MM / YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (v.length >= 3) {
                        v = `${v.slice(0, 2)}/${v.slice(2)}`;
                      }
                      setCardExpiry(v);
                    }}
                    required
                  />
                  <Input
                    label="CVV / CVC"
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                  />
                </div>
                <Input
                  label="Cardholder Name"
                  placeholder="Name as printed on card"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />
              </div>
            )}

            {/* TAB 3: NET BANKING / BANK TRANSFER */}
            {activeTab === 'netbanking' && (
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', display: 'block', color: '#22242A' }}>
                  Select Your Bank:
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginBottom: '14px'
                  }}
                >
                  {POPULAR_BANKS.map((b) => {
                    const isSelected = selectedBank === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBank(b.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #1E88E5' : '1px solid #EBEBF2',
                          background: isSelected ? '#EFF6FF' : '#FFFFFF',
                          color: isSelected ? '#1E88E5' : '#22242A',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.5px',
                          fontWeight: isSelected ? '700' : '500',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{b.icon}</span>
                        <span>{b.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Blue Pay Button & Footer */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                style={{
                  flex: 2,
                  background: isProcessing ? '#718096' : 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(30, 136, 229, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Lock size={16} />
                {isProcessing ? 'Verifying with Bank...' : `Make Payment ₹${numAmount.toFixed(2)}`}
              </button>
            </div>

            {/* Security Badge Footnote */}
            <div style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#888890',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={13} color="#38A169" />
              <span>100% Safe & Secure Payments</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
