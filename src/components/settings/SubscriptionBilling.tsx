import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpRight, 
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const SubscriptionBilling: React.FC = () => {
  const { currentBusiness, checkEntitlement, updateBusinessSettings } = useApp();

  const [selectedTier, setSelectedTier] = useState<string>(currentBusiness.planTier);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState<boolean>(false);

  const shopEntitlement = checkEntitlement('shops');
  const staffEntitlement = checkEntitlement('staff');
  const storageEntitlement = checkEntitlement('storage');

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter Tier',
      price: '₹1,499 / mo',
      shops: 3,
      staff: 5,
      storage: '5 GB',
      features: ['1 Business Workspace', 'Up to 3 Shops', 'Up to 5 Staff Members', 'Daily Sales Submission', 'Basic Sales Calendar'],
      color: 'border-trust-300 bg-white'
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional Tier',
      price: '₹3,999 / mo',
      shops: 10,
      staff: 25,
      storage: '10 GB',
      popular: true,
      features: ['Up to 10 Shops', 'Up to 25 Staff Members', 'Branded PDF Reports', 'Advanced Sales Analytics', 'Financial & Stock Overviews', '10 GB Photo Storage'],
      color: 'border-sapphire-500 bg-sapphire-50/30 shadow-sapphire-glow'
    },
    {
      id: 'BUSINESS',
      name: 'Enterprise Tier',
      price: '₹8,999 / mo',
      shops: 50,
      staff: 100,
      storage: '50 GB',
      features: ['Up to 50 Shops', 'Up to 100 Staff Members', 'Custom Permission Engine', 'Priority 24/7 Support', 'Dedicated Account Manager', '50 GB Storage'],
      color: 'border-tier-500 bg-tier-50/30'
    }
  ];

  const handleUpgradePlan = (tierId: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS') => {
    const targetPlan = plans.find(p => p.id === tierId);
    if (targetPlan) {
      updateBusinessSettings({
        planTier: tierId,
        maxShops: targetPlan.shops,
        maxStaff: targetPlan.staff,
        maxStorageGb: parseInt(targetPlan.storage)
      });
      setSelectedTier(tierId);
      setShowUpgradeSuccess(true);
      setTimeout(() => setShowUpgradeSuccess(false), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-tier-600 font-bold text-xs uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>Subscription Plan Entitlements</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">SaaS Subscription & Billing</h1>
        </div>

        <div className="flex items-center space-x-2 bg-growth-50 text-growth-800 border border-growth-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-growth-600" />
          <span>Status: {currentBusiness.subscriptionStatus} ({currentBusiness.trialDaysLeft} Days Remaining)</span>
        </div>
      </div>

      {showUpgradeSuccess && (
        <div className="p-4 bg-growth-50 border border-growth-200 text-growth-800 rounded-xl flex items-center space-x-3 shadow-growth-glow">
          <CheckCircle2 className="w-6 h-6 text-growth-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">Plan Upgraded Successfully!</div>
            <div className="text-xs text-growth-700">Your new entitlements are active immediately across all shops.</div>
          </div>
        </div>
      )}

      {/* Usage Dashboard (PRD Section 46) */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
        <h2 className="font-bold text-trust-900 text-base flex items-center space-x-2">
          <Zap className="w-5 h-5 text-sapphire-600" />
          <span>Workspace Usage & Limit Metrics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Shops Progress */}
          <div className="p-4 bg-trust-50 rounded-xl border border-trust-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-trust-700">
              <span>Shops Usage</span>
              <span className="text-sapphire-600 font-mono">{shopEntitlement.current} / {shopEntitlement.max}</span>
            </div>
            <div className="w-full bg-trust-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-sapphire-600 h-full rounded-full transition-all" 
                style={{ width: `${(shopEntitlement.current / shopEntitlement.max) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-trust-400">Enforced on shop creation</p>
          </div>

          {/* Staff Progress */}
          <div className="p-4 bg-trust-50 rounded-xl border border-trust-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-trust-700">
              <span>Staff Usage</span>
              <span className="text-growth-600 font-mono">{staffEntitlement.current} / {staffEntitlement.max}</span>
            </div>
            <div className="w-full bg-trust-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-growth-600 h-full rounded-full transition-all" 
                style={{ width: `${(staffEntitlement.current / staffEntitlement.max) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-trust-400">Enforced on staff invite</p>
          </div>

          {/* Storage Progress */}
          <div className="p-4 bg-trust-50 rounded-xl border border-trust-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-trust-700">
              <span>Photo Proof Storage</span>
              <span className="text-tier-600 font-mono">{currentBusiness.usedStorageGb} GB / {currentBusiness.maxStorageGb} GB</span>
            </div>
            <div className="w-full bg-trust-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-tier-600 h-full rounded-full transition-all" 
                style={{ width: `${(currentBusiness.usedStorageGb / currentBusiness.maxStorageGb) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-trust-400">Object-storage metadata</p>
          </div>

        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = currentBusiness.planTier === plan.id;

          return (
            <div key={plan.id} className={`p-6 rounded-2xl border-2 ${plan.color} space-y-6 relative flex flex-col justify-between`}>
              
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sapphire-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-trust-900 text-xl">{plan.name}</h3>
                  <div className="text-2xl font-extrabold text-sapphire-700 mt-2">{plan.price}</div>
                </div>

                <div className="space-y-2 pt-2 border-t border-trust-200/60">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-trust-700 font-medium">
                      <Check className="w-4 h-4 text-growth-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                {isCurrent ? (
                  <button disabled className="w-full py-3 bg-growth-600 text-white font-bold text-xs rounded-xl cursor-default">
                    Current Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgradePlan(plan.id as any)}
                    className="w-full py-3 bg-trust-900 hover:bg-trust-800 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Select & Switch to {plan.name}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
