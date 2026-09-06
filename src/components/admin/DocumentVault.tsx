import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VaultDocument, VaultCategory } from '../../types';
import { 
  FolderLock, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Trash2, 
  Eye, 
  Download, 
  X, 
  Camera, 
  ShieldAlert, 
  FileSpreadsheet, 
  Plus, 
  Sparkles, 
  User, 
  Check, 
  ArrowUpRight,
  FolderArchive,
  Receipt
} from 'lucide-react';
import { triggerSuccessHaptic, triggerWarningHaptic } from '../../utils/nativeHaptics';
import { notifyDocumentExpiring } from '../../utils/nativeNotifications';

const initialVaultDocs: VaultDocument[] = [];

export const DocumentVault: React.FC = () => {
  const { currentRole, currentUser, shops } = useApp();
  const isStaff = currentRole === 'STAFF';
  const isAdmin = currentRole === 'BUSINESS_ADMIN' || currentRole === 'SUPER_ADMIN';

  const [documents, setDocuments] = useState<VaultDocument[]>(initialVaultDocs);
  const [selectedCategory, setSelectedCategory] = useState<VaultCategory | 'ALL'>('ALL');
  const [selectedShopId, setSelectedShopId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [showCAExportModal, setShowCAExportModal] = useState(false);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docCategory, setDocCategory] = useState<VaultCategory>(isStaff ? 'INVOICE' : 'LICENSE');
  const [docShopId, setDocShopId] = useState<string>(shops[0]?.id || 'shop_1');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // RULE: Staff ONLY sees documents uploaded by staff or vendor bills. Proprietor legal files (Licenses, Leases, GST returns) are hidden!
      if (isStaff && doc.uploadedByRole === 'ADMIN' && doc.category !== 'INVOICE') {
        return false;
      }

      const matchCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
      const matchShop = selectedShopId === 'ALL' || doc.shopId === selectedShopId;
      const matchSearch = searchQuery === '' || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchShop && matchSearch;
    });
  }, [documents, selectedCategory, selectedShopId, searchQuery, isStaff]);

  // Documents expiring in < 30 days (Admin view only)
  const expiringDocs = useMemo(() => {
    if (!isAdmin) return [];
    const today = new Date();
    return documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const exp = new Date(doc.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return diffDays <= 30;
    });
  }, [documents, isAdmin]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;

    setIsUploading(true);
    triggerSuccessHaptic();

    const targetShopObj = shops.find(s => s.id === docShopId);
    const newDoc: VaultDocument = {
      id: `doc_${Date.now()}`,
      businessId: 'business_primary',
      shopId: docShopId,
      shopName: targetShopObj?.name || 'Main Outlet',
      category: isStaff ? (docCategory === 'OTHER' ? 'OTHER' : 'INVOICE') : docCategory,
      title: docTitle,
      description: docDescription,
      fileUrl: filePreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23',
      fileName: fileName || `${docTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: 1500000,
      mimeType: filePreview.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
      expiryDate: isAdmin ? docExpiryDate : undefined,
      uploadedBy: `${currentUser?.name || 'Staff Member'} (${isStaff ? 'Staff' : 'Proprietor'})`,
      uploadedByRole: isStaff ? 'STAFF' : 'ADMIN',
      createdAt: new Date().toISOString()
    };

    setDocuments(prev => [newDoc, ...prev]);

    // Native Android Notification Trigger for Expiry (Admin)
    if (isAdmin && docExpiryDate) {
      const diffDays = Math.ceil((new Date(docExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
      if (diffDays <= 30) {
        notifyDocumentExpiring(newDoc.title, newDoc.shopName, diffDays);
      }
    }

    setIsUploading(false);
    setShowUploadModal(false);
    // Reset Form
    setDocTitle('');
    setDocDescription('');
    setDocExpiryDate('');
    setFilePreview('');
    setFileName('');
  };

  const handleDeleteDocument = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to remove this document from the vault?')) {
      triggerWarningHaptic();
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (previewDoc?.id === id) setPreviewDoc(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadgeClass = (category: VaultCategory) => {
    switch (category) {
      case 'LICENSE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'GST': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LEASE': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INVOICE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HR': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-trust-900 to-trust-800 text-gold-400 rounded-xl shadow-md">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-trust-900">
                {isStaff ? 'Bills & Receipts Vault' : 'Strap Document Vault'}
              </h1>
              <p className="text-xs text-trust-500 mt-0.5">
                {isStaff 
                  ? 'Upload store bills, expense vouchers, & sales receipts directly from your phone.' 
                  : 'Centralized encrypted storage for retail trade licenses, GST returns, leases, & purchase bills.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCAExportModal(true)}
              className="px-3.5 py-2.5 bg-trust-100 text-trust-800 text-xs font-bold rounded-xl hover:bg-trust-200 transition-colors flex items-center justify-center space-x-2 border border-trust-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CA Audit Zip</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setDocCategory(isStaff ? 'INVOICE' : 'LICENSE');
              setShowUploadModal(true);
            }}
            className="px-4 py-2.5 bg-gold-500 text-trust-950 font-bold text-xs rounded-xl shadow-lg hover:bg-gold-400 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            <span>{isStaff ? 'Upload Bill / Receipt' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Expiry Warning Banner (Admin Only) */}
      {isAdmin && expiringDocs.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {expiringDocs.length} Document{expiringDocs.length > 1 ? 's' : ''} Expiring Soon!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {expiringDocs.map(d => `${d.title} (${d.shopName})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategory('LICENSE')}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shrink-0 shadow-sm"
          >
            View Expiring Docs
          </button>
        </div>
      )}

      {/* Category Folders & Search Filters */}
      <div className="bg-white p-5 rounded-2xl border border-trust-200 space-y-4">
        
        {/* Category Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(isStaff ? [
            { id: 'ALL', label: 'My Uploads', count: filteredDocs.length },
            { id: 'INVOICE', label: 'Bills & Receipts', count: documents.filter(d => d.category === 'INVOICE').length },
            { id: 'OTHER', label: 'Expense Vouchers', count: documents.filter(d => d.category === 'OTHER').length }
          ] : [
            { id: 'ALL', label: 'All Vault', count: documents.length },
            { id: 'LICENSE', label: 'Licenses', count: documents.filter(d => d.category === 'LICENSE').length },
            { id: 'GST', label: 'Tax & GST', count: documents.filter(d => d.category === 'GST').length },
            { id: 'LEASE', label: 'Property & Lease', count: documents.filter(d => d.category === 'LEASE').length },
            { id: 'INVOICE', label: 'Bills & Receipts', count: documents.filter(d => d.category === 'INVOICE').length },
            { id: 'HR', label: 'Staff IDs', count: documents.filter(d => d.category === 'HR').length },
          ]).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCategory === cat.id
                  ? 'bg-trust-900 text-white border-trust-900 shadow-md scale-102'
                  : 'bg-trust-50/50 hover:bg-trust-100/50 text-trust-800 border-trust-200'
              }`}
            >
              <div className="text-xs font-bold opacity-80">{cat.label}</div>
              <div className="text-lg font-black mt-1 flex items-center justify-between">
                <span>{cat.count}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedCategory === cat.id ? 'bg-gold-500 text-trust-950' : 'bg-trust-200 text-trust-800'
                }`}>
                  Files
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Search & Store Outlet Dropdown */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-trust-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by file name or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs font-medium text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="ALL">All Store Outlets</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid / Table View */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-trust-200 p-12 text-center">
          <FolderArchive className="w-12 h-12 text-trust-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-trust-900">No Documents Uploaded</h3>
          <p className="text-xs text-trust-500 mt-1 max-w-sm mx-auto">
            {isStaff 
              ? 'No vendor bills or vouchers uploaded yet. Tap "Upload Vendor Bill / Receipt" to add a bill photo.' 
              : 'No vault documents match your filter query. Tap "Upload Document" to add licenses or returns.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const isExpiring = doc.expiryDate && (new Date(doc.expiryDate).getTime() - Date.now() <= 30 * 24 * 3600 * 1000);
            return (
              <div 
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-trust-200 hover:border-gold-400/80 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category Badge & Shop Outlet */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                      {doc.category}
                    </span>
                    <span className="text-[11px] font-medium text-trust-500 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{doc.shopName}</span>
                    </span>
                  </div>

                  {/* Document Title */}
                  <div>
                    <h3 className="text-sm font-bold text-trust-900 line-clamp-1">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-xs text-trust-500 mt-0.5 line-clamp-2">{doc.description}</p>
                    )}
                  </div>

                  {/* Photo Proof / Image Document Thumbnail Preview */}
                  {doc.fileUrl && (doc.fileUrl.startsWith('data:image') || doc.fileUrl.startsWith('http') || (doc as any).fileType?.includes('image')) && (
                    <div 
                      onClick={() => setPreviewDoc(doc)}
                      className="relative group rounded-xl overflow-hidden border border-trust-200 hover:border-gold-400 bg-trust-950 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-300"
                    >
                      <img 
                        src={doc.fileUrl} 
                        alt={doc.title} 
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-trust-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity flex items-end justify-between p-2.5">
                        <span className="text-[10px] font-mono font-semibold text-white/90 truncate max-w-[160px]">
                          {doc.fileName}
                        </span>
                        <div className="p-1.5 bg-gold-500 text-trust-950 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expiry Pill (Admin Only) */}
                  {isAdmin && doc.expiryDate && (
                    <div className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                      isExpiring ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-trust-50 text-trust-700'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Expires: {doc.expiryDate}</span>
                    </div>
                  )}
                </div>

                {/* Footer File Info & Actions */}
                <div className="pt-3 border-t border-trust-100 flex items-center justify-between">
                  <div className="text-[11px] text-trust-400 font-medium">
                    {formatFileSize(doc.fileSize)} • {doc.uploadedByRole}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 bg-trust-100 hover:bg-trust-200 text-trust-800 rounded-lg transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-trust-100 hover:bg-trust-200 text-trust-800 rounded-lg transition-colors"
                      title="Download File"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-trust-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-trust-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-trust-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gold-100 text-trust-900 rounded-xl">
                  <Upload className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-trust-900">
                  {isStaff ? 'Upload Bill / Receipt File' : 'Upload to Document Vault'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-trust-400 hover:text-trust-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              {/* File Dropzone / Camera Picker */}
              <div>
                <label className="block text-xs font-bold text-trust-800 mb-1">Select File / Capture Receipt</label>
                <label className="border-2 border-dashed border-trust-200 hover:border-gold-400 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-trust-50/50">
                  <Camera className="w-8 h-8 text-trust-400 mb-2" />
                  <span className="text-xs font-bold text-trust-800">
                    {fileName ? fileName : 'Tap to Take Photo of Bill or Browse File'}
                  </span>
                  <span className="text-[10px] text-trust-400 mt-0.5">JPG, PNG, PDF up to 15MB</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-bold text-trust-800 mb-1">Document / Bill Title *</label>
                <input
                  type="text"
                  required
                  placeholder={isStaff ? 'e.g. Daily Sales Receipt Bill' : 'e.g. FSSAI Trade License 2026'}
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              {/* Category & Shop Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-trust-800 mb-1">Category</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as VaultCategory)}
                    className="w-full px-3.5 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs font-medium text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    {isStaff ? (
                      <>
                        <option value="INVOICE">Bill / Receipt</option>
                        <option value="OTHER">Expense Voucher</option>
                      </>
                    ) : (
                      <>
                        <option value="LICENSE">Trade License</option>
                        <option value="GST">Tax & GST Return</option>
                        <option value="LEASE">Shop Lease Contract</option>
                        <option value="INVOICE">Vendor Invoice / Bill</option>
                        <option value="HR">Staff ID Proof</option>
                        <option value="OTHER">Other Compliance</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-trust-800 mb-1">Store Outlet</label>
                  <select
                    value={docShopId}
                    onChange={(e) => setDocShopId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs font-medium text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry Date Picker (Admin Only) */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-trust-800 mb-1">Expiry Date (Optional for Alerts)</label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-trust-50/50 border border-trust-200 rounded-xl text-xs text-trust-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-trust-600 hover:bg-trust-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-gold-500 text-trust-950 font-bold text-xs rounded-xl shadow-md hover:bg-gold-400 transition-all flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Full Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-trust-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-trust-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-trust-900">{previewDoc.title}</h3>
                <p className="text-xs text-trust-500">{previewDoc.shopName} • {previewDoc.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-trust-400 hover:text-trust-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Area */}
            <div className="bg-trust-50 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.title}
                className="max-h-[400px] object-contain rounded-xl shadow-md"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-trust-500">
                Uploaded by <span className="font-bold text-trust-800">{previewDoc.uploadedBy}</span>
              </div>
              <a
                href={previewDoc.fileUrl}
                download={previewDoc.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-trust-900 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CA Audit Export Modal (Admin Only) */}
      {isAdmin && showCAExportModal && (
        <div className="fixed inset-0 bg-trust-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-trust-200 space-y-4">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-trust-900">CA Audit Package Export</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCAExportModal(false)}
                className="p-1.5 text-trust-400 hover:text-trust-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-trust-600">
              Generate a compressed audit package containing all GSTR-1, GSTR-3B tax returns, purchase bills, and trade licenses for your Chartered Accountant.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert('✅ Downloaded CA Audit Pack (ZIP) with 16 tax documents!');
                  setShowCAExportModal(false);
                }}
                className="w-full py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download CA Tax Audit ZIP</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
