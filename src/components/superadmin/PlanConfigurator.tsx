import React, { useState } from 'react';
import { Layers, ShieldCheck, Check, Edit2, Save, Sparkles } from 'lucide-react';

export const PlanConfigurator: React.FC = () => {
  const [plans, setPlans] = useState([
    { id: 'STARTER', name: 'Starter Tier', price: '₹1,499 / mo', shops: 3, staff: 5, storage: '5 GB', activeSubscribers: 82 },
    { id: 'PROFESSIONAL', name: 'Professional Tier', price: '₹3,999 / mo', shops: 10, staff: 25, storage: '10 GB', activeSubscribers: 890 },
    { id: 'BUSINESS', name: 'Enterprise Tier', price: '₹8,999 / mo', shops: 50, staff: 100, storage: '50 GB', activeSubscribers: 200 },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 text-tier-600 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Platform Subscription Management</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">SaaS Plan & Tier Configuration</h1>
        </div>
        <span className="badge-tier text-xs px-3 py-1 rounded-full">Super Admin Mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => (
          <div key={p.id} className="p-6 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-trust-900 text-lg">{p.name}</h3>
                <div className="text-xl font-bold text-sapphire-700 mt-1">{p.price}</div>
              </div>
              <span className="badge-growth text-[10px] px-2 py-0.5 rounded">{p.activeSubscribers} Tenants</span>
            </div>

            <div className="space-y-2 text-xs text-trust-700 pt-2 border-t border-trust-100 font-medium">
              <div className="flex justify-between">
                <span>Max Shops:</span>
                <span className="font-bold text-trust-900">{p.shops} Shops</span>
              </div>
              <div className="flex justify-between">
                <span>Max Staff:</span>
                <span className="font-bold text-trust-900">{p.staff} Members</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Limit:</span>
                <span className="font-bold text-trust-900">{p.storage}</span>
              </div>
            </div>

            <button className="w-full py-2 bg-trust-900 hover:bg-trust-800 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Plan Pricing & Entitlements</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
