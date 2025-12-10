import { PaymentPlan } from '../types/maxxpost';

export const createStripeSession = async (plan: PaymentPlan): Promise<{ url: string }> => {
  console.log('Stripe Service: Creating session for', plan.name);
  
  // Simulation of backend call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ url: 'https://checkout.stripe.com/test-session-url' });
    }, 1500);
  });
};
