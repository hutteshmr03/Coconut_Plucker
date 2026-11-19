// Razorpay Checkout Integration Utility
// Loads official checkout.js and triggers the Razorpay Standard Checkout popup

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function launchRazorpayCheckout({
  amount,
  serviceName = 'Paddeli Service',
  customerName = '',
  customerPhone = '',
  customerEmail = '',
  key = null,
  onSuccess,
  onDismiss,
  onError
}) {
  const activeKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID || localStorage.getItem('cp_razorpay_key_id');

  if (!activeKey) {
    throw new Error('NO_KEY');
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('SCRIPT_LOAD_FAILED');
  }

  const numAmount = Math.max(1, Math.round(Number(amount || 0) * 100)); // Razorpay accepts paise

  const options = {
    key: activeKey,
    amount: numAmount,
    currency: 'INR',
    name: 'Paddeli',
    description: serviceName || 'Skilled Height Work On Demand',
    image: '/assets/logo.png',
    prefill: {
      name: customerName || '',
      contact: customerPhone ? String(customerPhone).replace(/\D/g, '').slice(-10) : '',
      email: customerEmail || ''
    },
    theme: {
      color: '#007A5E'
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id || `order_rzp_${Date.now().toString(36)}`,
          signature: response.razorpay_signature || null,
          amount: Number(amount),
          currency: 'INR',
          payment_method: 'Razorpay Online',
          gateway: 'Razorpay',
          paid_at: new Date().toISOString()
        });
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    if (onError) {
      rzp.on('payment.failed', function (resp) {
        onError(resp.error?.description || 'Payment transaction failed');
      });
    }
    rzp.open();
    return true;
  } catch (err) {
    if (onError) onError(err.message);
    throw err;
  }
}
