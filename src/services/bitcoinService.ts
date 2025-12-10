import { PaymentPlan } from '../types/maxxpost';

export const createBitcoinInvoice = async (plan: PaymentPlan): Promise<{ invoiceId: string; address: string; amount: number; qrCode: string }> => {
  console.log('Bitcoin Service: Creating invoice for', plan.name);
  
  // Simulation of 402 payment required
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        invoiceId: 'inv_' + Math.random().toString(36).substr(2, 9),
        address: 'bc1qkwxj7g9949449494...',
        amount: plan.price,
        qrCode: 'data:image/png;base64,...mock...'
      });
    }, 1000);
  });
};

export const checkPaymentStatus = async (invoiceId: string): Promise<'pending' | 'paid' | 'expired'> => {
  // Simulate polling
  return Math.random() > 0.7 ? 'paid' : 'pending';
};
