import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, UserCheck, Receipt, Store } from 'lucide-react';

export const StaffAssignedShopsView: React.FC = () => {
  const { shops, staffMembers, currentUser, setActiveTab } = useApp();

  const userIdentifier = (currentUser?.staffIdNumber || currentUser?.email || '').toLowerCase().trim();
  const numTarget = userIdentifier.replace(/\D/g, '');

  const currentStaff = staffMembers.find(m => {
    const mPhoneClean = (m.phone || '').replace(/\D/g, '');
    const mIdClean = (m.staffIdNumber || '').replace(/\D/g, '');
    const mEmailClean = (m.email || '').toLowerCase().trim();

    const phoneMatch = numTarget.length >= 4 && (mPhoneClean === numTarget || mIdClean === numTarget);
    const emailMatch = mEmailClean.length > 0 && mEmailClean === userIdentifier;
    return phoneMatch || emailMatch;
  }) || (currentUser as any);

  const assignedShops = (() => {
    if (!currentStaff || !(currentStaff as any).assignedShopIds || (currentStaff as any).assignedShopIds.length === 0) {
      return shops;
    }
    const filtered = shops.filter(s => (currentStaff as any).assignedShopIds?.includes(s.id));
    return filtered.length > 0 ? filtered : shops;
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-trust-900">My Assigned Shops</h1>
          <p className="text-xs text-trust-500 mt-1">
            Shops authorized for daily sales reporting under <span className="font-bold text-trust-900">{currentStaff?.name || 'Staff Account'}</span>
          </p>
        </div>

        <button
          onClick={() => setActiveTab('daily-sales')}
          className="px-4 py-2.5 bg-growth-600 hover:bg-growth-700 text-white text-xs font-bold rounded-xl shadow-growth-glow transition-all flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Receipt className="w-4 h-4" />
          <span>Submit Daily Sales</span>
        </button>
      </div>

      {assignedShops.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-dashed border-trust-300 text-center space-y-3">
          <Store className="w-10 h-10 text-trust-300 mx-auto" />
          <h3 className="font-extrabold text-trust-800 text-sm">No Store Outlets Available Yet</h3>
          <p className="text-xs text-trust-400 max-w-sm mx-auto">
            Please ask your Business Admin to add your store branch outlet in Store Management.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {assignedShops.map(shop => {
            const shopCodeStr = (shop.code || 'MAIN').toString();
            const shopNameStr = (shop.name || 'Store Branch').toString();
            const locationStr = (shop.location || 'Store Branch Location').toString();
            const contactStr = (shop.contact || 'No contact phone specified').toString();

            return (
              <div key={shop.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-sapphire-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md">
                        {shopCodeStr.substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-trust-900 text-base">{shopNameStr}</h3>
                        <p className="text-xs text-trust-500 font-mono">Code: {shopCodeStr}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-trust-600 pt-3 border-t border-trust-100">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-trust-400 shrink-0" />
                      <span className="font-medium text-trust-700">{locationStr}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-trust-400 shrink-0" />
                      <span className="font-mono text-trust-700">{contactStr}</span>
                    </div>
                  </div>

                </div>

                <div className="pt-3 border-t border-trust-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-growth-700 font-bold flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-growth-600" /> Authorized for Sales Reporting
                  </span>
                  <button
                    onClick={() => setActiveTab('daily-sales')}
                    className="w-full sm:w-auto px-4 py-2 bg-growth-600 hover:bg-growth-700 text-white text-xs font-bold rounded-xl shadow-growth-glow transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Submit Sales</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
