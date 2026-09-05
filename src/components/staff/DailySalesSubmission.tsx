import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sampleSalesImages } from '../../data/mockData';
import { compressReceiptImage } from '../../utils/mobilePermissions';
import { triggerSuccessHaptic, triggerLightHaptic } from '../../utils/nativeHaptics';
import { notifySalesSubmitted } from '../../utils/nativeNotifications';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Store, 
  DollarSign, 
  FileText, 
  Eye, 
  Trash2,
  Sparkles,
  WifiOff,
  Zap,
  X,
  Video,
  ChevronDown,
  AlertCircle,
  FileCheck,
  Share2,
  MessageCircle,
  CreditCard,
  Wallet
} from 'lucide-react';

export const DailySalesSubmission: React.FC = () => {
  const { shops, staffMembers, currentUser, addSalesEntry, salesEntries, updateSalesStatus, deleteSalesEntry, refreshData } = useApp();
  const [isRefreshingData, setIsRefreshingData] = useState<boolean>(false);

  // Current active staff
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

  // Filter assigned shops
  const assignedShops = (() => {
    if (!currentStaff || !(currentStaff as any).assignedShopIds || !Array.isArray((currentStaff as any).assignedShopIds) || (currentStaff as any).assignedShopIds.length === 0) {
      return [];
    }
    return shops.filter(s => (currentStaff as any).assignedShopIds.includes(s.id));
  })();

  // Form State
  const [selectedShopId, setSelectedShopId] = useState<string>(assignedShops[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [optionalNote, setOptionalNote] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'MIXED'>('CASH');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'CORRECTION_REQUIRED'>('ALL');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [compressionMetrics, setCompressionMetrics] = useState<{ origKb: number; compKb: number; pct: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [lastSubmittedDetails, setLastSubmittedDetails] = useState<{
    shopName: string;
    amount: number;
    date: string;
    paymentMode?: string;
    note?: string;
  } | null>(null);

  const handleWhatsAppShare = (details: { shopName: string; amount: number; date: string; paymentMode?: string; note?: string }) => {
    const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(details.amount);
    const modeLabel = details.paymentMode === 'ONLINE' ? 'Online / UPI' : details.paymentMode === 'MIXED' ? 'Mixed (Cash + Online)' : 'Cash';
    const message = `*GENZ RETAIL - DAILY CLOSING REPORT*\n` +
      `*Store*: ${details.shopName}\n` +
      `*Date*: ${details.date}\n` +
      `*Staff*: ${currentStaff.name || 'Staff Member'}\n` +
      `*Total Collection*: ${formattedAmt} (${modeLabel})\n` +
      (details.note ? `*Note*: ${details.note}\n` : '') +
      `\n*Status*: Submitted & Pending Proprietor Verification`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
  };

  // Live Camera State & Refs
  const [showLiveCameraModal, setShowLiveCameraModal] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (assignedShops.length > 0) {
      if (!selectedShopId || !assignedShops.some(s => s.id === selectedShopId)) {
        setSelectedShopId(assignedShops[0].id);
      }
    } else {
      setSelectedShopId('');
    }
  }, [assignedShops]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.log('Video play error:', err));
    }
  }, [cameraStream, showLiveCameraModal]);

  const startLiveCamera = async () => {
    setCameraError(null);
    setShowLiveCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access live camera. Please check camera permissions or use native camera snapshot.');
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowLiveCameraModal(false);
  };

  const capturePhotoFromStream = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      setImageFileName(`Live_Receipt_Snapshot_${Date.now()}.jpg`);
      setCompressionMetrics({ origKb: 1450, compKb: 120, pct: 91.7 });
      stopLiveCamera();
    }
  };

  // Handle On-Device Hardware Camera Image Compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      setImageFileName(file.name);
      try {
        const result = await compressReceiptImage(file);
        setImagePreview(result.compressedDataUrl);
        setCompressionMetrics({
          origKb: result.originalSizeKb,
          compKb: result.compressedSizeKb,
          pct: result.savingsPct
        });
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUseMockImage = (url: string, name: string) => {
    setIsCompressing(true);
    setTimeout(() => {
      setImagePreview(url);
      setImageFileName(name);
      setCompressionMetrics({ origKb: 3450, compKb: 185, pct: 94.6 });
      setIsCompressing(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);

    const activeShopId = selectedShopId || shops[0]?.id || 'shop_primary';
    const targetShop = shops.find(s => s.id === activeShopId);

    const success = await addSalesEntry({
      shopId: activeShopId,
      shopName: targetShop?.name || 'Main Store Outlet',
      staffId: (currentStaff as any).id || (currentStaff as any).staffIdNumber || 'staff_01',
      staffName: currentStaff.name || 'Staff Member',
      date,
      amount: parseFloat(amount),
      paymentMode,
      salesImageUrl: imagePreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
      imageFileName: imageFileName || 'receipt_proof.jpg',
      optionalNote: optionalNote || '',
      status: 'UNDER_REVIEW'
    });

    setIsSubmitting(false);
    if (success) {
      triggerSuccessHaptic();
      setLastSubmittedDetails({
        shopName: targetShop?.name || 'Main Store Outlet',
        amount: parseFloat(amount),
        date,
        paymentMode,
        note: optionalNote
      });
      setSubmitSuccess(true);
      setAmount('');
      setOptionalNote('');
      setPaymentMode('CASH');
      setImagePreview('');
      setImageFileName('');
      setTimeout(() => setSubmitSuccess(false), 10000);
    }
  };

  // Recent Submissions by this staff
  const myRecentSubmissions = salesEntries.filter(e => e.staffId === ((currentStaff as any).id || (currentStaff as any).staffIdNumber) || e.businessId);

  // Today's Staff Summary Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayEntries = myRecentSubmissions.filter(e => e.date === todayStr);
  const myTodayTotal = myTodayEntries.reduce((sum, e) => sum + e.amount, 0);
  const myTodayCash = myTodayEntries.filter(e => e.paymentMode === 'CASH' || !e.paymentMode).reduce((sum, e) => sum + e.amount, 0);
  const myTodayOnline = myTodayEntries.filter(e => e.paymentMode === 'ONLINE').reduce((sum, e) => sum + e.amount, 0);

  const filteredMySubmissions = myRecentSubmissions.filter(e => {
    if (historyFilter === 'ALL') return true;
    return e.status === historyFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Top Blue Header Banner */}
      <div className="bg-gradient-to-r from-sapphire-900 via-trust-900 to-sapphire-950 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-sapphire-800/80 flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-xl font-black tracking-tight text-white">Submit Daily Shop Sales</h1>
          <p className="text-[11px] text-sapphire-200 mt-0.5 font-medium">Store closing entry & daily collection report</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              setIsRefreshingData(true);
              await refreshData();
              setTimeout(() => setIsRefreshingData(false), 600);
            }}
            className="px-3 py-1.5 bg-sapphire-800/90 hover:bg-sapphire-700 text-white border border-sapphire-600/60 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isRefreshingData ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="bg-sapphire-950/80 backdrop-blur border border-sapphire-700/70 px-3 py-1.5 rounded-xl text-right shrink-0 shadow-inner">
            <div className="text-[9px] uppercase text-sapphire-300 font-bold tracking-wider">Today's Date</div>
            <div className="text-xs font-black text-emerald-400">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
          </div>
        </div>
      </div>

      {/* Staff Today's Collection Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-growth-50/90 border border-growth-200 rounded-xl space-y-0.5">
          <div className="text-[9px] font-bold text-growth-700 uppercase tracking-wider">My Today Total</div>
          <div className="text-base font-black text-growth-800">₹{myTodayTotal.toLocaleString('en-IN')}</div>
          <div className="text-[9px] text-growth-600 font-semibold">{myTodayEntries.length} report(s) today</div>
        </div>

        <div className="p-2.5 bg-white border border-trust-200 rounded-xl space-y-0.5 shadow-xs">
          <div className="text-[9px] font-bold text-trust-600 uppercase tracking-wider">Cash Collection</div>
          <div className="text-base font-extrabold text-trust-900">₹{myTodayCash.toLocaleString('en-IN')}</div>
          <div className="text-[9px] text-trust-400 font-medium">Counter cash</div>
        </div>

        <div className="p-2.5 bg-sapphire-50/90 border border-sapphire-200 rounded-xl space-y-0.5">
          <div className="text-[9px] font-bold text-sapphire-700 uppercase tracking-wider">Online / UPI</div>
          <div className="text-base font-extrabold text-sapphire-900">₹{myTodayOnline.toLocaleString('en-IN')}</div>
          <div className="text-[9px] text-sapphire-600 font-medium">Digital QR/UPI</div>
        </div>

        <div className="p-2.5 bg-white border border-trust-200 rounded-xl space-y-0.5 shadow-xs">
          <div className="text-[9px] font-bold text-trust-500 uppercase tracking-wider">Assigned Branch</div>
          <div className="text-xs font-extrabold text-trust-900 truncate">
            {assignedShops.length > 0 ? assignedShops[0].name : 'Primary Store'}
          </div>
          <div className="text-[9px] text-trust-400 font-medium">{assignedShops.length} Store Assigned</div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm animate-fade-in gap-2.5">
          <div className="flex items-start space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs text-emerald-900">Daily Sales Submitted Successfully!</div>
              <div className="text-[11px] text-emerald-700">Logged and sent for proprietor verification.</div>
            </div>
          </div>
          {lastSubmittedDetails && (
            <button
              type="button"
              onClick={() => handleWhatsAppShare(lastSubmittedDetails)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5 shrink-0 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
              <span>Send WhatsApp Report</span>
            </button>
          )}
        </div>
      )}

      {assignedShops.length === 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center space-x-2.5 shadow-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-xs">No Store Branch Assigned</div>
            <div className="text-[11px] text-amber-700">Please contact Business Admin to assign your store outlet.</div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-xl border border-trust-200 shadow-xs space-y-3.5">
          
          <h2 className="text-sm font-extrabold text-trust-900 border-b border-trust-100 pb-2 flex items-center space-x-2">
            <Store className="w-4 h-4 text-sapphire-600" />
            <span>Daily Report Form</span>
          </h2>

          {/* Date & Shop Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-trust-700 mb-1 uppercase tracking-wider">
                Submission Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-trust-50 border border-trust-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-trust-700 mb-1 uppercase tracking-wider">
                Assigned Shop <span className="text-urgency-600">*</span>
              </label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 text-sapphire-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 bg-white border border-sapphire-300 hover:border-sapphire-500 rounded-lg text-xs font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-600 shadow-xs appearance-none"
                  required
                  disabled={assignedShops.length === 0}
                >
                  {assignedShops.length === 0 ? (
                    <option value="" disabled>-- No Store Branch Assigned --</option>
                  ) : (
                    assignedShops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'MAIN'})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-trust-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              </div>
            </div>
          </div>

          {/* Amount Entry in INR */}
          <div>
            <label className="block text-[10px] font-bold text-trust-700 mb-1 uppercase tracking-wider">
              Total Day Sales Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-growth-700 font-bold text-base">₹</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25400"
                className="w-full pl-8 pr-3 py-2 bg-growth-50/40 border border-growth-300 text-growth-900 rounded-lg font-extrabold text-lg focus:ring-2 focus:ring-growth-500 focus:border-growth-500"
                required
              />
            </div>
          </div>

          {/* Photo Proof Upload & Stiff Compact Preview */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-trust-700 uppercase tracking-wider flex items-center justify-between">
              <span>Sales Photo Proof / Receipt Image</span>
              {isCompressing && (
                <span className="text-sapphire-600 text-[10px] font-semibold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Compressing...
                </span>
              )}
            </label>

            {/* Custom Upload Box - Stiff low height */}
            <div className="border border-dashed border-trust-300 rounded-xl p-2 text-center bg-trust-50/40 transition-all">
              {imagePreview ? (
                /* Stiff Compact Light Theme Preview Box */
                <div className="relative group rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100 transition-all">
                  <img
                    src={imagePreview}
                    alt="Sales proof preview"
                    className="w-full h-36 object-cover rounded-lg group-hover:scale-101 transition-transform duration-200"
                  />
                  
                  {/* Floating Overlay Badge */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-slate-300 text-slate-800 text-[9px] font-bold flex items-center space-x-1 shadow-xs">
                    <Camera className="w-3 h-3 text-sapphire-600" />
                    <span>PHOTO PROOF ATTACHED</span>
                  </div>

                  {/* Hover Delete Action */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => setImagePreview('')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1 transition-transform active:scale-95"
                      title="Remove image and recapture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                  </div>

                  <div className="p-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-700 flex items-center justify-between gap-1">
                    <span className="font-mono text-slate-800 truncate max-w-[180px] flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-sapphire-600 shrink-0" />
                      {imageFileName || 'Receipt_Proof.jpg'}
                    </span>
                    {compressionMetrics && (
                      <span className="font-bold text-growth-700 bg-growth-100 border border-growth-300 px-2 py-0.2 rounded-full">
                        {(compressionMetrics.origKb / 1024).toFixed(1)}MB → {compressionMetrics.compKb}KB
                      </span>
                    )}
                  </div>
                </div>
              ) : showLiveCameraModal ? (
                /* INLINE STIFF COMPACT LIVE CAMERA SCANNER (h-36 stiff compact height box) */
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/80 shadow-md h-36 w-full flex flex-col justify-between p-1.5">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />

                  {/* Top Bar: Live Tag & Close Button */}
                  <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                      <Video className="w-3 h-3 animate-pulse" />
                      <span>Live Receipt Scanner</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="p-0.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
                      title="Close Live Camera"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {cameraError ? (
                    <div className="relative z-10 p-2 bg-rose-900/90 text-white rounded-lg text-center border border-rose-500/60 my-auto backdrop-blur-xs">
                      <div className="text-[10px] text-rose-200">{cameraError}</div>
                      <label className="inline-block mt-1 px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-md cursor-pointer shadow-xs">
                        Use Native Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            handleImageSelect(e);
                            stopLiveCamera();
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    /* Dashed Target Overlay */
                    <div className="relative z-10 border border-dashed border-emerald-400/80 rounded-lg h-10 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-bold text-emerald-200 bg-slate-900/70 backdrop-blur-xs px-2 py-0.5 rounded-full">
                        align receipt total
                      </span>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  {!cameraError && (
                    <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xs p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={capturePhotoFromStream}
                        className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-md shadow-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 fill-slate-950" />
                        <span>CAPTURE SNAP</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <div className="flex flex-row items-center justify-center gap-2">
                    {/* Live Viewfinder */}
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="px-3 py-1.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-growth-300" />
                      <span>Live Camera</span>
                    </button>

                    {/* Snapshot */}
                    <label className="px-3 py-1.5 bg-growth-600 hover:bg-growth-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Snapshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>

                    {/* Gallery */}
                    <label className="px-3 py-1.5 bg-trust-100 hover:bg-trust-200 text-trust-800 font-bold text-xs rounded-lg border border-trust-300 cursor-pointer transition-all flex items-center justify-center space-x-1.5">
                      <Upload className="w-3.5 h-3.5 text-trust-600" />
                      <span>Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Sample Mock Selectors for Testing */}
                  <div className="pt-1.5 border-t border-trust-200/60 flex items-center justify-center space-x-2">
                    <span className="text-[9px] text-trust-400 font-bold uppercase">Sample:</span>
                    {sampleSalesImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleUseMockImage(img, `Sample_Receipt_0${idx+1}.jpg`)}
                        className="w-7 h-7 rounded-md overflow-hidden border border-trust-300 hover:border-sapphire-500"
                      >
                        <img src={img} alt="Sample" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-[10px] font-bold text-trust-700 mb-1 uppercase tracking-wider">
              Optional Note
            </label>
            <input
              type="text"
              value={optionalNote}
              onChange={(e) => setOptionalNote(e.target.value)}
              placeholder="e.g. Footwear category sale active..."
              className="w-full px-3 py-1.5 bg-trust-50 border border-trust-300 rounded-lg text-xs focus:ring-2 focus:ring-sapphire-500"
            />
          </div>

          {/* Payment Method / Collection Type Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-trust-700 mb-1 uppercase tracking-wider">
              Payment Method / Collection Type <span className="text-urgency-600">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-3.5 h-3.5 text-sapphire-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'ONLINE' | 'MIXED')}
                className="w-full pl-8 pr-8 py-2 bg-white border border-sapphire-300 hover:border-sapphire-500 rounded-lg text-xs font-bold text-trust-900 focus:ring-2 focus:ring-sapphire-500 shadow-xs appearance-none"
                required
              >
                <option value="CASH">Cash (Physical Cash Collection)</option>
                <option value="ONLINE">Online (UPI / GPay / PhonePe / QR / Card)</option>
                <option value="MIXED">Mixed Collection (Cash + Online)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-trust-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            </div>
          </div>

          {/* Submit Button - Vibrant Sapphire Theme */}
          <button
            type="submit"
            disabled={isSubmitting || !imagePreview || !amount}
            className="w-full py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Submitting Sales Report...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span>Submit Daily Sales Report</span>
              </>
            )}
          </button>

        </form>

        {/* Right Column: Submission History & Lifecycle Status */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-trust-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-trust-100 pb-2">
              <h3 className="font-bold text-trust-900 text-xs uppercase tracking-wider">My Submission History</h3>
              <span className="text-[10px] font-mono text-trust-500">{filteredMySubmissions.length} record(s)</span>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'UNDER_REVIEW', label: 'Review' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'CORRECTION_REQUIRED', label: 'Needs Fix' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setHistoryFilter(tab.key as any)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shrink-0 ${
                    historyFilter === tab.key
                      ? 'bg-sapphire-600 text-white shadow-xs'
                      : 'bg-trust-100 text-trust-600 hover:bg-trust-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Stiff Compact Scroll Box (max-h-[220px]) */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
              {filteredMySubmissions.length === 0 ? (
                <div className="p-4 text-center text-trust-400 text-[11px] bg-trust-50/40 rounded-lg border border-dashed border-trust-200">
                  No submissions matching filter.
                </div>
              ) : (
                filteredMySubmissions.map(entry => {
                  const statusBadgeClass = 
                    entry.status === 'APPROVED' ? 'badge-growth' :
                    entry.status === 'CORRECTION_REQUIRED' ? 'badge-urgency' :
                    'badge-focus';

                return (
                  <div key={entry.id} className="p-2.5 bg-trust-50 border border-trust-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-trust-900 text-[11px]">Shop {entry.shopName}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${statusBadgeClass}`}>
                        {entry.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-growth-700">₹{entry.amount.toLocaleString('en-IN')}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-bold text-sapphire-700 bg-sapphire-50 border border-sapphire-200 px-1.5 py-0.2 rounded uppercase">
                          {entry.paymentMode === 'ONLINE' ? 'Online' : entry.paymentMode === 'MIXED' ? 'Mixed' : 'Cash'}
                        </span>
                        <span className="text-[10px] text-trust-400">{entry.date}</span>
                      </div>
                    </div>

                    {/* Correction Reason Box */}
                    {entry.status === 'CORRECTION_REQUIRED' && entry.correctionReason && (
                      <div className="p-2 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded text-[11px] space-y-1">
                        <div className="font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-urgency-600" />
                          <span>Correction Needed:</span>
                        </div>
                        <p>{entry.correctionReason}</p>
                        <button
                          onClick={() => updateSalesStatus(entry.id, 'UNDER_REVIEW')}
                          className="mt-0.5 px-2 py-0.5 bg-urgency-600 text-white rounded font-bold hover:bg-urgency-700 text-[10px]"
                        >
                          Resubmit
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-trust-400 pt-1 border-t border-trust-200/60">
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Unsend this submission? This will delete it permanently.')) {
                            await deleteSalesEntry(entry.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-bold"
                      >
                        <Trash2 className="w-3 h-3" /> Unsend
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomImage(entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0])}
                        className="text-sapphire-600 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

        </div>

      </div>

      {/* Photo Viewer Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 text-white bg-white/20 hover:bg-white/40 p-1.5 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Full size receipt proof"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/20 shadow-2xl"
            />
            <span className="text-[11px] text-white/80 mt-2 font-mono">Tap anywhere to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
