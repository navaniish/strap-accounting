import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailySalesEntry } from '../../types';
import { sampleSalesImages } from '../../data/mockData';
import { exportSalesToCSV, copySalesCSVToClipboard } from '../../utils/exportSalesData';
import { triggerSuccessHaptic, triggerWarningHaptic } from '../../utils/nativeHaptics';
import { notifyAdminNewSalesReceived, notifySalesApproved, notifySalesCorrected } from '../../utils/nativeNotifications';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Clock, 
  Store, 
  User, 
  Calendar as CalendarIcon, 
  Filter, 
  Maximize2, 
  X,
  MessageSquare,
  Trash2,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  Bell,
  Camera,
  MessageCircle
} from 'lucide-react';

export const VerificationQueue: React.FC = () => {
  const { salesEntries, updateSalesStatus, deleteSalesEntry } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEntryForPhoto, setSelectedEntryForPhoto] = useState<DailySalesEntry | null>(null);
  const [correctionModalEntry, setCorrectionModalEntry] = useState<DailySalesEntry | null>(null);
  const [correctionReasonInput, setCorrectionReasonInput] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const filteredEntries = salesEntries.filter(entry => {
    if (statusFilter === 'ALL') return true;
    return entry.status === statusFilter;
  });

  const pendingCount = salesEntries.filter(e => e.status === 'UNDER_REVIEW').length;
  const approvedCount = salesEntries.filter(e => e.status === 'APPROVED').length;
  const correctionCount = salesEntries.filter(e => e.status === 'CORRECTION_REQUIRED').length;

  const handleWhatsAppApprovalShare = (entry: DailySalesEntry) => {
    const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(entry.amount);
    const message = `✅ *GENZ RETAIL - SALES SUBMISSION APPROVED*\n` +
      `🏬 *Store*: ${entry.shopName}\n` +
      `📅 *Date*: ${entry.date}\n` +
      `👤 *Staff*: ${entry.staffName}\n` +
      `💰 *Amount Verified*: ${formattedAmt}\n` +
      `👍 *Status*: Verified & Approved by Store Owner`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
  };

  const handleWhatsAppCorrectionShare = (entry: DailySalesEntry, reason: string) => {
    const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(entry.amount);
    const message = `⚠️ *GENZ RETAIL - REVISION REQUIRED*\n` +
      `🏬 *Store*: ${entry.shopName}\n` +
      `📅 *Date*: ${entry.date}\n` +
      `👤 *Staff*: ${entry.staffName}\n` +
      `💰 *Amount*: ${formattedAmt}\n` +
      `❗ *Reason*: ${reason}\n` +
      `\n🔄 Please open staff app and re-submit clearer sales photo proof.`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
  };

  const handleOpenCorrectionModal = (entry: DailySalesEntry) => {
    setCorrectionModalEntry(entry);
    setCorrectionReasonInput('Image blur on receipt total amount line. Please re-upload clearer photo.');
  };

  const handleApproveEntry = (entry: DailySalesEntry) => {
    triggerSuccessHaptic();
    updateSalesStatus(entry.id, 'APPROVED');
    notifySalesApproved(entry.shopName, entry.amount);
  };

  const handleConfirmCorrection = () => {
    if (correctionModalEntry && correctionReasonInput) {
      triggerWarningHaptic();
      updateSalesStatus(correctionModalEntry.id, 'CORRECTION_REQUIRED', correctionReasonInput);
      notifySalesCorrected(correctionModalEntry.shopName, correctionReasonInput);
      handleWhatsAppCorrectionShare(correctionModalEntry, correctionReasonInput);
      setCorrectionModalEntry(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-trust-900">Daily Sales Verification Queue</h1>
            {pendingCount > 0 && (
              <span className="badge-focus px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-trust-500 mt-1">
            Review daily closing sales submitted by field staff. Inspect receipt photo proofs and approve or request corrections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Test Admin Notification Button */}
          <button
            type="button"
            onClick={async () => {
              await notifyAdminNewSalesReceived('Main Outlet', 'Staff Demo', 2500);
            }}
            className="px-3.5 py-2 bg-trust-100 text-trust-800 text-xs font-bold rounded-xl hover:bg-trust-200 transition-colors flex items-center space-x-2 border border-trust-200 shrink-0"
          >
            <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span>Test Alert</span>
          </button>

          {/* Export to Sheets / Excel Button */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-growth-600 hover:bg-growth-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-growth-glow transition-all active:scale-95 shrink-0"
            title="Export daily sales data with staff photo proof image links to Excel / Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Sheets / Excel</span>
          </button>

          {/* Filter Tabs using Color Psychology - Mobile Horizontal Scroll */}
          <div className="flex items-center gap-1 bg-trust-100 p-1 rounded-xl border border-trust-200 overflow-x-auto w-full md:w-auto scrollbar-none">
            {[
              { id: 'ALL', label: `All (${salesEntries.length})` },
              { id: 'UNDER_REVIEW', label: `Pending (${pendingCount})`, activeClass: 'bg-focus-600 text-white' },
              { id: 'APPROVED', label: `Approved (${approvedCount})`, activeClass: 'bg-growth-600 text-white' },
              { id: 'CORRECTION_REQUIRED', label: `Needs Fix (${correctionCount})`, activeClass: 'bg-urgency-600 text-white' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  statusFilter === tab.id
                    ? tab.activeClass || 'bg-trust-900 text-white shadow-sm'
                    : 'text-trust-600 hover:text-trust-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map(entry => {
          const isPending = entry.status === 'UNDER_REVIEW';
          const isApproved = entry.status === 'APPROVED';
          const isCorrection = entry.status === 'CORRECTION_REQUIRED';

          const cardBorder = isPending 
            ? 'border-focus-300 bg-focus-50/20' 
            : isApproved 
            ? 'border-growth-200 bg-white' 
            : 'border-urgency-200 bg-white';

          return (
            <div key={entry.id} className={`p-5 rounded-2xl border ${cardBorder} shadow-psychology space-y-4 flex flex-col justify-between`}>
              
              <div className="space-y-3">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-sapphire-600" />
                      <span className="font-bold text-trust-900 text-base">Shop {entry.shopName}</span>
                    </div>
                    <div className="text-xs text-trust-500 flex items-center space-x-2 mt-0.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{entry.date}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                    isApproved ? 'badge-growth' : isCorrection ? 'badge-urgency' : 'badge-focus'
                  }`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Amount Highlight */}
                <div className="p-3 bg-trust-50 rounded-xl flex items-center justify-between border border-trust-200/80">
                  <span className="text-xs font-semibold text-trust-600">Reported Sales</span>
                  <span className="text-xl font-bold text-growth-700">₹{entry.amount.toLocaleString('en-IN')}</span>
                </div>

                {/* Photo Proof Thumbnail with Premium Glassmorphism & Lightbox */}
                <div 
                  onClick={() => setSelectedEntryForPhoto(entry)}
                  className="relative group rounded-2xl overflow-hidden border border-trust-200/90 hover:border-gold-400/80 bg-trust-950 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <img
                    src={entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0]}
                    alt="Sales photo proof"
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  />
                  
                  {/* Dark Glassmorphism Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-trust-950/90 via-trust-950/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-trust-900/90 backdrop-blur-md text-gold-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-gold-500/30 flex items-center space-x-1 shadow-sm">
                        <Camera className="w-3 h-3 text-gold-400" />
                        <span>RECEIPT PROOF</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-white text-[11px] font-semibold truncate max-w-[180px] drop-shadow-sm">
                        {entry.imageFileName || 'Sales_Proof_Receipt.jpg'}
                      </div>
                      <div className="p-2 bg-gold-500 text-trust-950 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff & Notes */}
                <div className="text-xs space-y-1 pt-1">
                  <div className="flex items-center text-trust-600">
                    <User className="w-3.5 h-3.5 mr-1 text-trust-400" />
                    <span>Staff: <strong className="text-trust-800">{entry.staffName}</strong></span>
                  </div>
                  {entry.optionalNote && (
                    <div className="p-2 bg-trust-100/70 rounded-lg text-trust-700 italic text-[11px]">
                      "{entry.optionalNote}"
                    </div>
                  )}
                </div>

                {/* Correction Reason Note if applicable */}
                {isCorrection && entry.correctionReason && (
                  <div className="p-2.5 bg-urgency-50 border border-urgency-200 rounded-lg text-xs text-urgency-800 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-urgency-600" />
                      <span>Correction Requested:</span>
                    </div>
                    <p>{entry.correctionReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Admin */}
              <div className="pt-3 border-t border-trust-200/80 flex items-center space-x-2">
                {isPending ? (
                  <>
                    <button
                      onClick={() => handleApproveEntry(entry)}
                      className="flex-1 py-2 bg-growth-600 hover:bg-growth-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleOpenCorrectionModal(entry)}
                      className="flex-1 py-2 bg-urgency-600 hover:bg-urgency-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center space-x-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Request Correction</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this submission permanently from Supabase?')) {
                          await deleteSalesEntry(entry.id);
                        }
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between text-xs text-trust-500">
                    <span>Verified by: <strong>{entry.reviewerName || 'Admin'}</strong></span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppApprovalShare(entry)}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 border border-emerald-300"
                        title="Send WhatsApp Approval Notice to Staff (Free)"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>WhatsApp Notice</span>
                      </button>
                      <button
                        onClick={() => updateSalesStatus(entry.id, 'UNDER_REVIEW')}
                        className="text-sapphire-600 hover:underline font-semibold text-[11px]"
                      >
                        Re-open Review
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this submission permanently from Supabase?')) {
                            await deleteSalesEntry(entry.id);
                          }
                        }}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal 1: Full Photo Inspection */}
      {selectedEntryForPhoto && (
        <div className="fixed inset-0 z-50 bg-trust-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-gradient-to-b from-trust-900 via-trust-950 to-trust-950 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gold-500/30 flex flex-col max-h-[92vh]">
            {/* Header Bar */}
            <div className="px-6 py-4 bg-trust-900/90 border-b border-trust-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gold-500/10 border border-gold-500/30 rounded-xl text-gold-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-white text-base">Sales Proof Receipt — Shop {selectedEntryForPhoto.shopName}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40">
                      Verified HD Proof
                    </span>
                  </div>
                  <p className="text-xs text-trust-300 flex items-center space-x-2 mt-0.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-gold-400" />
                    <span>{selectedEntryForPhoto.date}</span>
                    <span>•</span>
                    <span className="font-bold text-growth-400 text-sm">₹{selectedEntryForPhoto.amount.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={selectedEntryForPhoto.salesImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-trust-800/80 hover:bg-trust-700 text-trust-200 hover:text-white transition-all text-xs font-semibold flex items-center space-x-1"
                  title="Open high resolution original image in new tab"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Original</span>
                </a>
                <button
                  onClick={() => setSelectedEntryForPhoto(null)}
                  className="p-2 rounded-xl bg-trust-800/80 hover:bg-trust-700 text-trust-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Canvas */}
            <div className="p-6 bg-gradient-to-b from-trust-950 via-black to-trust-950 flex-1 min-h-[320px] flex items-center justify-center overflow-auto relative">
              <div className="relative max-w-full max-h-[62vh] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-trust-800/90 group">
                <img
                  src={selectedEntryForPhoto.salesImageUrl || (selectedEntryForPhoto as any).photoProofUrls?.[0] || sampleSalesImages[0]}
                  alt="Full Photo Proof"
                  className="max-w-full max-h-[62vh] object-contain rounded-2xl"
                />
                <div className="absolute top-3 right-3 bg-trust-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold-500/40 text-[11px] font-mono text-gold-300 flex items-center space-x-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-growth-500 animate-pulse"></span>
                  <span>PHOTO PROOF ATTACHED</span>
                </div>
              </div>
            </div>

            {/* Footer Metadata & Quick Actions */}
            <div className="px-6 py-4 bg-trust-900/95 border-t border-trust-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-trust-300 flex items-center space-x-2">
                <User className="w-4 h-4 text-gold-400" />
                <span>Uploaded by <strong className="text-white font-bold">{selectedEntryForPhoto.staffName}</strong></span>
                {selectedEntryForPhoto.createdAt && (
                  <span className="text-trust-400 font-mono text-[11px]">({selectedEntryForPhoto.createdAt})</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedEntryForPhoto(null)}
                  className="px-4 py-2 bg-trust-800 hover:bg-trust-700 text-trust-200 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenCorrectionModal(selectedEntryForPhoto);
                    setSelectedEntryForPhoto(null);
                  }}
                  className="px-4 py-2 bg-urgency-600 hover:bg-urgency-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Correction</span>
                </button>
                <button
                  onClick={() => {
                    handleApproveEntry(selectedEntryForPhoto);
                    setSelectedEntryForPhoto(null);
                  }}
                  className="px-5 py-2 bg-growth-600 hover:bg-growth-700 text-white text-xs font-bold rounded-xl shadow-growth-glow transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Entry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Correction Request Reason Input */}
      {correctionModalEntry && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-trust-200">
            <div className="flex items-center space-x-2 text-urgency-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-trust-900">Request Correction</h3>
            </div>
            <p className="text-xs text-trust-600">
              Specify what needs correction for <strong>Shop {correctionModalEntry.shopName}</strong> ({correctionModalEntry.date}). The staff member will be notified immediately.
            </p>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Correction Note for Staff</label>
              <textarea
                rows={3}
                value={correctionReasonInput}
                onChange={(e) => setCorrectionReasonInput(e.target.value)}
                className="w-full p-3 bg-urgency-50/50 border border-urgency-300 rounded-xl text-xs text-trust-900 focus:ring-2 focus:ring-urgency-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCorrectionModalEntry(null)}
                className="px-4 py-2 bg-trust-200 text-trust-800 text-xs font-semibold rounded-xl hover:bg-trust-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCorrection}
                className="px-4 py-2 bg-urgency-600 text-white text-xs font-bold rounded-xl hover:bg-urgency-700 shadow"
              >
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export to Sheets / Excel Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-trust-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-trust-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-trust-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-growth-100 text-growth-700 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-trust-900">Export Sales Data to Google Sheets / Excel</h3>
                  <p className="text-xs text-trust-500">Exporting {filteredEntries.length} sales submission records with staff photo proof image links</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-trust-400 hover:text-trust-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Data Sheet Preview Table */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-trust-700 uppercase tracking-wider flex items-center justify-between">
                <span>Data Table Preview ({filteredEntries.length} Rows)</span>
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
                    {filteredEntries.map(e => (
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
                              className="w-10 h-10 object-cover rounded-lg border border-trust-300 shadow-2xs cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => setSelectedEntryForPhoto(e)}
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

            {copiedSuccess && (
              <div className="p-3 bg-growth-50 border border-growth-200 text-growth-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
                <Check className="w-4 h-4 text-growth-600 shrink-0" />
                <span>Copied All Columns! Open Google Sheets and paste (Ctrl+V / Long Press -&gt; Paste). All columns populate automatically!</span>
              </div>
            )}

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const success = await copySalesCSVToClipboard(filteredEntries);
                  if (success) {
                    setCopiedSuccess(true);
                    window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank');
                  }
                }}
                className="p-3 bg-growth-600 hover:bg-growth-700 text-white font-extrabold text-xs rounded-xl shadow-growth-glow flex items-center justify-center space-x-2 transition-all active:scale-95 text-center"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
                <span>1-Click Copy & Open Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await exportSalesToCSV(filteredEntries, 'GenZ_Daily_Sales');
                }}
                className="p-3 bg-sapphire-600 hover:bg-sapphire-700 text-white font-extrabold text-xs rounded-xl shadow-sapphire-glow flex items-center justify-center space-x-2 transition-all active:scale-95 text-center"
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
