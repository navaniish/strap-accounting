import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Rocket, 
  CheckCircle2, 
  Building2, 
  Store, 
  Users, 
  Clock, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { currentBusiness, createNewBusiness, addShop, addStaff, shops, staffMembers, setActiveTab } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessName, setBusinessName] = useState<string>(currentBusiness.name);
  const [shopName, setShopName] = useState<string>('Main Flagship Store');
  const [staffName, setStaffName] = useState<string>('Ravi Verma');
  const [reminderTime, setReminderTime] = useState<string>('18:00');

  const steps = [
    { step: 1, title: 'Create Business', desc: 'Set up business profile & currency' },
    { step: 2, title: 'Add First Shop', desc: 'Create first retail branch or store' },
    { step: 3, title: 'Add Staff', desc: 'Invite staff or manager account' },
    { step: 4, title: 'Assign Shop', desc: 'Link staff to assigned shops' },
    { step: 5, title: 'Daily Reminder', desc: 'Set automated 6:00 PM alert' },
    { step: 6, title: 'Open Dashboard', desc: 'Ready to receive daily reports!' }
  ];

  const handleNextStep = async () => {
    if (currentStep === 1 && businessName.trim()) {
      if (businessName.trim() !== currentBusiness.name) {
        await createNewBusiness(businessName.trim());
      }
    } else if (currentStep === 2 && shopName.trim()) {
      const existingShop = shops.find(s => s.name.toLowerCase() === shopName.toLowerCase());
      if (!existingShop) {
        await addShop({
          name: shopName.trim(),
          code: `SHOP-${Date.now().toString().slice(-4)}`,
          location: 'Main Location',
          contact: '9876543210',
          status: 'ACTIVE',
          assignedStaffIds: []
        });
      }
    } else if (currentStep === 3 && staffName.trim()) {
      const existingStaff = staffMembers.find(st => st.name.toLowerCase() === staffName.toLowerCase());
      if (!existingStaff) {
        await addStaff({
          name: staffName.trim(),
          phone: '9876543210',
          email: `${staffName.toLowerCase().replace(/\s+/g, '')}@genz.com`,
          staffIdNumber: `STF${Date.now().toString().slice(-4)}`,
          password: 'Password@123',
          role: 'Staff',
          assignedShopIds: shops.map(s => s.id),
          permissions: ['sales_submit'],
          status: 'ACTIVE'
        });
      }
    }
    setCurrentStep((prev: number) => Math.min(prev + 1, 6));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-trust-900 via-sapphire-900 to-trust-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-trust-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-sapphire-600 text-white flex items-center justify-center mx-auto shadow-lg">
          <Rocket className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">GenZ Business Setup Wizard</h1>
        <p className="text-trust-300 text-xs sm:text-sm max-w-xl mx-auto">
          Set up your business workspace in simple steps so your staff can start submitting daily closing sales.
        </p>
      </div>

      {/* Step Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {steps.map(s => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-sapphire-600 text-white border-sapphire-700 shadow-md font-bold'
                  : isDone
                  ? 'bg-growth-50 text-growth-800 border-growth-200'
                  : 'bg-white text-trust-600 border-trust-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 text-xs">
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-growth-600" /> : <span>Step {s.step}</span>}
              </div>
              <div className="text-xs font-semibold mt-1 truncate">{s.title}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Step Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-trust-200 shadow-2xl space-y-6">
        
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-trust-900">Step 1: Business Profile & Workspace</h2>
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Royal Fashion Store"
                className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-sm font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Currency & Region</label>
              <input
                type="text"
                value="₹ INR (Indian Rupee)"
                disabled
                className="w-full p-3 bg-trust-100 border border-trust-200 rounded-xl text-sm font-semibold text-trust-600"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-trust-900">Step 2: Add First Shop Branch</h2>
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Main Flagship Branch"
                className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-sm font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-trust-900">Step 3: Invite Staff Member</h2>
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Staff Member Name</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-sm font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-trust-900">Step 4: Assign Staff to Shop</h2>
            <div className="p-4 bg-growth-50 border border-growth-200 text-growth-900 rounded-2xl text-xs font-bold flex items-center justify-between">
              <span>{staffName} Assigned to {shopName}</span>
              <Check className="w-5 h-5 text-growth-600" />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-trust-900">Step 5: Automated Daily Sales Reminder</h2>
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Daily Closing Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full p-3 bg-trust-50 border border-trust-300 rounded-xl text-sm font-bold text-trust-900"
              />
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-growth-100 text-growth-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-extrabold text-trust-900">Workspace Registration Complete!</h2>
            <p className="text-xs text-trust-600 max-w-md mx-auto">
              Your business workspace <strong>{businessName}</strong> is registered and ready.
            </p>
            <button
              onClick={() => {
                localStorage.setItem('has_completed_first_time_onboarding', 'true');
                setActiveTab('dashboard');
              }}
              className="px-6 py-3 bg-growth-600 hover:bg-growth-700 text-white font-bold text-xs rounded-xl shadow-growth-glow"
            >
              Open Business Dashboard Now
            </button>
          </div>
        )}

        {currentStep < 6 && (
          <div className="flex justify-between items-center pt-4 border-t border-trust-100">
            <button
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2 bg-trust-100 text-trust-700 text-xs font-bold rounded-xl disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5"
            >
              <span>Save & Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
