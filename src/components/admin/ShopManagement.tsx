import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shop } from '../../types';
import { Store, Plus, MapPin, Phone, AlertCircle, Trash2, Edit3, X } from 'lucide-react';

export const ShopManagement: React.FC = () => {
  const { shops, addShop, updateShop, deleteShop, checkEntitlement } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const entitlement = checkEntitlement('shops');

  const openAddModal = () => {
    setName('');
    setCode('');
    setLocation('');
    setContact('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (shop: Shop) => {
    setEditingShop(shop);
    setName(shop.name);
    setCode(shop.code || '');
    setLocation(shop.location || '');
    setContact(shop.contact || '');
    setErrorMsg('');
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (window.confirm(`Are you sure you want to delete store shop "${shopName}"?`)) {
      const res = await deleteShop(shopId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await addShop({
      name,
      code,
      location,
      contact,
      status: 'ACTIVE',
      assignedStaffIds: ['staff_01']
    });

    if (res.success) {
      setShowAddModal(false);
      setName('');
      setCode('');
      setLocation('');
      setContact('');
    } else {
      setErrorMsg(res.message || 'Error creating shop');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    setErrorMsg('');

    const res = await updateShop(editingShop.id, {
      name,
      code,
      location,
      contact
    });

    if (res.success) {
      setEditingShop(null);
      setName('');
      setCode('');
      setLocation('');
      setContact('');
    } else {
      setErrorMsg(res.message || 'Error updating shop');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-trust-200 shadow-psychology flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-trust-900">Shop Management</h1>
          <p className="text-xs text-trust-500 mt-0.5">
            Manage business retail locations ({shops.length} active shops)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-sapphire-600 hover:bg-sapphire-700 text-white font-bold text-xs rounded-xl shadow-sapphire-glow transition-all flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Shop</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {shops.length === 0 ? (
          <div className="md:col-span-2 p-12 bg-white rounded-3xl border border-dashed border-trust-300 text-center space-y-3">
            <Store className="w-10 h-10 text-trust-300 mx-auto" />
            <h3 className="font-extrabold text-trust-800 text-sm">No Store Outlets / Shops Added Yet</h3>
            <p className="text-xs text-trust-400 max-w-sm mx-auto">
              Click "Add New Shop" to add your store branch locations.
            </p>
          </div>
        ) : (
          shops.map(shop => (
            <div key={shop.id} className="p-5 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sapphire-100 text-sapphire-600 flex items-center justify-center font-bold text-base">
                    {shop.code ? shop.code.substring(0, 3) : 'SHP'}
                  </div>
                  <div>
                    <h3 className="font-bold text-trust-900 text-base">{shop.name}</h3>
                    <p className="text-xs text-trust-500 font-mono">Code: {shop.code || 'MAIN'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Edit Shop Button */}
                  <button
                    onClick={() => openEditModal(shop)}
                    className="p-1.5 rounded-lg bg-sapphire-50 hover:bg-sapphire-100 text-sapphire-600 border border-sapphire-200 transition-all text-xs"
                    title={`Edit ${shop.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Shop Button */}
                  <button
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="p-1.5 rounded-lg bg-urgency-50 hover:bg-urgency-100 text-urgency-600 border border-urgency-200 transition-all text-xs"
                    title={`Delete ${shop.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-trust-600 pt-2 border-t border-trust-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-trust-400 shrink-0" />
                  <span>{shop.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-trust-400 shrink-0" />
                  <span>{shop.contact}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-trust-500 border-t border-trust-100">
                <span>Assigned Staff: <strong>{shop.assignedStaffIds ? shop.assignedStaffIds.length : 0} members</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-fade-in">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up relative">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-trust-900">Add New Shop</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-trust-100 text-trust-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metro Branch"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Shop Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MTR-05"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Location Address</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Center Mall, 2nd Floor"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98765 43214"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-trust-200 text-trust-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sapphire-600 text-white text-xs font-bold rounded-xl shadow"
              >
                Create Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Shop Modal */}
      {editingShop && (
        <div className="fixed inset-0 z-50 bg-trust-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-fade-in">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl max-w-[92vw] sm:max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-trust-200 animate-scale-up relative">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-trust-900">Edit Shop Details</h3>
              <button type="button" onClick={() => setEditingShop(null)} className="p-1 rounded-lg hover:bg-trust-100 text-trust-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-urgency-50 border border-urgency-200 text-urgency-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-urgency-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Metro Branch"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Shop Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. MTR-05"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Location Address</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City Center Mall, 2nd Floor"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-trust-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98765 43214"
                className="w-full p-2.5 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingShop(null)}
                className="px-4 py-2 bg-trust-200 text-trust-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sapphire-600 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
