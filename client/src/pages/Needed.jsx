import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Download } from 'lucide-react';
import NeededItemsTable from '../components/NeededItemsTable';
import SupportSection from '../components/SupportSection';
import SupportersWall from '../components/SupportersWall';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Needed({ settings, onShowToast }) {
  const [neededItems, setNeededItems] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Donation modal
  const [pledgeItem, setPledgeItem] = useState(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donor_name: '',
    donor_phone: '',
    donor_email: '',
    amount: '',
    payment_method: 'UPI',
    transaction_ref: '',
    notes: ''
  });
  const [donationReceipt, setDonationReceipt] = useState(null);

  // Admin Modals
  const [editNeedOpen, setEditNeedOpen] = useState(false);
  const [currentNeed, setCurrentNeed] = useState(null);

  const [editSupporterOpen, setEditSupporterOpen] = useState(false);
  const [currentSupporter, setCurrentSupporter] = useState(null);

  const { adminUser } = useAdminAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.getNeededItems(), api.getSupporters()])
      .then(([items, supps]) => {
        setNeededItems(items);
        setSupporters(supps);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    onShowToast?.({ type: 'success', message: `${label} copied to clipboard!` });
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...donationForm,
        needed_item_id: pledgeItem ? pledgeItem.id : (donationForm.needed_item_id || null),
        quantity_donated: pledgeItem ? Number(donationForm.quantity_donated || 1) : null
      };
      const res = await api.recordDonation(payload);
      setDonationReceipt(res.receipt);
      onShowToast?.({ 
        type: 'success', 
        message: res.updated_need 
          ? `Thank you! Your donation was matched to "${res.updated_need.item_name}" (${res.updated_need.quantity_received}/${res.updated_need.quantity_needed} received). Need automatically updated!`
          : 'Thank you! Your donation was recorded.' 
      });
      fetchData(); // Refresh needed items table so quantities update live!
      setDonationForm({
        donor_name: '',
        donor_phone: '',
        donor_email: '',
        amount: '',
        payment_method: 'UPI',
        transaction_ref: '',
        notes: '',
        needed_item_id: null,
        quantity_donated: 1
      });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleSaveNeed = async (e) => {
    e.preventDefault();
    try {
      if (currentNeed.id) {
        await api.updateNeededItem(currentNeed.id, currentNeed);
        onShowToast?.({ type: 'success', message: 'Item updated' });
      } else {
        await api.createNeededItem(currentNeed);
        onShowToast?.({ type: 'success', message: 'Need item added' });
      }
      setEditNeedOpen(false);
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleDeleteNeed = async (id) => {
    if (!window.confirm('Delete this item from needed list?')) return;
    try {
      await api.deleteNeededItem(id);
      onShowToast?.({ type: 'success', message: 'Item removed' });
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleSaveSupporter = async (e) => {
    e.preventDefault();
    try {
      if (currentSupporter.id) {
        await api.updateSupporter(currentSupporter.id, currentSupporter);
        onShowToast?.({ type: 'success', message: 'Supporter profile updated' });
      } else {
        await api.createSupporter(currentSupporter);
        onShowToast?.({ type: 'success', message: 'New supporter added' });
      }
      setEditSupporterOpen(false);
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleDeleteSupporter = async (id) => {
    if (!window.confirm('Remove supporter profile?')) return;
    try {
      await api.deleteSupporter(id);
      onShowToast?.({ type: 'success', message: 'Supporter removed' });
      fetchData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <NeededItemsTable
        neededItems={neededItems}
        adminUser={adminUser}
        onPledge={(item) => {
          setPledgeItem(item);
          const perUnit = Math.max(1, Math.round((item.estimated_price || 1000) / (item.quantity_needed || 1)));
          setDonationForm({
            ...donationForm,
            amount: perUnit,
            needed_item_id: item.id,
            quantity_donated: 1,
            notes: `Sponsoring 1 unit of: ${item.item_name}`
          });
          setDonationModalOpen(true);
        }}
        onAddNeed={() => {
          setCurrentNeed({
            item_name: '',
            category: 'Education',
            quantity_needed: 10,
            quantity_received: 0,
            estimated_price: 5000,
            urgency: 'High',
            description: ''
          });
          setEditNeedOpen(true);
        }}
        onEditNeed={(item) => {
          setCurrentNeed(item);
          setEditNeedOpen(true);
        }}
        onDeleteNeed={handleDeleteNeed}
      />

      <SupportSection
        settings={settings}
        onOpenDonationModal={() => {
          setPledgeItem(null);
          setDonationModalOpen(true);
        }}
        onCopy={handleCopy}
      />

      <SupportersWall
        supporters={supporters}
        adminUser={adminUser}
        onAddSupporter={() => {
          setCurrentSupporter({
            name: '',
            occupation: '',
            support_type: '',
            photo_url: '',
            message: '',
            date_supported: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          });
          setEditSupporterOpen(true);
        }}
        onEditSupporter={(sup) => {
          setCurrentSupporter(sup);
          setEditSupporterOpen(true);
        }}
        onDeleteSupporter={handleDeleteSupporter}
      />

      {/* Donation Register Modal */}
      {donationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {pledgeItem ? `Sponsor Need: ${pledgeItem.item_name}` : 'Register Donation & Generate Receipt'}
                </h3>
                <p className="text-xs text-slate-500">
                  {pledgeItem 
                    ? 'Your donation will directly reduce our hostel requirement.' 
                    : 'Records your donation in our official register for tax compliance.'}
                </p>
              </div>
              <button 
                onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matched Need Info Banner */}
            {pledgeItem && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Auto-Synced Need Item</span>
                  </span>
                  <span className="bg-emerald-200/70 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pledgeItem.category}
                  </span>
                </div>
                <p className="text-slate-600">
                  Current progress: <strong>{pledgeItem.quantity_received}</strong> of <strong>{pledgeItem.quantity_needed}</strong> units collected.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="font-semibold text-emerald-900">
                    Units sponsoring:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, (pledgeItem.quantity_needed || 10) - (pledgeItem.quantity_received || 0))}
                    value={donationForm.quantity_donated || 1}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value) || 1);
                      const unitCost = Math.max(1, Math.round((pledgeItem.estimated_price || 1000) / (pledgeItem.quantity_needed || 1)));
                      setDonationForm({
                        ...donationForm,
                        quantity_donated: qty,
                        amount: unitCost * qty,
                        notes: `Sponsoring ${qty} unit(s) of: ${pledgeItem.item_name}`
                      });
                    }}
                    className="w-20 p-1.5 bg-white border border-emerald-300 rounded-lg text-center font-bold text-emerald-900"
                  />
                  <span className="text-slate-500 text-[11px]">
                    (₹{Math.max(1, Math.round((pledgeItem.estimated_price || 1000) / (pledgeItem.quantity_needed || 1)))}/unit)
                  </span>
                </div>
              </div>
            )}

            {donationReceipt ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold font-serif text-slate-900">Donation Acknowledged!</h4>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-sm mx-auto shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt No:</span>
                    <span className="font-mono font-bold text-blue-600">{donationReceipt.receipt_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donor Name:</span>
                    <span className="font-bold text-slate-800">{donationReceipt.donor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-bold text-blue-600 font-mono">₹{donationReceipt.amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>
                  <button onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-md">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDonationSubmit} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Donor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={donationForm.donor_name}
                    onChange={e => setDonationForm({ ...donationForm, donor_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={donationForm.donor_phone}
                      onChange={e => setDonationForm({ ...donationForm, donor_phone: e.target.value })}
                      placeholder="+91 98300 00000"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={donationForm.donor_email}
                      onChange={e => setDonationForm({ ...donationForm, donor_email: e.target.value })}
                      placeholder="donor@example.com"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contribution Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={donationForm.amount}
                      onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={donationForm.payment_method}
                      onChange={e => setDonationForm({ ...donationForm, payment_method: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash / Cheque">Cash / Cheque</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / UTR No (Optional)</label>
                  <input
                    type="text"
                    value={donationForm.transaction_ref}
                    onChange={e => setDonationForm({ ...donationForm, transaction_ref: e.target.value })}
                    placeholder="e.g. UPI/40892341209"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Personal Message / Dedication</label>
                  <textarea
                    rows="2"
                    value={donationForm.notes}
                    onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                    placeholder="e.g. For students' education and nutrition"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                  <button type="button" onClick={() => setDonationModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition">
                    Confirm & Record Donation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Add/Edit Need Modal */}
      {editNeedOpen && currentNeed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentNeed.id ? 'Edit Needed Item' : 'Add New Needed Item'}
              </h3>
              <button onClick={() => setEditNeedOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNeed} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={currentNeed.item_name}
                  onChange={e => setCurrentNeed({ ...currentNeed, item_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={currentNeed.category}
                    onChange={e => setCurrentNeed({ ...currentNeed, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={currentNeed.urgency || 'High'}
                    onChange={e => setCurrentNeed({ ...currentNeed, urgency: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.quantity_needed}
                    onChange={e => setCurrentNeed({ ...currentNeed, quantity_needed: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.estimated_price}
                    onChange={e => setCurrentNeed({ ...currentNeed, estimated_price: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={currentNeed.description}
                  onChange={e => setCurrentNeed({ ...currentNeed, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setEditNeedOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Supporter Modal */}
      {editSupporterOpen && currentSupporter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentSupporter.id ? 'Edit Supporter' : 'Add Supporter Profile'}
              </h3>
              <button onClick={() => setEditSupporterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSupporter} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supporter Name *</label>
                <input
                  type="text"
                  required
                  value={currentSupporter.name}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={currentSupporter.occupation}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, occupation: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Contribution *</label>
                <input
                  type="text"
                  required
                  value={currentSupporter.support_type}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, support_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={currentSupporter.photo_url}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, photo_url: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows="2"
                  value={currentSupporter.message}
                  onChange={e => setCurrentSupporter({ ...currentSupporter, message: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button type="button" onClick={() => setEditSupporterOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow">
                  Save Supporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
