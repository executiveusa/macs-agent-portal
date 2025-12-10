import React, { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { paymentPlans } from '@/config/scenesConfig';
import { Check, Loader2, Zap } from 'lucide-react';

export const BillingPanel: React.FC = () => {
  const { initiatePayment, status } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(planId);
      initiatePayment(plan);
    }
  };

  return (
    <div className="bg-maxx-bg border border-gray-800 rounded-xl p-6 shadow-2xl">
       <div className="flex justify-between items-start mb-6">
         <div>
           <h3 className="text-xl font-bold text-white">Agency Treasury</h3>
           <p className="text-gray-400 text-sm">Manage subscription and crypto-credits.</p>
         </div>
         <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs font-mono">
           PLAN: FREE TIER
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentPlans.map(plan => (
            <div key={plan.id} className="border border-gray-800 bg-gray-900/50 rounded-lg p-6 hover:border-maxx-cyan transition-colors group relative">
              {plan.provider === 'bitcoin402' && (
                <div className="absolute top-0 right-0 -mt-3 -mr-3">
                   <span className="bg-orange-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">Bitcoin Only</span>
                </div>
              )}
              
              <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
              <div className="text-3xl font-black text-maxx-cyan mb-4">
                {plan.currency === 'USD' ? '$' : '⚡'}{plan.price}
                <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
              </div>
              
              <ul className="mb-6 space-y-2">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-500" /> {feat}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={status === 'loading' && selectedPlan === plan.id}
                className="w-full py-2 bg-maxx-secondary border border-gray-700 hover:bg-maxx-cyan hover:text-black hover:border-maxx-cyan transition-all text-sm font-bold uppercase rounded flex items-center justify-center gap-2"
              >
                {status === 'loading' && selectedPlan === plan.id ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                {plan.currency === 'SATS' ? 'Pay w/ Lightning' : 'Subscribe'}
              </button>
            </div>
          ))}
       </div>
    </div>
  );
};
