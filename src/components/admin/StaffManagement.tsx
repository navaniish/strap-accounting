import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember, AdminUser } from '../../types';
import { generateNumericStaffId, generateStrongPassword } from '../../utils/authGenerators';
import { Users, Plus, Mail, Phone, Shield, AlertCircle, Key, RefreshCw, Copy, Check, Eye, EyeOff, Trash2, Pencil, ShieldAlert } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { staffMembers, addStaff, updateStaff, deleteStaff, adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, shops, toggleAdminGoogleLogin } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'STAFF' | 'ADMINS'>('STAFF');

  // Staff Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<'Manager' | 'Supervisor' | 'Staff' | 'Accountant'>('Staff');
  const [staffIdNumber, setStaffIdNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Admin User Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminRole, setAdminRole] = useState<'BUSINESS_ADMIN' | 'CO_ADMIN' | 'MANAGER'>('CO_ADMIN');
  const [adminShowPassword, setAdminShowPassword] = useState<boolean>(false);
  const [adminAllowGoogleLogin, setAdminAllowGoogleLogin] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const handleOpenEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminPassword(admin.password || 'Admin@123');
    setAdminRole(admin.role);
    setAdminAllowGoogleLogin(admin.allowGoogleLogin !== false);
    setErrorMsg('');
  };

  const handleUpdateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setErrorMsg('');

    if (!adminEmail.includes('@')) {
      setErrorMsg('Please enter a valid admin email address.');
      return;
    }

    const res = await updateAdminUser(editingAdmin.id, {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
      allowGoogleLogin: adminAllowGoogleLogin
    });

    if (res.success) {
      setEditingAdmin(null);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } else {
      setErrorMsg(res.message || 'Error updating admin user details.');
    }
  };

  // Auto-generate numeric ID & alphanumeric+special password ONCE when staff modal opens
  useEffect(() => {
    if (showAddModal) {
      setStaffIdNumber(generateNumericStaffId());
      setPassword(generateStrongPassword());
      setSelectedShopIds(shops.map(s => s.id));
    }
  }, [showAddModal]);

  // Auto-generate password when admin modal opens
  useEffect(() => {
    if (showAddAdminModal) {
      setAdminPassword(generateStrongPassword());
      setAdminAllowGoogleLogin(true);
    }
  }, [showAddAdminModal]);

  const handleRegenerateAdminPassword = () => {
    setAdminPassword(generateStrongPassword());
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminEmail.includes('@')) {
      setErrorMsg('Please enter a valid admin email address.');
      return;
    }

    const res = await addAdminUser({
      name: adminName || adminEmail.split('@')[0].toUpperCase(),
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
      role: adminRole,
      status: 'invited',
      authProvider: 'google',
      allowGoogleLogin: adminAllowGoogleLogin
    });

    if (res.success) {
      setShowAddAdminModal(false);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } else {
      setErrorMsg(res.message || 'Error creating admin user');
    }
  };

  const handleDeleteAdmin = async (adminId: string, nameStr: string) => {
    if (window.confirm(`Are you sure you want to remove Admin user "${nameStr}"?`)) {
      const res = await deleteAdminUser(adminId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleDeleteStaff = async (staffId: string, nameStr: string) => {
    if (window.confirm(`Are you sure you want to delete staff account for "${nameStr}"? This action cannot be undone.`)) {
      const res = await deleteStaff(staffId);
      if (!res.success) {
        alert(res.message || 'Error deleting staff account.');
      }
    }
  };

  const handleRegenerateCredentials = () => {
    setStaffIdNumber(generateNumericStaffId());
    setPassword(generateStrongPassword());
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPhone(staff.phone || staff.staffIdNumber || '');
    setPassword(staff.password || 'Gz@8392!K');
    setRole(staff.role as any || 'Staff');
    setSelectedShopIds(staff.assignedShopIds || (shops[0] ? [shops[0].id] : []));
    setErrorMsg('');
  };

  const handleUpdateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setErrorMsg('');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Staff Phone Number.');
      return;
    }

    const res = await updateStaff(editingStaff.id, {
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone,
      staffIdNumber: cleanPhone,
      password: password.trim(),
      role,
      assignedShopIds: selectedShopIds.length > 0 ? selectedShopIds : (shops[0] ? [shops[0].id] : [])
    });

    if (res.success) {
      setEditingStaff(null);
      setName('');
      setEmail('');
      setPhone('');
    } else {
      setErrorMsg(res.message || 'Error updating staff account');
    }
  };

  const handleCopyCredentials = (idNum: string, pwd: string, staffName: string) => {
    const text = `Staff Member: ${staffName}\nNumeric Staff ID: ${idNum}\nPassword: ${pwd}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idNum);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Staff Phone Number (Staff ID).');
      return;
    }

    if (!password || password.trim().length === 0) {
      setErrorMsg('Please enter a password for the staff account.');
      return;
    }

    const res = await addStaff({
      staffIdNumber: cleanPhone,
      phone: cleanPhone,
      password: password.trim(),
      name: name.trim(),
      email: email.trim(),
      role,
      assignedShopIds: selectedShopIds.length > 0 ? selectedShopIds : [shops[0]?.id || 'shop_primary'],
      permissions: ['daily_sales.view', 'daily_sales.create'],
      status: 'ACTIVE'
    });

    if (res.success) {
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword(generateStrongPassword());
    } else {
      setErrorMsg(res.message || 'Error creating staff member');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Top Navigation Bar & Sub-Tabs */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-trust-900">User & Access Management</h1>
          <p className="text-xs text-trust-500 mt-0.5">
            Manage Store Staff credentials and Business Admin / Co-Admin portal access.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {activeSubTab === 'STAFF' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-growth-600 hover:bg-growth-700 text-white font-bold text-xs rounded-xl shadow-growth-glow transition-all flex items-center justify-center space-x-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Staff Login</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-sapphire-glow transition-all flex items-center justify-center space-x-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Admin User</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="bg-white p-1.5 rounded-2xl border border-trust-200 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('STAFF')}
          className={`flex-1 min-w-[180px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
            activeSubTab === 'STAFF'
              ? 'bg-growth-600 text-white shadow-xs'
              : 'text-trust-600 hover:bg-trust-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="truncate">Staff Accounts ({staffMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ADMINS')}
          className={`flex-1 min-w-[180px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shrink-0 ${
            activeSubTab === 'ADMINS'
              ? 'bg-sapphire-600 text-white shadow-xs'
              : 'text-trust-600 hover:bg-trust-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="truncate">Admin Accounts ({adminUsers.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: STORE STAFF ACCOUNTS */}
      {activeSubTab === 'STAFF' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffMembers.length === 0 ? (
            <div className="md:col-span-2 p-12 bg-white rounded-3xl border border-dashed border-trust-300 text-center space-y-3">
              <Users className="w-10 h-10 text-trust-300 mx-auto" />
              <h3 className="font-extrabold text-trust-800 text-sm">No Staff Members Registered Yet</h3>
              <p className="text-xs text-trust-400 max-w-sm mx-auto">
                Click "Generate Staff Login" to create 10-digit numeric Staff IDs and passwords for your store staff.
              </p>
            </div>
          ) : (
            staffMembers.map(staff => (
              <div key={staff.id} className="p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-sapphire-600 text-white flex items-center justify-center font-bold text-sm">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-trust-900 text-base">{staff.name}</h3>
                      <p className="text-xs text-trust-500 font-semibold">{staff.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditStaff(staff)}
                      className="p-1.5 rounded-xl bg-sapphire-50 hover:bg-sapphire-100 text-sapphire-600 border border-sapphire-200 transition-all text-xs flex items-center gap-1 font-bold"
                      title={`Edit Staff Account (${staff.name})`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-sapphire-600" />
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="p-1.5 rounded-xl bg-urgency-50 hover:bg-urgency-100 text-urgency-600 border border-urgency-200 transition-all text-xs flex items-center gap-1 font-bold"
                      title={`Delete Staff Account (${staff.name})`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-urgency-600" />
                    </button>
                  </div>
                </div>

            {/* Generated Credentials Card */}
            <div className="p-3 bg-trust-50 border border-trust-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px] font-bold text-trust-500 uppercase">
                <span className="flex items-center gap-1"><Key className="w-3.5 h-3.5 text-sapphire-600" /> Staff Credentials</span>
                <button 
                  onClick={() => handleCopyCredentials(staff.staffIdNumber || '849201', staff.password || 'Gz@8392!K', staff.name)}
                  className="text-sapphire-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
                >
                  {copiedId === (staff.staffIdNumber || '849201') ? (
                    <><Check className="w-3 h-3 text-growth-600" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy Login</>
                  )}
                </button>
              </div>
              
              <div className="flex justify-between font-mono">
                <span className="text-trust-600">Staff ID (Phone No.):</span>
                <span className="font-extrabold text-trust-900 bg-white px-2 py-0.5 rounded border border-trust-200">
                  {staff.phone || staff.staffIdNumber || '9833344556'}
                </span>
              </div>

              <div className="flex justify-between font-mono">
                <span className="text-trust-600">Password (Alphanumeric+Special):</span>
                <span className="font-extrabold text-sapphire-700 bg-white px-2 py-0.5 rounded border border-trust-200">
                  {staff.password || 'Gz@8392!K'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-trust-600 pt-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-trust-400" />
                <span>{staff.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-trust-400" />
                <span>{staff.phone}</span>
              </div>
            </div>

            {/* Assigned Shops List Badges & Quick Assignment Dropdown */}
            <div className="pt-3 border-t border-trust-100 space-y-2">
              <div className="text-[10px] font-extrabold text-trust-500 uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Shops ({staff.assignedShopIds ? staff.assignedShopIds.length : 0})</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {staff.assignedShopIds && staff.assignedShopIds.length > 0 ? (
                  staff.assignedShopIds.map(shopId => {
                    const shopObj = shops.find(s => s.id === shopId);
                    return (
                      <span key={shopId} className="px-2.5 py-1 bg-sapphire-50 text-sapphire-900 border border-sapphire-200 text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-sapphire-600" />
                        <span>{shopObj?.name || 'Assigned Store'}</span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const updatedList = (staff.assignedShopIds || []).filter(id => id !== shopId);
                            await updateStaff(staff.id, { assignedShopIds: updatedList });
                          }}
                          className="text-sapphire-500 hover:text-urgency-600 font-bold ml-1 text-xs"
                          title="Unassign Shop"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-trust-400 italic">No shops assigned</span>
                )}
              </div>

              {/* Quick Assign Shop Dropdown */}
              <div className="pt-1">
                <select
                  value=""
                  onChange={async (e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const updatedList = Array.from(new Set([...(staff.assignedShopIds || []), selectedId]));
                    await updateStaff(staff.id, { assignedShopIds: updatedList });
                  }}
                  className="w-full p-2 bg-trust-50 border border-trust-200 rounded-xl text-xs font-bold text-trust-800 focus:ring-2 focus:ring-sapphire-500 cursor-pointer"
                >
                  <option value="">+ Assign to Shop Dropdown...</option>
                  {shops.map(shopItem => (
                    <option key={shopItem.id} value={shopItem.id}>
                      {shopItem.name} ({shopItem.code || 'MAIN'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )}

      {/* SUB-TAB 2: ADMIN & MANAGER ACCOUNTS */}
      {activeSubTab === 'ADMINS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* High Security Mode Active Banner */}
          <div className="md:col-span-2 p-4 bg-gradient-to-r from-red-600 to-urgency-600 text-white rounded-2xl shadow-xl flex items-center justify-between border-2 border-red-400 animate-fade-in">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-white/20 rounded-xl text-white">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
                  <span>🔒 STRICT GOOGLE OAUTH SECURITY ENFORCED</span>
                </div>
                <p className="text-xs text-red-100 font-medium mt-0.5">
                  Only email accounts pre-approved & added in this list can log in via Google Sign-In. Unregistered accounts are strictly blocked.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-white text-red-700 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">
              Maximum Security
            </span>
          </div>
          {adminUsers.map(admin => (
            <div key={admin.id} className="p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-sapphire-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {admin.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-trust-900 text-base flex items-center gap-1.5">
                      <span>{admin.name}</span>
                      <Shield className="w-3.5 h-3.5 text-sapphire-600" />
                    </h3>
                    <p className="text-xs text-trust-500 font-semibold">{admin.role.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditAdmin(admin)}
                    className="px-2.5 py-1.5 rounded-lg bg-sapphire-50 hover:bg-sapphire-100 text-sapphire-700 border border-sapphire-200 transition-all text-xs font-bold flex items-center gap-1"
                    title="Edit Admin Account Details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-sapphire-600" />
                    <span>Edit</span>
                  </button>

                  {admin.id !== 'admin_primary' && adminUsers.length > 1 && (
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                      className="p-1.5 rounded-lg bg-urgency-50 hover:bg-urgency-100 text-urgency-600 border border-urgency-200 transition-all text-xs"
                      title="Remove Admin Access"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Access Credentials Card */}
              <div className="p-3 bg-sapphire-50/60 border border-sapphire-200 rounded-xl space-y-1.5 text-xs font-sans">
                <div className="flex justify-between items-center text-[11px] font-bold text-sapphire-800 uppercase">
                  <span className="flex items-center gap-1"><Key className="w-3.5 h-3.5 text-sapphire-600" /> Admin Portal Access</span>
                  <button 
                    onClick={() => handleCopyCredentials(admin.email, admin.password || 'Admin@123', admin.name)}
                    className="text-sapphire-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
                  >
                    {copiedId === admin.email ? (
                      <><Check className="w-3 h-3 text-growth-600" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy Login</>
                    )}
                  </button>
                </div>
                
                <div className="flex justify-between font-mono">
                  <span className="text-trust-600">Admin Email:</span>
                  <span className="font-extrabold text-trust-900 bg-white px-2 py-0.5 rounded border border-trust-200 truncate max-w-[200px]">
                    {admin.email}
                  </span>
                </div>

                <div className="flex justify-between font-mono">
                  <span className="text-trust-600">Password:</span>
                  <span className="font-extrabold text-sapphire-900 bg-white px-2 py-0.5 rounded border border-trust-200">
                    {admin.password || 'Admin@123'}
                  </span>
                </div>
              </div>

              {/* Google OAuth Access Control Switch */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-sans">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${admin.allowGoogleLogin !== false ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`} />
                  <div>
                    <span className="font-extrabold text-blue-900 block text-xs">Login with Google</span>
                    <span className="text-[10px] text-blue-700 font-bold">
                      {admin.allowGoogleLogin !== false ? '✓ Google OAuth Allowed' : '⛔ Password Only (Google Disabled)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAdminGoogleLogin(admin.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${admin.allowGoogleLogin !== false ? 'bg-blue-600' : 'bg-slate-300'}`}
                  title="Toggle Login with Google for this Admin"
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${admin.allowGoogleLogin !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] font-sans animate-fade-in">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-sm sm:text-lg text-trust-900">Generate Staff Login Credentials</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@navateja.com"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Phone Number (Functions as Staff ID)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9833344556"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            {/* Generated Credentials Card */}
            <div className="p-3 bg-trust-50 border border-trust-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-trust-700 uppercase tracking-wider">Generated Login Credentials</span>
                <button
                  type="button"
                  onClick={handleRegenerateCredentials}
                  className="text-[10px] text-sapphire-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>



              <div>
                <label className="block text-[11px] font-bold text-trust-700 mb-1">Password (Alphanumeric + Special Characters)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Gz@8392!K"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-trust-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700 focus:outline-none"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-trust-400">Includes letters, numbers, and symbols (@#$%!)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Role Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
              >
                <option value="Staff">Field Staff</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>

            {/* Select Assigned Shop Dropdown */}
            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">
                Select Assigned Shop <span className="text-urgency-600">*</span>
              </label>
              <select
                value={selectedShopIds[0] || shops[0]?.id || ''}
                onChange={(e) => setSelectedShopIds([e.target.value])}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-900"
                required
              >
                <option value="" disabled>-- Select Assigned Store Shop --</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.code || 'MAIN'}) {shop.location ? `• ${shop.location}` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-trust-500 mt-1 block">Staff member will submit daily sales for this assigned store location</span>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-trust-100 hover:bg-trust-200 text-trust-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-growth-600 hover:bg-growth-700 text-white text-xs font-bold rounded-xl shadow-growth-glow"
              >
                Save & Create Login Credentials
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] font-sans animate-fade-in">
          <form onSubmit={handleUpdateStaffSubmit} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-sm sm:text-lg text-trust-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sapphire-600" />
                <span>Edit Staff Member Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Phone Number (Staff Login ID)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 bg-trust-50 border border-trust-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Role Title</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
              >
                <option value="Staff">Field Staff</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">
                Select Assigned Shop <span className="text-urgency-600">*</span>
              </label>
              <select
                value={selectedShopIds[0] || shops[0]?.id || ''}
                onChange={(e) => setSelectedShopIds([e.target.value])}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold text-trust-900"
                required
              >
                <option value="" disabled>-- Select Assigned Store Shop --</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.code || 'MAIN'}) {shop.location ? `• ${shop.location}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 bg-trust-100 hover:bg-trust-200 text-trust-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sapphire-600 hover:bg-sapphire-700 text-white text-xs font-bold rounded-xl shadow-sapphire-glow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Admin User Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] font-sans animate-fade-in">
          <form onSubmit={handleCreateAdmin} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-sm sm:text-lg text-trust-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-sapphire-600" />
                <span>Add Business Admin / Manager</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="p-1.5 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Admin Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Admin Email Address (For Google Sign-In)</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. vikram.admin@genz.com"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            {/* Google OAuth Switch Toggle */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Allow Login with Google</span>
                </label>
                <span className="text-[11px] text-blue-700 font-medium block">
                  Permit this Admin to authenticate using Google OAuth
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminAllowGoogleLogin(!adminAllowGoogleLogin)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${adminAllowGoogleLogin ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adminAllowGoogleLogin ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Google OAuth Security Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-800">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Google OAuth Security Protection</span>
              </div>
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                Invited Admins must sign in using <strong>Google Sign-In</strong> with this exact authorized email. Co-Admins are strictly restricted from owner actions (e.g., deleting workspaces or primary admin accounts).
              </p>
            </div>

            {/* Generated Password Card */}
            <div className="p-3 bg-sapphire-50/60 border border-sapphire-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-sapphire-800 uppercase tracking-wider">Admin Login Password</span>
                <button
                  type="button"
                  onClick={handleRegenerateAdminPassword}
                  className="text-[10px] text-sapphire-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>

              <div className="relative">
                <input
                  type={adminShowPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="e.g. Gz@8392!K"
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-sapphire-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAdminShowPassword(!adminShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700 focus:outline-none"
                  title={adminShowPassword ? 'Hide Password' : 'Show Password'}
                >
                  {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-trust-500 block">This user can log into the GenZ Store Admin App with these credentials.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Access Role</label>
              <select
                value={adminRole}
                onChange={(e) => setAdminRole(e.target.value as any)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
              >
                <option value="BUSINESS_ADMIN">Business Admin (Full Rights)</option>
                <option value="CO_ADMIN">Co-Admin (Store Operations)</option>
                <option value="MANAGER">Store Manager (View & Review)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 bg-trust-100 hover:bg-trust-200 text-trust-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sapphire-600 hover:bg-sapphire-700 text-white text-xs font-bold rounded-xl shadow-sapphire-glow"
              >
                Create Admin User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Admin User Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] font-sans animate-fade-in">
          <form onSubmit={handleUpdateAdminSubmit} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full max-h-[88dvh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trust-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-sm sm:text-lg text-trust-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sapphire-600" />
                <span>Edit Admin Account Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="p-1.5 rounded-xl bg-trust-100 text-trust-600 hover:text-trust-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Admin Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Admin Email Address (For Google Sign-In)</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            {/* Google OAuth Switch Toggle */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Allow Login with Google</span>
                </label>
                <span className="text-[11px] text-blue-700 font-medium block">
                  Permit this Admin to authenticate using Google OAuth
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminAllowGoogleLogin(!adminAllowGoogleLogin)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${adminAllowGoogleLogin ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adminAllowGoogleLogin ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Password Card */}
            <div className="p-3 bg-sapphire-50/60 border border-sapphire-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-sapphire-800 uppercase tracking-wider">Admin Login Password</span>
                <button
                  type="button"
                  onClick={handleRegenerateAdminPassword}
                  className="text-[10px] text-sapphire-600 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Generate
                </button>
              </div>

              <div className="relative">
                <input
                  type={adminShowPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-sapphire-300 rounded-xl text-xs font-extrabold font-mono text-sapphire-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAdminShowPassword(!adminShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-trust-400 hover:text-trust-700 focus:outline-none"
                >
                  {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Access Role</label>
              <select
                value={adminRole}
                onChange={(e) => setAdminRole(e.target.value as any)}
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
              >
                <option value="BUSINESS_ADMIN">Business Admin (Full Rights)</option>
                <option value="CO_ADMIN">Co-Admin (Store Operations)</option>
                <option value="MANAGER">Store Manager (View & Review)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 bg-trust-100 hover:bg-trust-200 text-trust-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sapphire-600 hover:bg-sapphire-700 text-white text-xs font-bold rounded-xl shadow-sapphire-glow"
              >
                Save Admin Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
