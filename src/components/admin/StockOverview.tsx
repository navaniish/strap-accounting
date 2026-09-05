import React from 'react';
import { useApp } from '../../context/AppContext';
import { Boxes, Store } from 'lucide-react';

export const StockOverview: React.FC = () => {
  const { shops, salesEntries } = useApp();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sapphire-600 font-bold text-xs uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Active Store Inventory</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">Stock & Store Overview</h1>
        </div>
        <p className="text-xs text-trust-500 max-w-sm">
          Active store branches registered in database ({shops.length} Active Shops)
        </p>
      </div>

      {/* Real Shops Grid */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-trust-900 text-base">Store Locations & Recorded Sales</h3>
          <span className="text-xs font-mono text-trust-500">{shops.length} Active Shops</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-trust-100 text-trust-700 font-bold border-b border-trust-200">
                <th className="p-3">Shop Name</th>
                <th className="p-3">Shop Code</th>
                <th className="p-3">Location</th>
                <th className="p-3">Reports Count</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total Recorded Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trust-100 font-medium">
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-trust-400">
                    No shops registered yet. Click "Shop Management" to add your first shop branch.
                  </td>
                </tr>
              ) : (
                shops.map(s => {
                  const shopSales = salesEntries.filter(e => e.shopId === s.id);
                  const totalAmt = shopSales.reduce((sum, e) => sum + e.amount, 0);

                  return (
                    <tr key={s.id} className="hover:bg-trust-50">
                      <td className="p-3 font-bold text-trust-900 flex items-center space-x-2">
                        <Store className="w-4 h-4 text-sapphire-600" />
                        <span>Shop {s.name}</span>
                      </td>
                      <td className="p-3 font-mono text-trust-600">{s.code}</td>
                      <td className="p-3 text-trust-700">{s.location}</td>
                      <td className="p-3 font-mono text-trust-800">{shopSales.length} Daily Reports</td>
                      <td className="p-3">
                        <span className="badge-growth text-[10px] px-2 py-0.5 rounded-full">
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-growth-700 font-mono">
                        ₹{totalAmt.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
