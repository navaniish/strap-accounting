import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Store,
  Award,
  FileCheck,
  DollarSign,
  Boxes,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const BusinessDashboard: React.FC = () => {
  const { currentBusiness, shops, salesEntries, setActiveTab } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = salesEntries.filter(e => e.date === todayStr || salesEntries.length > 0);

  // Dynamic Sales Calculations
  const todaySalesTotal = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  const approvedTotal = todayEntries.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const pendingTotal = todayEntries.filter(e => e.status === 'UNDER_REVIEW').reduce((sum, e) => sum + e.amount, 0);

  const reportedShopIds = new Set(todayEntries.map(e => e.shopId));
  const reportsCompleted = reportedShopIds.size;
  const totalShopsCount = shops.length;

  // Find Best Shop dynamically
  const shopSalesMap: { [shopName: string]: number } = {};
  todayEntries.forEach(e => {
    shopSalesMap[e.shopName] = (shopSalesMap[e.shopName] || 0) + e.amount;
  });

  let bestShopName = 'N/A';
  let bestShopSales = 0;
  Object.entries(shopSalesMap).forEach(([name, sales]) => {
    if (sales > bestShopSales) {
      bestShopSales = sales;
      bestShopName = name;
    }
  });

  // Dynamic Chart Data from Shops for Line Chart
  const chartData = shops.map((s) => {
    const total = salesEntries
      .filter(e => e.shopId === s.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: s.name,
      sales: total
    };
  });

  // Total Month Sales Sum
  const totalMonthSales = salesEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-trust-900 via-sapphire-900 to-trust-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-trust-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Operational Business Metrics</h1>
          <p className="text-trust-300 text-xs sm:text-sm mt-1">
            Real-time operational overview for <span className="font-bold text-white">{currentBusiness.name}</span> across {totalShopsCount} shops.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('verification')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center space-x-2 border border-emerald-500"
          >
            <span>Review & Approve Submissions</span>
            {salesEntries.filter(e => e.status === 'UNDER_REVIEW').length > 0 && (
              <span className="px-2 py-0.5 bg-white text-emerald-900 text-[10px] font-black rounded-full animate-bounce">
                {salesEntries.filter(e => e.status === 'UNDER_REVIEW').length} Pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="px-4 py-2.5 bg-trust-800 hover:bg-trust-700 text-white text-xs font-bold rounded-xl border border-trust-700 transition-all hidden sm:block"
          >
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Real Dynamic Summary Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

        {/* Today's Sales */}
        <div className="col-span-2 lg:col-span-2 p-4 sm:p-5 bg-white rounded-2xl border border-growth-200 shadow-psychology space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-trust-500 font-bold uppercase tracking-wider">
            <span>Today's Total Sales</span>
            <span className="p-1.5 rounded-lg bg-growth-50 text-growth-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-growth-700">₹{todaySalesTotal.toLocaleString('en-IN')}</div>
          <div className="text-xs text-trust-400 font-semibold pt-1">
            {todayEntries.length} sales reports submitted today
          </div>
        </div>

        {/* Approved Sales */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-2">
          <div className="flex items-center justify-between text-xs text-trust-500 font-bold uppercase tracking-wider">
            <span>Approved</span>
            <span className="p-1.5 rounded-lg bg-growth-50 text-growth-600"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-trust-900">₹{approvedTotal.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-trust-400">Verified by Admin</div>
        </div>

        {/* Pending Review */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-focus-200 shadow-psychology space-y-2">
          <div className="flex items-center justify-between text-xs text-trust-500 font-bold uppercase tracking-wider">
            <span>Pending</span>
            <span className="p-1.5 rounded-lg bg-focus-50 text-focus-600"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-focus-700">₹{pendingTotal.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-focus-600 font-semibold">Under review</div>
        </div>

        {/* Reports Submitted */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-2">
          <div className="flex items-center justify-between text-xs text-trust-500 font-bold uppercase tracking-wider">
            <span>Shops Reported</span>
            <span className="p-1.5 rounded-lg bg-sapphire-50 text-sapphire-600"><FileCheck className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-trust-900">{reportsCompleted} / {totalShopsCount}</div>
          <div className="text-[11px] text-trust-400">Active branches</div>
        </div>

        {/* Best Shop */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-tier-200 shadow-psychology space-y-2">
          <div className="flex items-center justify-between text-xs text-trust-500 font-bold uppercase tracking-wider">
            <span>Best Shop</span>
            <span className="p-1.5 rounded-lg bg-tier-50 text-tier-600"><Award className="w-4 h-4" /></span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-tier-900 truncate">{bestShopName}</div>
          <div className="text-[11px] text-tier-700 font-semibold">₹{bestShopSales.toLocaleString('en-IN')} sales</div>
        </div>

      </div>

      {/* Main Real Line Graph & Financial Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Left 7 cols: Real Smooth Line Graph */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-trust-900 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-sapphire-600 shrink-0" />
                <span>Sales Trend Line Graph</span>
              </h2>
              <p className="text-xs text-trust-500">Continuous sales performance curve across store outlets</p>
            </div>
            <span className="badge-growth text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-mono shrink-0 self-start sm:self-auto">Live Line Trend</span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesLineGrad)"
                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 7, fill: '#1E40AF', strokeWidth: 3, stroke: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-trust-400 text-xs text-center p-4">
                No shop sales data recorded in database yet. Add shops & submit daily sales.
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Dynamic Financial & Stock Overview */}
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3">
              <h3 className="font-bold text-trust-900 text-sm sm:text-base flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-growth-600 shrink-0" />
                <span>Financial Overview</span>
              </h3>
              <span className="text-xs text-trust-400 font-mono">Calculated</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-trust-50 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-trust-600">Total Recorded Revenue</span>
                <span className="font-extrabold text-trust-900">₹{totalMonthSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-growth-50/50 border border-growth-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-growth-800">Approved Revenue</span>
                <span className="font-extrabold text-growth-700">₹{approvedTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-focus-50/50 border border-focus-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-focus-800">Pending Approvals</span>
                <span className="font-extrabold text-focus-700">₹{pendingTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3">
              <h3 className="font-bold text-trust-900 text-sm sm:text-base flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-sapphire-600 shrink-0" />
                <span>Active Shops Overview</span>
              </h3>
              <span className="text-xs text-trust-400 font-mono">{shops.length} Active</span>
            </div>

            <div className="space-y-2">
              {shops.length === 0 ? (
                <div className="text-xs text-trust-400 text-center py-4">No shops registered yet. Click "Shop Management" to add a shop.</div>
              ) : (
                shops.map(s => {
                  const shopTotal = salesEntries.filter(e => e.shopId === s.id).reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={s.id} className="p-3 bg-trust-50 border border-trust-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-trust-900 font-sans">Shop {s.name} ({s.code})</div>
                        <div className="text-[10px] text-trust-400">{s.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-growth-700">₹{shopTotal.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-trust-500">Total Sales</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
