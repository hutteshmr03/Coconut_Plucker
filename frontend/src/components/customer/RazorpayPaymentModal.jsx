import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Smartphone,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle,
  QrCode,
  Lock,
  ArrowRight
} from 'lucide-react';

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
  const [upiMethod, setUpiMethod] = useState('id'); // 'id' | 'qr'
  const [upiId, setUpiId] = useState('nanu@okhdfcbank');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('321');
  const [cardHolder, setCardHolder] = useState('Nanu Prabhu');

  // Bank selection
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const numAmount = Number(amount || 0);

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
        payment_method: activeTab === 'upi' ? `UPI (${upiId || 'QR'})` : activeTab === 'card' ? 'Credit/Debit Card' : `Net Banking (${selectedBank.toUpperCase()})`,
        gateway: 'Razorpay',
        paid_at: new Date().toISOString()
      };

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentRecord);
        }
      }, 1200);
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title="Secure Razorpay Payment Gateway"
    >
      <div style={{ padding: '4px 0' }}>
        {/* Razorpay Brand & Order Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0c2340 0%, #0d3b66 100%)',
            color: '#FFFFFF',
            padding: '16px 18px',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#90cdf4', fontWeight: '700' }}>
              Razorpay Trusted Business Checkout
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px' }}>
              {serviceName || 'Tree Care & Harvesting Service'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#e2e8f0', marginTop: '2px' }}>
              {bookingDetails?.taluka ? `Taluka: ${bookingDetails.taluka}` : 'Upfront Verified Payment'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Total Amount to Pay</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#68d391' }}>
              ₹{numAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <CheckCircle size={56} color="#38a169" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ color: '#276749', fontSize: '20px', marginBottom: '6px' }}>
              Payment of ₹{numAmount.toFixed(2)} Successful!
            </h3>
            <p className="cell-muted" style={{ fontSize: '13.5px' }}>
              Razorpay Transaction Verified. Confirming your booking now...
            </p>
          </div>
        ) : (
          <div>
            {/* Payment Method Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '18px'
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('upi'); setError(''); }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: activeTab === 'upi' ? '2px solid #3182ce' : '1px solid var(--line)',
                  background: activeTab === 'upi' ? 'rgba(49, 130, 206, 0.08)' : 'var(--paper)',
                  color: activeTab === 'upi' ? '#2b6cb0' : 'var(--ink)',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Smartphone size={18} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setError(''); }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: activeTab === 'card' ? '2px solid #3182ce' : '1px solid var(--line)',
                  background: activeTab === 'card' ? 'rgba(49, 130, 206, 0.08)' : 'var(--paper)',
                  color: activeTab === 'card' ? '#2b6cb0' : 'var(--ink)',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <CreditCard size={18} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('netbanking'); setError(''); }}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: activeTab === 'netbanking' ? '2px solid #3182ce' : '1px solid var(--line)',
                  background: activeTab === 'netbanking' ? 'rgba(49, 130, 206, 0.08)' : 'var(--paper)',
                  color: activeTab === 'netbanking' ? '#2b6cb0' : 'var(--ink)',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Building2 size={18} />
                <span>Net Banking</span>
              </button>
            </div>

            {error && (
              <div className="field-error" style={{ marginBottom: '14px', padding: '8px 12px', background: 'rgba(179, 64, 44, 0.08)', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            {/* TAB 1: UPI / QR CODE */}
            {activeTab === 'upi' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setUpiMethod('id')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: upiMethod === 'id' ? '1.5px solid #3182ce' : '1px solid var(--line)',
                      background: upiMethod === 'id' ? 'rgba(49, 130, 206, 0.08)' : 'var(--cream)',
                      cursor: 'pointer'
                    }}
                  >
                    UPI ID (Google Pay / PhonePe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiMethod('qr')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: upiMethod === 'qr' ? '1.5px solid #3182ce' : '1px solid var(--line)',
                      background: upiMethod === 'qr' ? 'rgba(49, 130, 206, 0.08)' : 'var(--cream)',
                      cursor: 'pointer'
                    }}
                  >
                    Instant QR Code Scan
                  </button>
                </div>

                {upiMethod === 'id' ? (
                  <div>
                    <Input
                      label="Enter Your Virtual Payment Address (UPI ID)"
                      placeholder="e.g. 9888251332@paytm or name@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      hint="Supports GPay, PhonePe, Paytm, BHIM, Cred, Amazon Pay"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      background: 'var(--cream)',
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      marginBottom: '12px'
                    }}
                  >
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        background: '#FFFFFF',
                        border: '2px solid var(--ink)',
                        borderRadius: '8px',
                        margin: '0 auto 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <QrCode size={90} color="var(--ink)" />
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ink)' }}>
                      Scan with any UPI App to Pay ₹{numAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                      Auto-detects payment verification on completion
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
                  placeholder="4532 8901 2345 6789"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
                <div className="field-row">
                  <Input
                    label="Expiry Date (MM/YY)"
                    placeholder="08/29"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                  />
                  <Input
                    label="CVV / CVC"
                    placeholder="321"
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Cardholder Name"
                  placeholder="Full Name as printed on card"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />
              </div>
            )}

            {/* TAB 3: NET BANKING / BANK TRANSFER */}
            {activeTab === 'netbanking' && (
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                  Select Your Bank for Direct Payment:
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
                          border: isSelected ? '2px solid #3182ce' : '1px solid var(--line)',
                          background: isSelected ? 'rgba(49, 130, 206, 0.08)' : 'var(--paper)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.5px',
                          fontWeight: isSelected ? '700' : '500'
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

            {/* Security Guarantee Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--ink-soft)',
                marginTop: '14px',
                marginBottom: '16px'
              }}
            >
              <ShieldCheck size={16} color="#38a169" />
              <span>Payments are processed 100% securely with 256-bit Razorpay encryption.</span>
            </div>

            {/* Pay Button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
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
                  background: isProcessing ? '#718096' : 'linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(26, 54, 93, 0.25)'
                }}
              >
                <Lock size={16} />
                {isProcessing ? 'Verifying with Bank...' : `Pay ₹${numAmount.toFixed(2)} via Razorpay`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
