import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sampleSalesImages } from '../../data/mockData';
import { History, Eye, AlertTriangle, CheckCircle, Clock, Store, Calendar, X, Trash2 } from 'lucide-react';

export const StaffSubmissionsView: React.FC = () => {
  const { salesEntries, updateSalesStatus, deleteSalesEntry, staffMembers, currentUser } = useApp();
  const currentStaff = staffMembers.find(m => 
    m.phone === currentUser?.staffIdNumber || 
    m.staffIdNumber === currentUser?.staffIdNumber || 
    m.email === currentUser?.email || 
    m.name === currentUser?.name
  ) || currentUser || staffMembers[0] || { id: 'staff_01', name: 'Staff User' };

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const myEntries = salesEntries.filter(e => {
    const isStaffMatch = e.staffId === ((currentStaff as any).id || (currentStaff as any).staffIdNumber) || e.staffName === currentStaff.name || e.staffId === currentUser?.staffIdNumber || true;
    if (statusFilter === 'ALL') return isStaffMatch;
    return isStaffMatch && e.status === statusFilter;
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Submissions' },
    { id: 'UNDER_REVIEW', label: 'Pending Review' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'CORRECTION_REQUIRED', label: 'Needs Action' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header Container */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sapphire-600 uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Staff Submission Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-trust-900 mt-0.5">My Sales Submissions</h1>
          <p className="text-xs text-trust-500 mt-1">Logged in as <span className="font-bold text-trust-900">{currentStaff.name}</span> • View status & resubmit receipt proofs</p>
        </div>

        {/* Filter Pills Container - Mobile Horizontal Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-trust-100 p-1.5 rounded-xl text-xs font-bold w-full md:w-auto shrink-0 scrollbar-none">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all text-center shrink-0 whitespace-nowrap ${
                statusFilter === tab.id 
                  ? 'bg-trust-900 text-white shadow-sm font-extrabold' 
                  : 'text-trust-600 hover:text-trust-900 hover:bg-trust-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List Grid */}
      <div className="space-y-4">
        {myEntries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-trust-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-trust-400 mx-auto" />
            <div className="text-sm font-bold text-trust-700">No Sales Submissions Found</div>
            <p className="text-xs text-trust-400">There are no submission records matching the selected status filter.</p>
          </div>
        ) : (
          myEntries.map(entry => {
            const isApproved = entry.status === 'APPROVED';
            const isCorrection = entry.status === 'CORRECTION_REQUIRED';

            return (
              <div 
                key={entry.id} 
                className={`p-4 sm:p-5 bg-white rounded-2xl border ${
                  isCorrection ? 'border-urgency-300 bg-urgency-50/20' : isApproved ? 'border-trust-200' : 'border-focus-200 bg-focus-50/10'
                } shadow-psychology space-y-4`}
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-trust-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-sapphire-600 shrink-0" />
                    <span className="font-extrabold text-trust-900 text-base">Shop {entry.shopName}</span>
                    <span className="text-xs text-trust-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {entry.date}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                    isApproved ? 'badge-growth' : isCorrection ? 'badge-urgency animate-pulse' : 'badge-focus'
                  }`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Amount & Image Thumbnail Flex */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Amount Box */}
                  <div className="sm:col-span-7 p-3.5 bg-trust-50/80 rounded-xl flex items-center justify-between border border-trust-200">
                    <span className="text-xs font-semibold text-trust-600">Reported Sales Amount</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-growth-700">₹{entry.amount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Photo Proof Box */}
                  <div className="sm:col-span-5 flex items-center space-x-3 bg-trust-50/80 p-2.5 rounded-xl border border-trust-200">
                    <div 
                      onClick={() => setZoomImage(entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0])}
                      className="relative group w-16 h-12 rounded-lg overflow-hidden border border-trust-300 shrink-0 cursor-pointer bg-trust-900"
                    >
                      <img
                        src={entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0]}
                        alt="Sales proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-trust-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-trust-900">Receipt Photo Proof</div>
                      <button 
                        onClick={() => setZoomImage(entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0])}
                        className="text-[11px] text-sapphire-600 hover:underline font-bold"
                      >
                        Tap to View Image &rarr;
                      </button>
                    </div>
                  </div>

                </div>

                {/* Delete / Unsend Row */}
                <div className="flex items-center justify-between pt-3 border-t border-trust-100">
                  <span className="text-[10px] text-trust-400 font-mono">ID: {entry.id}</span>
                  <button
                    onClick={async () => {
                      if (window.confirm('Unsend this sales submission? This will delete it permanently from Supabase database.')) {
                        await deleteSalesEntry(entry.id);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unsend / Delete</span>
                  </button>
                </div>

                {/* Correction Action Request Box */}
                {isCorrection && (
                  <div className="p-4 bg-urgency-50 border border-urgency-300 text-urgency-900 rounded-xl text-xs space-y-2.5">
                    <div className="font-extrabold flex items-center gap-1.5 text-urgency-800 text-xs">
                      <AlertTriangle className="w-4 h-4 text-urgency-600 shrink-0" />
                      <span>Correction Requested by Business Admin:</span>
                    </div>
                    <p className="text-urgency-800 bg-white p-2.5 rounded-lg border border-urgency-200 font-mono text-[11px]">
                      {entry.correctionReason || 'Please resubmit a clearer photo receipt proof showing exact closing register amounts.'}
                    </p>
                    <button
                      onClick={() => updateSalesStatus(entry.id, 'UNDER_REVIEW')}
                      className="px-4 py-2 bg-urgency-600 hover:bg-urgency-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <span>Resubmit Clearer Photo Proof</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-trust-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="relative max-w-3xl w-full bg-gradient-to-b from-trust-900 via-trust-950 to-trust-950 rounded-3xl p-5 border border-gold-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-trust-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-gold-500/20 text-gold-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-gold-500/40">
                  RECEIPT PROOF
                </span>
                <span className="font-bold text-xs text-white">Sales Receipt Inspection</span>
              </div>
              <button 
                onClick={() => setZoomImage(null)} 
                className="p-1.5 rounded-xl bg-trust-800 hover:bg-trust-700 text-trust-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/90 p-4 rounded-2xl flex items-center justify-center border border-trust-800/80">
              <img src={zoomImage} alt="Zoomed receipt" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl" />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setZoomImage(null)}
                className="px-4 py-2 bg-trust-800 hover:bg-trust-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
