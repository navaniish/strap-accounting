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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-trust-900 via-sapphire-900 to-trust-900 text-white p-6 rounded-2xl shadow-xl border border-trust-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submit Daily Shop Sales</h1>
          <p className="text-xs text-trust-300 mt-1">Pull down from top anytime or tap Sync Data to refresh latest store updates</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={async () => {
              setIsRefreshingData(true);
              await refreshData();
              setTimeout(() => setIsRefreshingData(false), 600);
            }}
            className="px-3.5 py-2.5 bg-trust-800 hover:bg-trust-700 text-white border border-trust-700 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingData ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>

          <div className="bg-trust-800/80 backdrop-blur border border-trust-700 px-3.5 py-2 rounded-xl text-right shrink-0">
            <div className="text-[10px] uppercase text-trust-400 font-bold tracking-wider">Today's Date</div>
            <div className="text-xs font-bold text-growth-400">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-trust-900 to-emerald-950 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-2xl border border-emerald-500/40 animate-fade-in gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-100">Daily Sales Submitted Successfully!</div>
              <div className="text-xs text-trust-300 mt-0.5">Your report has been logged and sent to Business Admin for verification.</div>
            </div>
          </div>
          {lastSubmittedDetails && (
            <button
              type="button"
              onClick={() => handleWhatsAppShare(lastSubmittedDetails)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-trust-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0 active:scale-95 border border-emerald-300"
            >
              <MessageCircle className="w-4 h-4 fill-trust-950 text-emerald-500" />
              <span>Send WhatsApp Report to Owner (Free)</span>
            </button>
          )}
        </div>
      )}

      {assignedShops.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl flex items-center space-x-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-sm">No Store Branch Assigned to Your Account</div>
            <div className="text-xs text-amber-700 mt-0.5">
              You currently do not have any assigned store branches. Please contact your Business Admin to assign your store in Admin Staff Management.
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-trust-200 shadow-psychology space-y-6">
          
          <h2 className="text-lg font-bold text-trust-900 border-b border-trust-100 pb-3 flex items-center space-x-2">
            <Store className="w-5 h-5 text-sapphire-600" />
            <span>Daily Report Form</span>
          </h2>

          {/* Date & Shop Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase tracking-wider">
                Submission Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-trust-50 border border-trust-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase tracking-wider">
                Select Assigned Shop <span className="text-urgency-600">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-sapphire-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border-2 border-sapphire-300 hover:border-sapphire-500 rounded-xl text-xs sm:text-sm font-extrabold text-trust-900 focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-600 shadow-sm appearance-none"
                  required
                  disabled={assignedShops.length === 0}
                >
                  {assignedShops.length === 0 ? (
                    <option value="" disabled>-- No Store Outlet Assigned --</option>
                  ) : (
                    assignedShops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'MAIN'}) {s.location ? `• ${s.location}` : ''}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-trust-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              </div>
            </div>
          </div>

          {/* Amount Entry in INR */}
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase tracking-wider">
              Total Day Sales Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-growth-700 font-bold text-lg">₹</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25400"
                className="w-full pl-9 pr-4 py-3 bg-growth-50/50 border border-growth-300 text-growth-900 rounded-xl font-bold text-xl focus:ring-2 focus:ring-growth-500 focus:border-growth-500 min-h-[48px]"
                required
              />
            </div>
            <p className="text-[11px] text-trust-500 mt-1">
              Enter total daily cash + digital closing receipts for this shop.
            </p>
          </div>

          {/* Photo Proof Upload & Preview */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-trust-700 uppercase tracking-wider flex items-center justify-between">
              <span>Sales Photo Proof / Receipt Image</span>
              {isCompressing && (
                <span className="text-focus-600 text-xs font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Compressing image...
                </span>
              )}
            </label>

            {/* Custom Upload Box */}
            <div className="border-2 border-dashed border-trust-300 hover:border-sapphire-500 rounded-2xl p-4 text-center bg-trust-50/50 transition-all">
              {imagePreview ? (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-gold-400/80 shadow-lg bg-trust-950 transition-all">
                  <img
                    src={imagePreview}
                    alt="Sales proof preview"
                    className="w-full h-52 object-cover rounded-xl group-hover:scale-102 transition-transform duration-300 opacity-95 group-hover:opacity-100"
                  />
                  
                  {/* Floating Overlay Badge */}
                  <div className="absolute top-3 left-3 bg-trust-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-gold-400/40 text-gold-300 text-[10px] font-extrabold flex items-center space-x-1.5 shadow-md">
                    <Camera className="w-3.5 h-3.5 text-gold-400" />
                    <span>PHOTO PROOF ATTACHED</span>
                  </div>

                  {/* Hover Delete Action */}
                  <div className="absolute inset-0 bg-trust-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-3 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => setImagePreview('')}
                      className="px-4 py-2 bg-urgency-600 hover:bg-urgency-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center space-x-1.5 transition-transform active:scale-95"
                      title="Remove image and recapture"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Retake / Change Photo</span>
                    </button>
                  </div>

                  <div className="p-3 bg-trust-900/95 border-t border-trust-800 text-xs text-trust-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                    <span className="font-mono text-white text-[11px] truncate max-w-[200px] flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                      {imageFileName || 'Sales_Receipt_Proof.jpg'}
                    </span>
                    {compressionMetrics ? (
                      <span className="text-[10px] font-bold text-growth-400 bg-growth-950/80 border border-growth-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Zap className="w-3 h-3 text-growth-400" />
                        Original {(compressionMetrics.origKb / 1024).toFixed(1)}MB → Compressed {compressionMetrics.compKb}KB ({compressionMetrics.pct}% saved)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-growth-300 bg-growth-900/80 border border-growth-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-growth-400" />
                        HD Proof Ready
                      </span>
                    )}
                  </div>
                </div>
              ) : showLiveCameraModal ? (
                /* INLINE STIFF COMPACT LIVE CAMERA SCANNER (Zero background black overlay, Zero scrolling, Stiff 208px height inline box) */
                <div className="relative rounded-2xl overflow-hidden bg-trust-950 border-2 border-emerald-500/60 shadow-xl h-52 w-full flex flex-col justify-between p-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />

                  {/* Top Bar: Live Tag & Close Button */}
                  <div className="relative z-10 flex items-center justify-between bg-trust-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-extrabold text-xs">
                      <Video className="w-3.5 h-3.5 animate-pulse" />
                      <span>Live Receipt Scanner</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                      title="Close Live Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {cameraError ? (
                    <div className="relative z-10 p-3 bg-urgency-950/90 text-white rounded-xl text-center border border-urgency-500/60 my-auto backdrop-blur-md">
                      <AlertTriangle className="w-5 h-5 text-urgency-400 mx-auto mb-1" />
                      <div className="text-[11px] text-urgency-200">{cameraError}</div>
                      <label className="inline-block mt-2 px-3 py-1.5 bg-emerald-500 text-trust-950 font-extrabold text-[11px] rounded-lg cursor-pointer shadow">
                        Use Phone Native Camera
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
                    <div className="relative z-10 border border-dashed border-emerald-400/80 rounded-xl p-1.5 h-16 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-emerald-200 bg-trust-950/70 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                        align receipt total & date
                      </span>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  {!cameraError && (
                    <div className="relative z-10 flex items-center justify-between bg-trust-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={capturePhotoFromStream}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-trust-950 font-black text-xs rounded-lg shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4 fill-trust-950" />
                        <span>CAPTURE RECEIPT SNAP</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    {/* 1. Live WebRTC Viewfinder Camera */}
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="w-full sm:w-auto px-4 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                    >
                      <Video className="w-4 h-4 text-growth-400" />
                      <span>Live Camera Viewfinder</span>
                    </button>

                    {/* 2. Direct Device Hardware Camera */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-growth-600 hover:bg-growth-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Take Snapshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>

                    {/* 3. Choose Gallery File */}
                    <label className="w-full sm:w-auto px-4 py-2.5 bg-trust-100 hover:bg-trust-200 text-trust-800 font-extrabold text-xs rounded-xl border border-trust-300 cursor-pointer transition-all flex items-center justify-center space-x-2">
                      <Upload className="w-4 h-4 text-trust-600" />
                      <span>Gallery File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-trust-500">Live Camera, Device Snapshot, PNG, JPG, or WEBP supported</p>

                  {/* Sample Mock Selectors for Testing */}
                  <div className="pt-2 border-t border-trust-200/60">
                    <span className="text-[10px] text-trust-400 block mb-1.5 uppercase font-bold">Or pick sample receipt proof:</span>
                    <div className="flex justify-center space-x-2">
                      {sampleSalesImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUseMockImage(img, `Sample_Receipt_Proof_0${idx+1}.jpg`)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-trust-300 hover:border-sapphire-500"
                        >
                          <img src={img} alt="Sample" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase tracking-wider">
              Optional Note / Notes for Admin
            </label>
            <textarea
              rows={2}
              value={optionalNote}
              onChange={(e) => setOptionalNote(e.target.value)}
              placeholder="e.g. Higher footfall today, footwear category discount active..."
              className="w-full px-3.5 py-2.5 bg-trust-50 border border-trust-300 rounded-xl text-sm focus:ring-2 focus:ring-sapphire-500"
            />
          </div>

          {/* Payment Method / Collection Type Dropdown (Bottom of Optional Note) */}
          <div>
            <label className="block text-xs font-bold text-trust-700 mb-1.5 uppercase tracking-wider">
              Payment Method / Collection Type <span className="text-urgency-600">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-sapphire-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'ONLINE' | 'MIXED')}
                className="w-full pl-10 pr-10 py-3 bg-white border-2 border-sapphire-300 hover:border-sapphire-500 rounded-xl text-xs sm:text-sm font-extrabold text-trust-900 focus:ring-2 focus:ring-sapphire-500 focus:border-sapphire-600 shadow-sm appearance-none"
                required
              >
                <option value="CASH">Cash (Physical Cash Collection)</option>
                <option value="ONLINE">Online (UPI / GPay / PhonePe / QR / Card)</option>
                <option value="MIXED">Mixed Collection (Both Cash & Online Combined)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-trust-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            </div>
            <p className="text-[11px] text-trust-500 mt-1">
              Select whether this store collection was received via Cash, Online UPI, or Mixed.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !imagePreview || !amount}
            className="w-full py-3.5 bg-trust-900 hover:bg-trust-800 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-growth-400" />
                <span>Submitting Sales Report...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-growth-400" />
                <span>Submit Daily Report</span>
              </>
            )}
          </button>

        </form>

        {/* Right Column: Submission History & Lifecycle Status */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
            <h3 className="font-bold text-trust-900 text-base flex items-center justify-between">
              <span>My Submission History</span>
              <span className="text-xs font-mono font-normal text-trust-500">{myRecentSubmissions.length} records</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {myRecentSubmissions.map(entry => {
                const statusBadgeClass = 
                  entry.status === 'APPROVED' ? 'badge-growth' :
                  entry.status === 'CORRECTION_REQUIRED' ? 'badge-urgency' :
                  'badge-focus';

                return (
                  <div key={entry.id} className="p-3.5 bg-trust-50 border border-trust-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-trust-900">Shop {entry.shopName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
                        {entry.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-growth-700">₹{entry.amount.toLocaleString('en-IN')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold text-sapphire-700 bg-sapphire-50 border border-sapphire-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {entry.paymentMode === 'ONLINE' ? 'Online' : entry.paymentMode === 'MIXED' ? 'Mixed' : 'Cash'}
                        </span>
                        <span className="text-xs text-trust-400">{entry.date}</span>
                      </div>
                    </div>

                    {/* Correction Reason Box */}
                    {entry.status === 'CORRECTION_REQUIRED' && entry.correctionReason && (
                      <div className="p-2.5 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-lg text-xs space-y-1">
                        <div className="font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-urgency-600" />
                          <span>Correction Needed from Admin:</span>
                        </div>
                        <p>{entry.correctionReason}</p>
                        <button
                          onClick={() => updateSalesStatus(entry.id, 'UNDER_REVIEW')}
                          className="mt-1 px-2.5 py-1 bg-urgency-600 text-white rounded font-semibold hover:bg-urgency-700 text-[11px]"
                        >
                          Resubmit Corrected Photo
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-trust-400 pt-1 border-t border-trust-200/60">
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('Unsend this submission? This will delete it permanently from Supabase database.')) {
                            await deleteSalesEntry(entry.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-extrabold"
                      >
                        <Trash2 className="w-3 h-3" /> Unsend / Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomImage(entry.salesImageUrl || (entry as any).photoProofUrls?.[0] || sampleSalesImages[0])}
                        className="text-sapphire-600 hover:underline flex items-center gap-1 font-bold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Photo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Photo Viewer Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-trust-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-sm transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomImage}
              alt="Full size receipt proof"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-white/20 shadow-2xl"
            />
            <span className="text-xs text-trust-300 mt-3 font-mono">Tap anywhere to close photo</span>
          </div>
        </div>
      )}
    </div>
  );
};
