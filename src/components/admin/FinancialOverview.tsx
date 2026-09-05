import React from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FinancialOverview: React.FC = () => {
  const { currentBusiness, salesEntries, shops } = useApp();

  const totalSalesRevenue = salesEntries.reduce((sum, e) => sum + e.amount, 0);
  const approvedRevenue = salesEntries.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const pendingRevenue = salesEntries.filter(e => e.status === 'UNDER_REVIEW').reduce((sum, e) => sum + e.amount, 0);
  
  // COGS estimate (65% of sales)
  const estimatedCOGS = Math.round(totalSalesRevenue * 0.65);
  const grossProfit = totalSalesRevenue - estimatedCOGS;
  const netProfit = Math.round(grossProfit * 0.75);

  const financialStats = [
    { label: 'Total Recorded Revenue', value: `₹${totalSalesRevenue.toLocaleString('en-IN')}`, change: 'Real Data', positive: true },
    { label: 'Approved Verified Revenue', value: `₹${approvedRevenue.toLocaleString('en-IN')}`, change: 'Verified', positive: true, highlight: true },
    { label: 'Estimated COGS (65%)', value: `₹${estimatedCOGS.toLocaleString('en-IN')}`, change: 'Estimated', positive: false },
    { label: 'Estimated Gross Profit', value: `₹${grossProfit.toLocaleString('en-IN')}`, change: 'Gross Margin', positive: true },
    { label: 'Estimated Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}`, change: 'Net Margin', positive: true }
  ];

  // Dynamic Chart Data from Shops
  const shopFinancialData = shops.map(s => {
    const revenue = salesEntries.filter(e => e.shopId === s.id).reduce((sum, e) => sum + e.amount, 0);
    const profit = Math.round(revenue * 0.35);
    return {
      month: `Shop ${s.name}`,
      revenue,
      profit
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-growth-600 font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Business Financial Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">Financial Overview & Margins</h1>
        </div>
        <div className="badge-growth text-xs px-3 py-1.5 rounded-full font-bold">
          Currency: {currentBusiness.currency} INR
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {financialStats.map((stat, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${stat.highlight ? 'bg-growth-50/60 border-growth-300' : 'bg-white border-trust-200'} shadow-psychology space-y-2`}>
            <div className="text-[10px] font-bold text-trust-500 uppercase">{stat.label}</div>
            <div className="text-xl font-extrabold text-trust-900">{stat.value}</div>
            <div className="text-xs font-semibold text-growth-600 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Shop Revenue vs Profit Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
          <h3 className="font-bold text-trust-900 text-base">Real Shop Revenue vs Profit Breakdown</h3>
          <div className="h-64 w-full">
            {shopFinancialData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopFinancialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, '']} contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }} />
                  <Bar dataKey="revenue" fill="#2563EB" name="Revenue" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" fill="#059669" name="Gross Profit (Est)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-trust-400 text-xs">
                No financial data recorded yet. Submit daily sales to view financial analytics.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
          <h3 className="font-bold text-trust-900 text-base">Real Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="p-3 bg-growth-50 rounded-xl space-y-1">
              <div className="flex justify-between text-xs font-bold text-growth-800">
                <span>Verified Approved</span>
                <span className="font-mono">₹{approvedRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="p-3 bg-focus-50 rounded-xl space-y-1">
              <div className="flex justify-between text-xs font-bold text-focus-800">
                <span>Pending Approvals</span>
                <span className="font-mono">₹{pendingRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
