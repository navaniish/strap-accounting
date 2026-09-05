import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesEntry } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Store,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  User,
  ArrowLeft,
  ChevronRight as BreadcrumbArrow,
  MoveHorizontal
} from 'lucide-react';

export const SalesCalendar: React.FC = () => {
  const { salesEntries, shops, staffMembers, setActiveTab } = useApp();

  type ZoomLevel = 'YEAR' | 'MONTH' | 'DAY' | 'SHOP_DETAIL';

  const todayDate = new Date();
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('MONTH');
  const [selectedYear, setSelectedYear] = useState<number>(todayDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(todayDate.getMonth()); // Dynamic real-time current month (e.g. Sept = 8, Oct = 9)
  const [selectedDay, setSelectedDay] = useState<number>(todayDate.getDate());
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [mobileZoomPercent, setMobileZoomPercent] = useState<number>(125);
  const [mobileViewMode, setMobileViewMode] = useState<'GRID' | 'AGENDA'>('GRID');
  const [activeDetailShopId, setActiveDetailShopId] = useState<string>(shops[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [inspectPhotoEntry, setInspectPhotoEntry] = useState<DailySalesEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Zoom Transition Handler
  const triggerZoomTransition = (nextLevel: ZoomLevel, callback?: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (callback) callback();
      setZoomLevel(nextLevel);
      setIsTransitioning(false);
    }, 200);
  };

  const handleZoomOut = () => {
    if (mobileZoomPercent > 100) {
      setMobileZoomPercent(prev => Math.max(100, prev - 25));
    } else if (zoomLevel === 'SHOP_DETAIL') triggerZoomTransition('DAY');
    else if (zoomLevel === 'DAY') triggerZoomTransition('MONTH');
    else if (zoomLevel === 'MONTH') triggerZoomTransition('YEAR');
  };

  const handleZoomIn = () => {
    if (mobileZoomPercent < 200) {
      setMobileZoomPercent(prev => Math.min(200, prev + 25));
    } else if (zoomLevel === 'YEAR') triggerZoomTransition('MONTH');
    else if (zoomLevel === 'MONTH') triggerZoomTransition('DAY');
    else if (zoomLevel === 'DAY') triggerZoomTransition('SHOP_DETAIL');
  };

  const handleResetZoom = () => {
    setMobileZoomPercent(125);
    const now = new Date();
    triggerZoomTransition('MONTH', () => {
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth());
      setSelectedDay(now.getDate());
    });
  };

  // Touch Gesture & Wheel Listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else if (e.deltaY > 0) handleZoomOut();
      }
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel]);

  // Formatters
  const fmtMoney = (num: number) => `₹${num.toLocaleString('en-IN')}`;
  const fmtK = (num: number) => num >= 1000 ? `₹${(num / 1000).toFixed(1)}K` : `₹${num}`;

  // Entry Filter Helper
  const filterEntry = (e: DailySalesEntry) => {
    const isShop = selectedShopId === 'ALL' || e.shopId === selectedShopId;
    const isStaff = selectedStaffId === 'ALL' || e.staffId === selectedStaffId;
    const isStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
    return isShop && isStaff && isStatus;
  };

  // 1. Year Months Data computed dynamically from salesEntries
  const yearlyMonths = monthNames.map((name, idx) => {
    const monthSales = salesEntries.filter(e => {
      if (!filterEntry(e)) return false;
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === idx;
    });

    const salesTotal = monthSales.reduce((sum, e) => sum + e.amount, 0);
    const reportsCount = monthSales.length;

    return {
      monthIdx: idx,
      name,
      sales: salesTotal,
      reports: `${reportsCount} reports`,
      isCurrent: idx === selectedMonth
    };
  });

  const totalYearSales = yearlyMonths.reduce((sum, m) => sum + m.sales, 0);

  // 2. Day Entries for selected day
  const formattedDayStr = `${selectedYear}-${selectedMonth + 1 < 10 ? '0' + (selectedMonth + 1) : selectedMonth + 1}-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`;
  const activeDayEntries = salesEntries.filter(e => e.date === formattedDayStr && filterEntry(e));
  const activeDayTotal = activeDayEntries.reduce((sum, e) => sum + e.amount, 0);

  // 3. Best Day & Best Month dynamically
  let bestDayStr = 'N/A';
  let bestDaySales = 0;
  const daySalesMap: { [d: string]: number } = {};
  salesEntries.filter(filterEntry).forEach(e => {
    daySalesMap[e.date] = (daySalesMap[e.date] || 0) + e.amount;
  });
  Object.entries(daySalesMap).forEach(([d, sales]) => {
    if (sales > bestDaySales) {
      bestDaySales = sales;
      bestDayStr = d;
    }
  });

  let bestMonthName = 'N/A';
  let bestMonthSales = 0;
  yearlyMonths.forEach(m => {
    if (m.sales > bestMonthSales) {
      bestMonthSales = m.sales;
      bestMonthName = m.name;
    }
  });

  const uniqueDaysCount = Object.keys(daySalesMap).length || 1;
  const avgDailySales = totalYearSales > 0 ? totalYearSales / uniqueDaysCount : 0;

  // Active Detail Shop
  const activeDetailShop = shops.find(s => s.id === activeDetailShopId) || shops[0] || { id: 'shop_default', name: 'Default Shop', code: 'SHP-01', location: 'Main' };
  const activeDetailEntry = salesEntries.find(e => e.shopId === activeDetailShopId && e.date === formattedDayStr) || activeDayEntries[0] || {
    id: 'empty',
    shopName: activeDetailShop.name,
    staffName: 'Staff Member',
    amount: 0,
    salesImageUrl: '',
    status: 'UNDER_REVIEW'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans">

      {/* RESPONSIVE CONTROL HEADER */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-trust-300 shadow-psychology space-y-4">

        {(shops.length === 0 || salesEntries.length === 0) && (
          <div className="p-4 bg-sapphire-50 border border-sapphire-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-extrabold text-sapphire-900 text-sm">Welcome to Interactive Sales Grid</div>
              <div className="text-sapphire-700">Add shops or submit daily sales reports to view live metrics on the calendar grid.</div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('shops')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-sapphire-600 text-white rounded-xl font-extrabold shadow-xs hover:bg-sapphire-700 text-center"
              >
                + Add Shop
              </button>
              <button
                onClick={() => setActiveTab('daily-sales')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-growth-600 text-white rounded-xl font-extrabold shadow-xs hover:bg-growth-700 text-center"
              >
                + Submit Sales
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sapphire-600 font-bold text-xs uppercase tracking-wider">
              <CalendarIcon className="w-4 h-4" />
              <span>Sales Matrix Grid Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-trust-900 mt-0.5">Interactive Sales Grid</h1>
          </div>

          {/* Filter Selectors Grid for Mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full sm:w-auto px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value={2026}>2026 ▼</option>
              <option value={2025}>2025 ▼</option>
            </select>

            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value="ALL">All Shops ({shops.length}) ▼</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>Shop {s.name}</option>
              ))}
            </select>

            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value="ALL">All Staff ({staffMembers.length}) ▼</option>
              {staffMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value="ALL">All Status ▼</option>
              <option value="APPROVED">Approved Only</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORRECTION_REQUIRED">Correction Needed</option>
            </select>

            {/* Mobile & Desktop Zoom Controls Bar */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-1.5 bg-trust-100 p-1 rounded-xl border border-trust-300 sm:ml-auto">
              <span className="text-[10px] font-extrabold text-trust-500 uppercase px-1 hidden sm:inline">Zoom:</span>

              {[100, 125, 150, 175, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setMobileZoomPercent(pct)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${mobileZoomPercent === pct
                      ? 'bg-sapphire-600 text-white shadow-xs'
                      : 'text-trust-700 hover:bg-white'
                    }`}
                >
                  {pct}%
                </button>
              ))}

              <div className="h-4 w-px bg-trust-300 mx-0.5" />

              <button
                onClick={handleZoomOut}
                disabled={zoomLevel === 'YEAR'}
                className="p-1 rounded-lg text-trust-700 hover:bg-white disabled:opacity-40"
                title="Zoom Out Matrix"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel === 'SHOP_DETAIL'}
                className="p-1 rounded-lg text-trust-700 hover:bg-white disabled:opacity-40"
                title="Zoom In Matrix"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Mobile Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-3 border-t border-trust-200">
          <div className="p-2.5 sm:p-3 bg-growth-50/60 border border-growth-200 rounded-xl">
            <div className="text-[10px] font-bold text-growth-700 uppercase">Total Sales</div>
            <div className="text-base sm:text-lg font-extrabold text-growth-800">{fmtMoney(totalYearSales)}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-sapphire-50/60 border border-sapphire-200 rounded-xl">
            <div className="text-[10px] font-bold text-sapphire-700 uppercase">Best Month</div>
            <div className="text-base sm:text-lg font-extrabold text-sapphire-900 truncate">{bestMonthName} ({fmtMoney(bestMonthSales)})</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-tier-50/60 border border-tier-200 rounded-xl">
            <div className="text-[10px] font-bold text-tier-700 uppercase">Best Day</div>
            <div className="text-base sm:text-lg font-extrabold text-tier-900 truncate">{bestDayStr !== 'N/A' ? `${bestDayStr}` : 'No Sales Yet'}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-trust-50 border border-trust-200 rounded-xl">
            <div className="text-[10px] font-bold text-trust-500 uppercase">Avg Daily Sales</div>
            <div className="text-base sm:text-lg font-extrabold text-trust-900">{fmtMoney(Math.round(avgDailySales))} / d</div>
          </div>
        </div>

        {/* Responsive Breadcrumb Bar */}
        <div className="flex items-center space-x-2 text-xs font-bold pt-2 border-t border-trust-200 overflow-x-auto pb-1">
          <span className="text-trust-400 shrink-0">Grid Depth:</span>

          <button
            onClick={() => triggerZoomTransition('YEAR')}
            className={`shrink-0 hover:underline ${zoomLevel === 'YEAR' ? 'text-sapphire-600 font-extrabold' : 'text-trust-600'}`}
          >
            Matrix
          </button>

          <BreadcrumbArrow className="w-3.5 h-3.5 text-trust-300 shrink-0" />

          <button
            onClick={() => triggerZoomTransition('YEAR')}
            className={`shrink-0 hover:underline ${zoomLevel === 'YEAR' ? 'text-sapphire-600 font-extrabold' : 'text-trust-600'}`}
          >
            {selectedYear}
          </button>

          {(zoomLevel === 'MONTH' || zoomLevel === 'DAY' || zoomLevel === 'SHOP_DETAIL') && (
            <>
              <BreadcrumbArrow className="w-3.5 h-3.5 text-trust-300 shrink-0" />
              <button
                onClick={() => triggerZoomTransition('MONTH')}
                className={`shrink-0 hover:underline ${zoomLevel === 'MONTH' ? 'text-sapphire-600 font-extrabold' : 'text-trust-600'}`}
              >
                {monthNames[selectedMonth]}
              </button>
            </>
          )}

          {(zoomLevel === 'DAY' || zoomLevel === 'SHOP_DETAIL') && (
            <>
              <BreadcrumbArrow className="w-3.5 h-3.5 text-trust-300 shrink-0" />
              <button
                onClick={() => triggerZoomTransition('DAY')}
                className={`shrink-0 hover:underline ${zoomLevel === 'DAY' ? 'text-sapphire-600 font-extrabold' : 'text-trust-600'}`}
              >
                {selectedDay} {monthNames[selectedMonth]}
              </button>
            </>
          )}

          {zoomLevel === 'SHOP_DETAIL' && (
            <>
              <BreadcrumbArrow className="w-3.5 h-3.5 text-trust-300 shrink-0" />
              <span className="text-sapphire-600 font-extrabold shrink-0">Shop {activeDetailShop.name}</span>
            </>
          )}

          {zoomLevel !== 'YEAR' && (
            <button
              onClick={handleZoomOut}
              className="ml-auto text-[11px] font-semibold text-sapphire-600 hover:text-sapphire-800 flex items-center gap-1 bg-sapphire-50 border border-sapphire-200 px-2 py-0.5 rounded-lg shrink-0"
            >
              <ArrowLeft className="w-3 h-3" /> Zoom Out
            </button>
          )}
        </div>

      </div>

      {/* MATRIX GRID WORKSPACE */}
      <div
        ref={containerRef}
        className={`transition-all duration-200 ${isTransitioning ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
          }`}
      >

        {/* LEVEL 1 — YEAR MATRIX GRID */}
        {zoomLevel === 'YEAR' && (
          <div className="bg-white rounded-2xl border-2 border-trust-300 shadow-psychology overflow-hidden">
            <div className="p-4 bg-trust-900 text-white flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold">{selectedYear} Sales Matrix</h2>
              <span className="badge-growth text-xs px-3 py-1 rounded-full">YTD Total: {fmtMoney(totalYearSales)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-trust-300">
              {yearlyMonths.map(m => (
                <div
                  key={m.monthIdx}
                  onClick={() => {
                    setSelectedMonth(m.monthIdx);
                    triggerZoomTransition('MONTH');
                  }}
                  className={`p-5 sm:p-6 border-b border-r border-trust-300 cursor-pointer transition-colors space-y-3 hover:bg-sapphire-50/70 group ${m.isCurrent ? 'bg-growth-50/50' : 'bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between border-b border-trust-200 pb-2">
                    <span className="font-extrabold text-trust-900 text-base group-hover:text-sapphire-800">
                      {m.name.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-trust">
                      {m.sales > 0 ? 'Active' : 'No Data'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-trust-500 uppercase">Monthly Sales</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-growth-700 mt-0.5 font-mono">
                      {fmtMoney(m.sales)}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-trust-600">
                    <div className="flex justify-between font-mono">
                      <span>Submissions:</span>
                      <span className="font-bold text-trust-900">{m.reports}</span>
                    </div>
                  </div>

                  <div className="pt-1 text-right">
                    <span className="text-[11px] font-bold text-sapphire-600 group-hover:underline">
                      Zoom Month Grid &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEVEL 2 — MONTH MATRIX GRID (Responsive Scroll Wrapper for Mobile Panning) */}
        {zoomLevel === 'MONTH' && (
          <div className="bg-white rounded-2xl border-2 border-trust-300 shadow-psychology overflow-hidden space-y-2">

            <div className="p-4 bg-trust-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-trust-300">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(prev => prev - 1);
                    } else {
                      setSelectedMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1.5 rounded bg-trust-800 hover:bg-trust-700 text-white"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold">
                  {monthNames[selectedMonth].toUpperCase()} {selectedYear} MATRIX
                </h2>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(prev => prev + 1);
                    } else {
                      setSelectedMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1.5 rounded bg-trust-800 hover:bg-trust-700 text-white"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile View Mode Switcher (Grid vs Agenda List) */}
              <div className="flex items-center gap-1 bg-trust-800 p-1 rounded-xl border border-trust-700 w-full sm:w-auto">
                <button
                  onClick={() => setMobileViewMode('GRID')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${mobileViewMode === 'GRID' ? 'bg-sapphire-600 text-white shadow-xs' : 'text-trust-300 hover:text-white'
                    }`}
                >
                  7-Col Grid
                </button>
                <button
                  onClick={() => setMobileViewMode('AGENDA')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${mobileViewMode === 'AGENDA' ? 'bg-sapphire-600 text-white shadow-xs' : 'text-trust-300 hover:text-white'
                    }`}
                >
                  Daily Feed
                </button>
              </div>
            </div>

            {/* View Mode 1: 7-Column Grid Matrix */}
            {mobileViewMode === 'GRID' ? (
              <>
                {/* Mobile Touch Swipe Indicator Banner */}
                <div className="md:hidden px-4 py-1.5 bg-trust-100 text-trust-600 text-[11px] font-semibold flex items-center justify-between border-b border-trust-200">
                  <span className="flex items-center gap-1"><MoveHorizontal className="w-3.5 h-3.5 text-sapphire-600" /> Swipe horizontally or adjust zoom %</span>
                  <span className="font-bold text-sapphire-700">{mobileZoomPercent}% Zoom</span>
                </div>

                {/* Horizontal Scrollable Container for Mobile 7-Column Matrix */}
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${Math.round(600 * (mobileZoomPercent / 100))}px` }}>

                    {/* 7-Column Day Header Row */}
                    <div className="grid grid-cols-7 bg-trust-100 border-b border-trust-300 text-center font-bold text-xs text-trust-700 uppercase py-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="border-r border-trust-300 last:border-r-0">{d}</div>
                      ))}
                    </div>

                    {/* 31 Day Cells in Matrix Lines */}
                    <div className="grid grid-cols-7 border-b border-trust-300">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                        const dateStr = `${selectedYear}-${selectedMonth + 1 < 10 ? '0' + (selectedMonth + 1) : selectedMonth + 1}-${day < 10 ? '0' + day : day}`;
                        const cellEntries = salesEntries.filter(e => e.date === dateStr && filterEntry(e));
                        const daySalesAmount = cellEntries.reduce((s, e) => s + e.amount, 0);
                        const isSelectedDay = day === selectedDay;

                        const bgGrade =
                          daySalesAmount > 50000 ? 'bg-growth-600 text-white font-extrabold' :
                            daySalesAmount > 20000 ? 'bg-growth-50 text-growth-900 hover:bg-growth-100' :
                              daySalesAmount > 0 ? 'bg-sapphire-50/50 text-sapphire-900 hover:bg-sapphire-100/60' :
                                'bg-white text-trust-800 hover:bg-trust-100/60';

                        const calcMinH = Math.round(85 * (mobileZoomPercent / 100));

                        return (
                          <div
                            key={day}
                            onClick={() => {
                              setSelectedDay(day);
                              triggerZoomTransition('DAY');
                            }}
                            style={{ minHeight: `${calcMinH}px` }}
                            className={`p-2.5 sm:p-3 border-r border-b border-trust-300 flex flex-col justify-between cursor-pointer transition-all ${bgGrade} ${isSelectedDay ? 'ring-2 ring-inset ring-sapphire-600' : ''
                              }`}
                          >
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span>Day {day}</span>
                              {cellEntries.length > 0 && <span className="w-2 h-2 rounded-full bg-growth-500" />}
                            </div>

                            <div>
                              <div className="text-sm sm:text-base font-extrabold font-mono">
                                {fmtK(daySalesAmount)}
                              </div>
                              <div className="text-[10px] opacity-80 mt-0.5">
                                {cellEntries.length} Reports
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* View Mode 2: Mobile Native Agenda / Daily Feed */
              <div className="p-4 space-y-3">
                <div className="text-xs font-extrabold text-trust-500 uppercase tracking-wider">
                  {monthNames[selectedMonth]} {selectedYear} Daily Sales Feed ({salesEntries.length} Total Reports)
                </div>

                <div className="space-y-2.5">
                  {Array.from({ length: 31 }, (_, i) => 31 - i).map(day => {
                    const dateStr = `${selectedYear}-${selectedMonth + 1 < 10 ? '0' + (selectedMonth + 1) : selectedMonth + 1}-${day < 10 ? '0' + day : day}`;
                    const dayEntries = salesEntries.filter(e => e.date === dateStr && filterEntry(e));
                    const totalDaySales = dayEntries.reduce((sum, e) => sum + e.amount, 0);

                    if (dayEntries.length === 0) return null;

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          setSelectedDay(day);
                          triggerZoomTransition('DAY');
                        }}
                        className="p-3.5 bg-trust-50 border border-trust-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-sapphire-50/70 transition-all shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-trust-900 text-sm">{day} {monthNames[selectedMonth]}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-growth-100 text-growth-800">
                              {dayEntries.length} Report{dayEntries.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-trust-600 font-medium">
                            Shops: {dayEntries.map(e => e.shopName).join(', ')}
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className="text-base font-extrabold text-growth-700 font-mono">
                            {fmtMoney(totalDaySales)}
                          </div>
                          <div className="text-[11px] font-bold text-sapphire-600">
                            Inspect →
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* LEVEL 3 — DAY MATRIX GRID */}
        {zoomLevel === 'DAY' && (
          <div className="bg-white rounded-2xl border-2 border-trust-300 shadow-psychology overflow-hidden">

            <div className="p-4 bg-trust-900 text-white flex items-center justify-between border-b border-trust-300">
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {selectedDay} {monthNames[selectedMonth]} {selectedYear} SHOP MATRIX
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-trust-300">Day Total: </span>
                <span className="text-base sm:text-lg font-extrabold text-growth-400">{fmtMoney(activeDayTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-trust-300">
              {shops.length === 0 ? (
                <div className="p-8 text-center text-trust-400 text-xs col-span-4">No shops registered yet.</div>
              ) : (
                shops.map(s => {
                  const shopDayEntries = activeDayEntries.filter(e => e.shopId === s.id);
                  const shopDayTotal = shopDayEntries.reduce((sum, e) => sum + e.amount, 0);

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveDetailShopId(s.id);
                        triggerZoomTransition('SHOP_DETAIL');
                      }}
                      className="p-5 sm:p-6 border-b sm:border-b-0 border-r border-trust-300 cursor-pointer transition-colors space-y-4 hover:bg-sapphire-50/70 bg-white group"
                    >
                      <div className="flex items-center justify-between border-b border-trust-200 pb-2">
                        <div className="flex items-center space-x-2">
                          <Store className="w-4 h-4 text-sapphire-600" />
                          <span className="font-extrabold text-trust-900 text-base group-hover:text-sapphire-800">
                            SHOP {s.name.toUpperCase()}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${shopDayEntries.length > 0 ? 'badge-growth' : 'badge-trust'
                          }`}>
                          {shopDayEntries.length > 0 ? shopDayEntries[0].status.replace('_', ' ') : 'No Report'}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs text-trust-500 font-bold uppercase">Day Sales Total</div>
                        <div className="text-xl sm:text-2xl font-extrabold text-growth-700 mt-1 font-mono">
                          {fmtMoney(shopDayTotal)}
                        </div>
                      </div>

                      <div className="text-xs text-trust-600 space-y-1 font-medium">
                        <div>Staff: <strong>{shopDayEntries[0]?.staffName || 'Staff Member'}</strong></div>
                      </div>

                      <div className="pt-2 text-right border-t border-trust-200">
                        <span className="text-[11px] font-bold text-sapphire-600 group-hover:underline">
                          Zoom Shop Detail &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* LEVEL 4 — SHOP DETAIL MATRIX VIEW */}
        {zoomLevel === 'SHOP_DETAIL' && (
          <div className="bg-white rounded-2xl border-2 border-trust-300 shadow-psychology overflow-hidden">

            <div className="p-4 sm:p-5 bg-trust-900 text-white flex items-center justify-between border-b border-trust-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sapphire-600 text-white flex items-center justify-center font-extrabold text-base">
                  {activeDetailShop.code?.substring(0, 3) || 'SHP'}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Shop {activeDetailShop.name} Detail Grid</h2>
                  <p className="text-xs text-trust-300">{activeDetailShop.location} • {selectedDay} {monthNames[selectedMonth]} {selectedYear}</p>
                </div>
              </div>
              <span className="badge-growth text-xs px-3 py-1 rounded-full font-bold">
                {activeDetailEntry?.status ? activeDetailEntry.status.replace('_', ' ') : 'No Data'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-trust-300">

              <div className="lg:col-span-6 p-5 sm:p-6 space-y-6">
                <div className="p-4 bg-trust-50 rounded-xl border border-trust-300 space-y-1">
                  <div className="text-xs font-bold text-trust-500 uppercase">Closing Sales Total</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-growth-700 font-mono">
                    {fmtMoney(activeDetailEntry?.amount || 0)}
                  </div>
                  <div className="text-xs text-trust-600 mt-1">Staff: <strong>{activeDetailEntry?.staffName || 'N/A'}</strong></div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="font-bold text-trust-900 uppercase font-sans">Audit Details</div>
                  <div className="p-3 bg-trust-50 border border-trust-300 rounded-xl space-y-1.5 text-trust-700">
                    <div className="flex justify-between"><span>Submitted:</span><span>{activeDetailEntry?.createdAt || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Verified:</span><span>{activeDetailEntry?.reviewTimestamp || 'Pending'}</span></div>
                    <div className="flex justify-between"><span>Receipt File:</span><span>{activeDetailEntry?.imageFileName || 'None'}</span></div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 p-5 sm:p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase text-trust-900">Receipt Photo Proof</span>
                  {activeDetailEntry?.salesImageUrl && (
                    <button onClick={() => setInspectPhotoEntry(activeDetailEntry)} className="text-xs font-bold text-sapphire-600 hover:underline">
                      Zoom Photo Modal
                    </button>
                  )}
                </div>
                <div className="border border-trust-300 rounded-xl overflow-hidden shadow-sm flex items-center justify-center min-h-[220px] bg-trust-50">
                  {activeDetailEntry?.salesImageUrl ? (
                    <img src={activeDetailEntry.salesImageUrl} alt="Proof" className="w-full h-60 object-cover" />
                  ) : (
                    <div className="text-xs text-trust-400 p-6 text-center">No photo proof attached for this record.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Inspect Photo Modal */}
      {inspectPhotoEntry && inspectPhotoEntry.salesImageUrl && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-trust-300">
            <div className="p-4 bg-trust-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold">Photo Proof — Shop {inspectPhotoEntry.shopName}</h3>
                <p className="text-xs text-trust-300">{inspectPhotoEntry.date} • ₹{inspectPhotoEntry.amount.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setInspectPhotoEntry(null)} className="p-1 rounded bg-trust-800 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-trust-950 flex justify-center">
              <img src={inspectPhotoEntry.salesImageUrl} alt="Proof" className="max-h-[65vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
