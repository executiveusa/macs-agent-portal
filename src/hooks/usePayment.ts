import { useState } from 'react';
import { PaymentPlan } from '../types/maxxpost';
import { createStripeSession } from '../services/stripeService';
import { createBitcoinInvoice, checkPaymentStatus } from '../services/bitcoinService';

export type PaymentState = 'idle' | 'loading' | 'awaiting_payment' | 'success' | 'error';

export const usePayment = () => {
  const [status, setStatus] = useState<PaymentState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);

  const initiatePayment = async (plan: PaymentPlan) => {
    setStatus('loading');
    setError(null);
    try {
      if (plan.provider === 'stripe') {
        const session = await createStripeSession(plan);
        // In a real app, we would redirect:
        // window.location.href = session.url;
        console.log('Redirecting to Stripe:', session.url);
        setStatus('awaiting_payment'); // Or 'success' if we assume redirect happens
      } else if (plan.provider === 'bitcoin402') {
        const inv = await createBitcoinInvoice(plan);
        setInvoice(inv);
        setStatus('awaiting_payment');
        // Start polling
        const poll = setInterval(async () => {
          const s = await checkPaymentStatus(inv.invoiceId);
          if (s === 'paid') {
            clearInterval(poll);
            setStatus('success');
          }
        }, 2000);
      }
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return { status, error, invoice, initiatePayment };
};
