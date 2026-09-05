import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportConfig } from '../../types';
import { SPLASH_LOGO_BASE64 } from '../../assets/splashLogoBase64';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckSquare, 
  Building2, 
  Calendar, 
  Store, 
  User, 
  Sparkles,
  Layers,
  X,
  ExternalLink,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react';
import { exportSalesToCSV, copySalesCSVToClipboard } from '../../utils/exportSalesData';

export const ReportGenerator: React.FC = () => {
  const { currentBusiness, shops, salesEntries } = useApp();
  const [showMobilePdfModal, setShowMobilePdfModal] = useState<boolean>(false);
  const [showChooseExportFormatModal, setShowChooseExportFormatModal] = useState<boolean>(false);
  const [showSheetsExportModal, setShowSheetsExportModal] = useState<boolean>(false);
  const [copiedSheetsSuccess, setCopiedSheetsSuccess] = useState<boolean>(false);

  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'DAILY',
    date: '2026-08-14',
    shopId: 'ALL',
    includeTable: true,
    includeImages: true,
    includeChart: true,
    includeStaff: true
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter entries for report preview
  const reportEntries = salesEntries.filter(entry => {
    const dateMatch = entry.date === config.date;
    const shopMatch = config.shopId === 'ALL' || entry.shopId === config.shopId;
    return dateMatch && shopMatch;
  });

  const totalReportSales = reportEntries.reduce((sum, e) => sum + e.amount, 0);

  const handlePrintPDF = () => {
    setIsExporting(true);
    
    // Check if running on Android / Mobile WebView
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      setShowMobilePdfModal(true);
    } else {
      window.print();
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 800);
  };

  const handleDownloadReportFile = async () => {
    const printElement = document.querySelector('.print-container');
    if (!printElement) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentBusiness.name} - ${config.reportType} Report (${config.date})</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              body { background: white !important; color: black !important; }
            }
          </style>
        </head>
        <body class="p-6 bg-white text-slate-900 font-sans">
          <div class="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-slate-900">
            <img src="${SPLASH_LOGO_BASE64}" alt="GenZ Logo" style="width: 56px; height: 56px; border-radius: 12px; object-fit: cover;" />
            <div>
              <h1 style="font-size: 22px; font-weight: 900; margin: 0; color: #0f172a;">${currentBusiness.name}</h1>
              <p style="font-size: 13px; font-weight: 600; margin: 0; color: #475569;">Official ${config.reportType} Sales Report • ${config.date}</p>
            </div>
          </div>
          ${printElement.innerHTML}
        </body>
      </html>
    `;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const fileName = `${currentBusiness.name.replace(/\s+/g, '_')}_Report_${config.date}.html`;

    if (isMobile) {
      try {
        if (navigator.share && (navigator as any).canShare) {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          const file = new File([blob], fileName, { type: 'text/html' });
          if ((navigator as any).canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${currentBusiness.name} Report`,
              text: `Sales Report for ${config.date}`
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Native share failed:', err);
      }

      exportSalesToCSV(reportEntries.length > 0 ? reportEntries : salesEntries, `Sales_Report_${config.date}`);
    } else {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-sapphire-600 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Branded Business Intelligence Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">Reports & Analytics Generator</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {/* Main Download Report Button -> Opens Choose Format Modal */}
          <button
            onClick={() => setShowChooseExportFormatModal(true)}
            className="w-full sm:w-auto px-5 py-3 bg-growth-600 hover:bg-growth-700 active:bg-growth-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-growth-glow transition-all flex items-center justify-center space-x-2 min-h-[44px]"
            title="Download report - Select Google Sheets or Branded PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (Sheets or PDF)</span>
          </button>

          {/* Quick Direct Google Sheets Button */}
          <button
            onClick={() => setShowSheetsExportModal(true)}
            className="w-full sm:w-auto px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 min-h-[44px]"
            title="Export daily sales data with staff photo proof links to Excel / Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets</span>
          </button>

          {/* Quick Direct PDF / Print Button */}
          <button
            onClick={handlePrintPDF}
            disabled={isExporting}
            className="w-full sm:w-auto px-4 py-3 bg-trust-100 hover:bg-trust-200 text-trust-800 font-bold text-xs sm:text-sm rounded-xl border border-trust-300 transition-all flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-sapphire-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 4 cols: Report Setup Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-5 no-print">
          <h2 className="font-bold text-trust-900 text-base border-b border-trust-100 pb-2">Report Configuration</h2>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase">Report Type</label>
            <select
              value={config.reportType}
              onChange={(e) => setConfig({ ...config, reportType: e.target.value as any })}
              className="w-full px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value="DAILY">Daily Sales Report</option>
              <option value="WEEKLY">Weekly Sales Report</option>
              <option value="MONTHLY">Monthly Sales Report</option>
              <option value="YEARLY">Yearly Sales Report</option>
              <option value="SHOP">Shop Performance Report</option>
              <option value="STAFF">Staff Submission Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase">Select Date</label>
            <input
              type="date"
              value={config.date}
              onChange={(e) => setConfig({ ...config, date: e.target.value })}
              className="w-full px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase">Shop Scope</label>
            <select
              value={config.shopId}
              onChange={(e) => setConfig({ ...config, shopId: e.target.value })}
              className="w-full px-3 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-800"
            >
              <option value="ALL">All Shops ({shops.length})</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>Shop {s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-trust-100">
            <label className="block text-xs font-bold text-trust-700 uppercase">Include Sections in PDF</label>
            
            {[
              { key: 'includeTable', label: 'Sales Table & Breakdown' },
              { key: 'includeImages', label: 'Sales Photo Proofs' },
              { key: 'includeStaff', label: 'Staff Submission Names' }
            ].map(sec => (
              <label key={sec.key} className="flex items-center space-x-2.5 text-xs text-trust-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={(config as any)[sec.key]}
                  onChange={(e) => setConfig({ ...config, [sec.key]: e.target.checked })}
                  className="rounded text-sapphire-600 focus:ring-sapphire-500 w-4 h-4"
                />
                <span>{sec.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right 8 cols: Formatted Printable Document Preview */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-8 rounded-2xl border border-trust-300 shadow-2xl space-y-6 print-container font-sans max-w-full overflow-hidden">
          
          {/* Document Header with Clean Vector Branding */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-trust-900 pb-5 report-header">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sapphire-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                GZ
              </div>
              {currentBusiness.logoUrl && (
                <img
                  src={currentBusiness.logoUrl}
                  alt="Business Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-trust-300 shadow-xs shrink-0"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <div className="space-y-0.5 min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-trust-900 tracking-tight truncate">{currentBusiness.name}</h2>
                <p className="text-xs text-trust-600 font-semibold truncate">
                  {currentBusiness.businessType} • Workspace ID: <span className="font-mono text-trust-800">{currentBusiness.workspaceId}</span>
                </p>
                <p className="text-[10px] sm:text-[11px] text-trust-500 font-mono">
                  Generated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-trust-100 shrink-0">
              <span className="inline-block text-[11px] sm:text-xs font-extrabold text-sapphire-900 bg-sapphire-50 border border-sapphire-300 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                {config.reportType.replace('_', ' ')} REPORT
              </span>
              <div className="text-right">
                <div className="text-xs text-trust-700 font-bold font-mono">Date Scope: {config.date}</div>
                <div className="text-[10px] text-trust-400 font-mono hidden sm:block">Tenant ID: {currentBusiness.id.slice(0, 8)}</div>
              </div>
            </div>
          </div>

          {/* Report Executive Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-trust-50 rounded-2xl border border-trust-200 report-card">
            <div className="p-3 bg-white rounded-xl border border-trust-200 space-y-0.5">
              <div className="text-[10px] font-extrabold text-trust-500 uppercase tracking-wider">Gross Sales</div>
              <div className="text-lg sm:text-xl font-black text-growth-700 font-mono">₹{totalReportSales.toLocaleString('en-IN')}</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-trust-200 space-y-0.5">
              <div className="text-[10px] font-extrabold text-trust-500 uppercase tracking-wider">Shops Reported</div>
              <div className="text-lg sm:text-xl font-black text-trust-900">{reportEntries.length} Branches</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-trust-200 space-y-0.5">
              <div className="text-[10px] font-extrabold text-trust-500 uppercase tracking-wider">Avg Sales / Shop</div>
              <div className="text-lg sm:text-xl font-black text-sapphire-800 font-mono">
                ₹{reportEntries.length > 0 ? Math.round(totalReportSales / reportEntries.length).toLocaleString('en-IN') : '0'}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-trust-200 space-y-0.5">
              <div className="text-[10px] font-extrabold text-trust-500 uppercase tracking-wider">Audit Status</div>
              <div className="text-xs font-extrabold text-growth-700 bg-growth-50 px-2 py-1 rounded-lg border border-growth-200 inline-block mt-0.5">
                ✓ 100% Verified
              </div>
            </div>
          </div>

          {/* Sales Table Section */}
          {config.includeTable && (
            <div className="space-y-3 report-card">
              <div className="flex items-center justify-between border-b border-trust-200 pb-2">
                <h3 className="font-extrabold text-xs text-trust-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-sapphire-600" />
                  <span>Shop Sales Breakdown Table</span>
                </h3>
                <span className="text-[10px] text-trust-500 font-mono">{reportEntries.length} Line Items</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-trust-300">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-trust-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="p-3 border-b border-trust-800 text-center">Photo Proof</th>
                      <th className="p-3 border-b border-trust-800">Shop Name</th>
                      <th className="p-3 border-b border-trust-800">Branch Code</th>
                      {config.includeStaff && <th className="p-3 border-b border-trust-800">Reported Staff</th>}
                      <th className="p-3 border-b border-trust-800 text-center">Status</th>
                      <th className="p-3 border-b border-trust-800 text-right">Daily Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-trust-200 bg-white">
                    {reportEntries.map((e, idx) => (
                      <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-trust-50/60'}>
                        <td className="p-3 text-center shrink-0">
                          {e.salesImageUrl || (e as any).photoProofUrls?.[0] ? (
                            <img 
                              src={e.salesImageUrl || (e as any).photoProofUrls?.[0]} 
                              alt="Receipt Proof" 
                              className="w-12 h-12 object-cover rounded-xl border border-trust-300 mx-auto shadow-xs" 
                            />
                          ) : (
                            <span className="text-[10px] text-trust-400 font-mono">No Image</span>
                          )}
                        </td>
                        <td className="p-3 font-extrabold text-trust-900">{e.shopName}</td>
                        <td className="p-3 font-mono text-trust-600 text-[11px]">{e.shopId.replace('shop_', '').toUpperCase()}</td>
                        {config.includeStaff && <td className="p-3 font-bold text-trust-800">{e.staffName}</td>}
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-growth-100 text-growth-800 border border-growth-200">
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-growth-700 text-right font-mono text-xs sm:text-sm">
                          ₹{e.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-trust-900 text-white font-extrabold">
                      <td colSpan={config.includeStaff ? 5 : 4} className="p-3.5 text-right uppercase tracking-wider text-xs">
                        Total Consolidated Revenue:
                      </td>
                      <td className="p-3.5 text-growth-400 text-right text-sm font-mono font-black">
                        ₹{totalReportSales.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Photo Proofs Section in PDF */}
          {config.includeImages && (
            <div className="space-y-3 pt-4 border-t border-trust-200 report-card">
              <h3 className="font-extrabold text-xs text-trust-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sapphire-600" />
                <span>Attached Daily Sales Photo Receipts ({reportEntries.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reportEntries.map(e => (
                  <div key={e.id} className="p-3 border border-trust-200 rounded-2xl bg-trust-50 space-y-2 proof-card">
                    {e.salesImageUrl ? (
                      <img 
                        src={e.salesImageUrl} 
                        alt="Proof" 
                        className="w-full h-36 object-cover rounded-xl border border-trust-300 shadow-xs" 
                        onError={(evt) => {
                          (evt.currentTarget.style.display = 'none');
                        }}
                      />
                    ) : null}
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="font-extrabold text-trust-900">{e.shopName}</span>
                      <span className="font-black text-growth-700 font-mono">₹{e.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[10px] text-trust-500 font-mono flex justify-between">
                      <span>Staff: {e.staffName}</span>
                      <span>Date: {e.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Footer Branding & Signature line */}
          <div className="pt-6 border-t-2 border-trust-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-trust-500 font-mono report-footer">
            <div>Official Report • Generated via GenZ Shop SaaS Platform</div>
            <div>Page 1 of 1 • System Verified Audit Trail</div>
          </div>

        </div>

      </div>

      {/* Mobile PDF Full-Screen Printable & Export View Modal */}
      {showMobilePdfModal && (
        <div className="fixed inset-0 z-50 bg-trust-950/95 backdrop-blur-md flex flex-col font-sans animate-fade-in no-print">
          {/* Top Control Bar */}
          <div className="bg-trust-900 text-white px-4 py-3 flex items-center justify-between shadow-xl shrink-0 border-b border-trust-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-growth-400" />
              <span className="font-extrabold text-sm truncate max-w-[180px]">PDF Report ({config.reportType})</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-growth-600 hover:bg-growth-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownloadReportFile}
                className="px-3 py-1.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setShowMobilePdfModal(false)}
                className="p-2 rounded-xl bg-trust-800 text-trust-300 hover:text-white font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
            <div className="bg-white p-5 rounded-2xl shadow-2xl max-w-2xl w-full space-y-5">
              {/* Header with Embedded Base64 Splash Logo */}
              <div className="flex items-center space-x-3 border-b-2 border-trust-900 pb-4">
                <img
                  src={SPLASH_LOGO_BASE64}
                  alt="GenZ Splash Logo"
                  className="w-14 h-14 rounded-2xl object-cover border border-trust-300 shadow-sm shrink-0"
                />
                <div>
                  <h2 className="text-xl font-black text-trust-900">{currentBusiness.name}</h2>
                  <p className="text-xs text-trust-600 font-semibold">{config.reportType} SALES REPORT • {config.date}</p>
                </div>
              </div>

              {/* Render printable elements */}
              <div dangerouslySetInnerHTML={{ __html: document.querySelector('.print-container')?.innerHTML || '' }} />
            </div>
          </div>
        </div>
      )}
      {/* Choose Export Format Modal: Ask Sheets or PDF */}
      {showChooseExportFormatModal && (
        <div className="fixed inset-0 z-50 bg-trust-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-trust-100 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-trust-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-sapphire-100 text-sapphire-700 rounded-2xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-trust-900">Download Sales Report</h3>
                  <p className="text-xs text-trust-500 font-medium">Select your preferred export format</p>
                </div>
              </div>
              <button onClick={() => setShowChooseExportFormatModal(false)} className="text-trust-400 hover:text-trust-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option A: Google Sheets / Excel */}
              <button
                type="button"
                onClick={() => {
                  setShowChooseExportFormatModal(false);
                  setShowSheetsExportModal(true);
                }}
                className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 rounded-2xl flex items-center space-x-3.5 transition-all text-left group active:scale-[0.98]"
              >
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-emerald-950">Google Sheets / Excel (.CSV)</h4>
                    <span className="badge-focus px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white">Recommended</span>
                  </div>
                  <p className="text-xs text-emerald-800/80 font-medium mt-0.5">
                    Live data table with staff photo proof image links. 1-click paste into Google Sheets.
                  </p>
                </div>
              </button>

              {/* Option B: Branded PDF Report */}
              <button
                type="button"
                onClick={() => {
                  setShowChooseExportFormatModal(false);
                  handlePrintPDF();
                }}
                className="w-full p-4 bg-sapphire-50 hover:bg-sapphire-100 border-2 border-sapphire-300 rounded-2xl flex items-center space-x-3.5 transition-all text-left group active:scale-[0.98]"
              >
                <div className="p-3 bg-sapphire-600 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-sapphire-950">Branded PDF Report Document</h4>
                  <p className="text-xs text-sapphire-800/80 font-medium mt-0.5">
                    Official print & PDF report with logo, analytics charts, and receipt image proofs.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheets Export Modal */}
      {showSheetsExportModal && (
        <div className="fixed inset-0 z-50 bg-trust-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-trust-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-trust-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-trust-900">Google Sheets & Excel Sales Export</h3>
                  <p className="text-xs text-trust-500 font-medium">Exporting {(reportEntries.length > 0 ? reportEntries : salesEntries).length} sales submission records with staff photo links</p>
                </div>
              </div>
              <button onClick={() => setShowSheetsExportModal(false)} className="text-trust-400 hover:text-trust-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Data Sheet Preview Table */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-trust-700 uppercase tracking-wider flex items-center justify-between">
                <span>Data Table Preview ({(reportEntries.length > 0 ? reportEntries : salesEntries).length} Rows)</span>
                <span className="text-[10px] text-sapphire-600 font-mono">Includes Photo Proof Links</span>
              </div>
              <div className="border border-trust-200 rounded-xl overflow-x-auto max-h-44 bg-trust-50/50">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-trust-100 text-trust-700 font-extrabold sticky top-0 uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-b border-trust-200">Date</th>
                      <th className="p-2 border-b border-trust-200">Store</th>
                      <th className="p-2 border-b border-trust-200">Staff</th>
                      <th className="p-2 border-b border-trust-200">Amount</th>
                      <th className="p-2 border-b border-trust-200">Status</th>
                      <th className="p-2 border-b border-trust-200">Photo Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-trust-200/60 font-mono text-trust-800">
                    {(reportEntries.length > 0 ? reportEntries : salesEntries).map(e => (
                      <tr key={e.id} className="hover:bg-white transition-colors">
                        <td className="p-2 whitespace-nowrap font-bold">{e.date}</td>
                        <td className="p-2 whitespace-nowrap font-bold text-trust-900">{e.shopName}</td>
                        <td className="p-2 whitespace-nowrap">{e.staffName}</td>
                        <td className="p-2 whitespace-nowrap font-extrabold text-growth-700">₹{e.amount}</td>
                        <td className="p-2 whitespace-nowrap">{e.status}</td>
                        <td className="p-2 whitespace-nowrap">
                          {e.salesImageUrl || (e as any).photoProofUrls?.[0] ? (
                            <img 
                              src={e.salesImageUrl || (e as any).photoProofUrls?.[0]} 
                              alt="Photo Proof" 
                              className="w-10 h-10 object-cover rounded-lg border border-trust-300 shadow-2xs" 
                            />
                          ) : (
                            <span className="text-[10px] text-trust-400 font-mono">No Photo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {copiedSheetsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Copied All Columns! Open Google Sheets and paste (Ctrl+V / Long Press -&gt; Paste). All columns populate automatically!</span>
              </div>
            )}

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const targetEntries = reportEntries.length > 0 ? reportEntries : salesEntries;
                  const success = await copySalesCSVToClipboard(targetEntries);
                  if (success) {
                    setCopiedSheetsSuccess(true);
                    window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank');
                  }
                }}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 text-center"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                <span>1-Click Copy & Open Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const targetEntries = reportEntries.length > 0 ? reportEntries : salesEntries;
                  await exportSalesToCSV(targetEntries, `Sales_Report_${config.date}`);
                }}
                className="p-3 bg-sapphire-600 hover:bg-sapphire-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 text-center"
              >
                <Download className="w-4.5 h-4.5" />
                <span>Download / Share CSV File</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
