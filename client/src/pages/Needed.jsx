import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, Download, Handshake, Heart, Clock } from 'lucide-react';
import NeededItemsTable from '../components/NeededItemsTable';
import SupportSection from '../components/SupportSection';
import SupportersWall from '../components/SupportersWall';
import { api, subscribeToRealtimeSync } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Needed({ settings, onShowToast }) {
  const [neededItems, setNeededItems] = useState([]);
  const [supporters, setSupporters] = useState([]);

  // Donation / Pledge modal
  const [pledgeItem, setPledgeItem] = useState(null);
  const [modalMode, setModalMode] = useState('donate'); // 'donate' | 'pledge'
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationForm, setDonationForm] = useState({
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
  const [donationReceipt, setDonationReceipt] = useState(null);

  // Admin Modals
  const [editNeedOpen, setEditNeedOpen] = useState(false);
  const [currentNeed, setCurrentNeed] = useState(null);

  const [editSupporterOpen, setEditSupporterOpen] = useState(false);
  const [currentSupporter, setCurrentSupporter] = useState(null);

  const { adminUser } = useAdminAuth();

  const fetchData = useCallback(() => {
    Promise.all([
      api.getNeededItems(), 
      api.getSupporters(),
      api.getDonations().catch(() => [])
    ])
      .then(([items, supps, donationsList]) => {
        const rawItems = Array.isArray(items) && items.length > 0 ? items : [];
        const donList = Array.isArray(donationsList) ? donationsList : [];

        // Dynamically compute live quantity_received based strictly on confirmed donations
        // Pledges that are still pending verification do NOT count towards received!
        const computedItems = rawItems.map(item => {
          const matchingConfirmedDonations = donList.filter(d => {
            const matchesId = d.needed_item_id && String(d.needed_item_id) === String(item.id);
            const donName = d.linked_need_title || d.item_name;
            const matchesName = donName && item.item_name && 
              donName.toLowerCase().trim() === item.item_name.toLowerCase().trim();
            const isMatch = matchesId || matchesName;

            // Only count if confirmed (or direct donation). Pending pledges are excluded!
            const isConfirmed = d.status === 'Confirmed' || 
                                (d.entry_type === 'Direct Donation' && d.status !== 'Cancelled') ||
                                (!d.status && !d.entry_type);
            return isMatch && isConfirmed;
          });

          const confirmedQty = matchingConfirmedDonations.reduce((sum, d) => sum + (Number(d.quantity_donated) || 1), 0);
          const totalReceived = Math.max(Number(item.quantity_received) || 0, confirmedQty);
          const isFulfilled = totalReceived >= Number(item.quantity_needed);

          return {
            ...item,
            quantity_received: totalReceived,
            is_fulfilled: isFulfilled
          };
        });

        setNeededItems(computedItems);
        setSupporters(supps || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'NEEDED_UPDATED' || event.type === 'DONATIONS_UPDATED') {
        console.log('[REAL-TIME SYNC] Needs/Donations updated, re-computing live counts...');
        fetchData();
      }
    });

    // 3-second active polling interval: updates automatically across mobile and desktop
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    // Instant update whenever user switches back to this tab or unlocks mobile phone screen
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchData]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    onShowToast?.({ type: 'success', message: `${label} copied to clipboard!` });
  };

  const handleOpenModal = (item, mode = 'donate') => {
    setPledgeItem(item);
    setModalMode(mode);
    setDonationReceipt(null);

    const unitCost = item 
      ? Math.max(1, Math.round((item.estimated_price || 1000) / (item.quantity_needed || 1)))
      : 1000;

    setDonationForm({
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      amount: unitCost,
      payment_method: mode === 'pledge' ? 'Pledge to Deliver Items' : 'UPI',
      transaction_ref: '',
      notes: mode === 'pledge' 
        ? `Pledge commitment for 1 unit of: ${item?.item_name || 'General Need'}` 
        : `Direct contribution for 1 unit of: ${item?.item_name || 'General Need'}`,
      needed_item_id: item?.id || null,
      quantity_donated: 1
    });
    setDonationModalOpen(true);
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    try {
      const isPledge = modalMode === 'pledge';
      const qty = pledgeItem ? Number(donationForm.quantity_donated || 1) : 1;
      const payload = {
        ...donationForm,
        entry_type: isPledge ? 'Pledge' : 'Direct Donation',
        status: isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed',
        needed_item_id: pledgeItem ? pledgeItem.id : (donationForm.needed_item_id || null),
        linked_need_title: pledgeItem ? pledgeItem.item_name : (donationForm.linked_need_title || null),
        quantity_donated: qty
      };

      // Optimistically increment received quantity immediately for direct donation
      if (!isPledge && payload.needed_item_id) {
        setNeededItems(prev => prev.map(item => {
          if (String(item.id) === String(payload.needed_item_id)) {
            const newRec = (Number(item.quantity_received) || 0) + qty;
            return {
              ...item,
              quantity_received: newRec,
              is_fulfilled: newRec >= (Number(item.quantity_needed) || 1)
            };
          }
          return item;
        }));
      }

      const res = await api.recordDonation(payload);
      const receiptData = res?.receipt || res?.donation || res || payload;
      setDonationReceipt(receiptData);

      if (isPledge) {
        onShowToast?.({ 
          type: 'success', 
          title: 'Pledge Commitment Registered',
          message: 'Thank you for your generous pledge! As required, received units will remain unchanged until our administrator speaks with you and confirms receipt.' 
        });
      } else {
        onShowToast?.({ 
          type: 'success', 
          title: 'Donation Received & Count Updated',
          message: res.updated_need 
            ? `Thank you! Your donation was matched to "${res.updated_need.item_name}" (${res.updated_need.quantity_received}/${res.updated_need.quantity_needed} received). Need automatically updated!`
            : 'Thank you! Your donation was recorded and inventory updated.' 
        });
      }

      fetchData(false); // Background refresh
      setDonationForm({
        donor_name: '',
        donor_phone: '',
        donor_email: '',
        amount: '',
        payment_method: isPledge ? 'Pledge to Deliver Items' : 'UPI',
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
    const isEdit = Boolean(currentNeed.id);
    const needToSave = { ...currentNeed };
    setEditNeedOpen(false);

    if (isEdit) {
      setNeededItems(prev => prev.map(item => String(item.id) === String(needToSave.id) ? { ...item, ...needToSave } : item));
      onShowToast?.({ type: 'success', message: 'Item updated' });
    } else {
      const tempItem = { ...needToSave, id: Date.now() };
      setNeededItems(prev => [...prev, tempItem]);
      onShowToast?.({ type: 'success', message: 'Need item added' });
    }

    try {
      if (isEdit) {
        await api.updateNeededItem(needToSave.id, needToSave);
      } else {
        await api.createNeededItem(needToSave);
      }
      fetchData(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
      fetchData(false);
    }
  };

  const handleDeleteNeed = async (id) => {
    if (!window.confirm('Delete this item from needed list?')) return;
    setNeededItems(prev => prev.filter(item => String(item.id) !== String(id)));
    onShowToast?.({ type: 'success', message: 'Item removed' });

    try {
      await api.deleteNeededItem(id);
      fetchData(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
      fetchData(false);
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
        onDirectDonate={(item) => handleOpenModal(item, 'donate')}
        onMakePledge={(item) => handleOpenModal(item, 'pledge')}
        onPledge={(item, mode = 'donate') => handleOpenModal(item, mode)}
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
        onOpenDonationModal={() => handleOpenModal(null, 'donate')}
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

      {/* Donation / Pledge Modal */}
      {donationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center space-x-2">
                  {modalMode === 'pledge' ? (
                    <>
                      <Handshake className="w-5 h-5 text-amber-600 inline" />
                      <span>Make a Pledge Commitment</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 text-emerald-600 inline" />
                      <span>Direct Donation & Support</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pledgeItem ? `Item: ${pledgeItem.item_name}` : 'Support RISE A CHILD CHILDREN HOME'}
                </p>
              </div>
              <button 
                onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Explanation Banner */}
            {modalMode === 'pledge' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs space-y-1.5 text-amber-900">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Pledge Policy: Admin Verification Required</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Thank you for promising to sponsor this item! <strong>Received units will NOT change</strong> right now. Our administrator (Bro. Nelson) will call you to coordinate delivery/payment, and upon receipt, will confirm it in the Admin console to increment the count.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-1.5 text-emerald-950">
                <div className="flex items-center space-x-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Direct Donation: Instant Inventory Update</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Your direct donation will <strong>immediately increment the received count</strong> and decrease the remaining requirement in real-time across all devices.
                </p>
              </div>
            )}

            {/* Matched Need Info */}
            {pledgeItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {pledgeItem.item_name}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pledgeItem.category}
                  </span>
                </div>
                <p className="text-slate-600">
                  Progress: <strong>{pledgeItem.quantity_received || 0}</strong> of <strong>{pledgeItem.quantity_needed}</strong> units collected.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="font-semibold text-slate-800">
                    Units {modalMode === 'pledge' ? 'pledging' : 'sponsoring'}:
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
                        notes: modalMode === 'pledge'
                          ? `Pledge commitment for ${qty} unit(s) of: ${pledgeItem.item_name}`
                          : `Direct contribution for ${qty} unit(s) of: ${pledgeItem.item_name}`
                      });
                    }}
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                  />
                  <span className="text-slate-500 text-[11px]">
                    (≈ ₹{Math.max(1, Math.round((pledgeItem.estimated_price || 1000) / (pledgeItem.quantity_needed || 1)))}/unit)
                  </span>
                </div>
              </div>
            )}

            {donationReceipt ? (
              <div className="text-center space-y-4 py-3">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-sm ${
                  modalMode === 'pledge' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {modalMode === 'pledge' ? (
                    <Handshake className="w-9 h-9" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10" />
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold font-serif text-slate-900">
                    {modalMode === 'pledge' ? 'Pledge Registered!' : 'Donation Confirmed!'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {modalMode === 'pledge'
                      ? 'Our administrator Bro. Nelson will call you shortly to confirm and coordinate receipt.'
                      : 'Your contribution was recorded and received units increased immediately.'}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-sm mx-auto shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference No:</span>
                    <span className="font-mono font-bold text-blue-600">{donationReceipt.receipt_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Record Type:</span>
                    <span className={`font-bold ${modalMode === 'pledge' ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {donationReceipt.entry_type || (modalMode === 'pledge' ? 'Pledge Commitment' : 'Direct Donation')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donor Name:</span>
                    <span className="font-bold text-slate-800">{donationReceipt.donor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Units:</span>
                    <span className="font-bold text-slate-800">{donationReceipt.quantity_donated || 1} unit(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      modalMode === 'pledge' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {donationReceipt.status || (modalMode === 'pledge' ? 'Pending Admin Verification' : 'Confirmed')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                  <a
                    href={`https://wa.me/919059491777?text=${encodeURIComponent(
                      modalMode === 'pledge'
                        ? `Hello Bro. Nelson A, I have made a PLEDGE of ${donationReceipt.quantity_donated || 1} units of "${donationReceipt.linked_need_title || donationReceipt.item_name || 'Materials'}" for RISE A CHILD CHILDREN HOME (Ref: ${donationReceipt.receipt_no}, Name: ${donationReceipt.donor_name}). Please let me know how to deliver/transfer.`
                        : `Hello Bro. Nelson A, I have recorded a direct donation of ₹${donationReceipt.amount} for RISE A CHILD CHILDREN HOME (Receipt No: ${donationReceipt.receipt_no}, Donor: ${donationReceipt.donor_name}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <span>WhatsApp Founder (+91 90594 91777)</span>
                  </a>
                  <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                  <button 
                    onClick={() => { setDonationModalOpen(false); setDonationReceipt(null); }} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDonationSubmit} className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number (For Verification Call) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={donationForm.donor_phone}
                      onChange={e => setDonationForm({ ...donationForm, donor_phone: e.target.value })}
                      placeholder="+91 90594 XXXXX"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
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
                    <label className="block font-semibold text-slate-700 mb-1">
                      {modalMode === 'pledge' ? 'Pledged Value / Amount (₹)' : 'Contribution Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      required={modalMode !== 'pledge'}
                      min="0"
                      value={donationForm.amount}
                      onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {modalMode === 'pledge' ? 'Pledge Fulfillment Mode' : 'Payment Method'}
                    </label>
                    <select
                      value={donationForm.payment_method}
                      onChange={e => setDonationForm({ ...donationForm, payment_method: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      {modalMode === 'pledge' ? (
                        <>
                          <option value="Pledge to Deliver Items">Promise to bring/deliver physical goods</option>
                          <option value="Pledge to Pay Later">Promise to pay/transfer in coming days</option>
                          <option value="UPI">UPI / QR Code Transfer</option>
                          <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                          <option value="Cash / In-Person">Cash / In-Person Visit</option>
                        </>
                      ) : (
                        <>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Google Pay">Google Pay</option>
                          <option value="PhonePe">PhonePe</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash / Cheque">Cash / Cheque</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                  <textarea
                    rows="2"
                    value={donationForm.notes}
                    onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                    placeholder={modalMode === 'pledge' ? 'e.g. Will bring items on Sunday afternoon' : 'e.g. For children nutrition and schooling'}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setDonationModalOpen(false)} 
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                  {modalMode === 'pledge' ? (
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition flex items-center space-x-1.5"
                    >
                      <Handshake className="w-4 h-4" />
                      <span>Register Pledge (Pending Verification)</span>
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition flex items-center space-x-1.5"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Confirm & Record Donation</span>
                    </button>
                  )}
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
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Needed *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.quantity_needed}
                    onChange={e => setCurrentNeed({ ...currentNeed, quantity_needed: Number(e.target.value) || 1 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentNeed.estimated_price}
                    onChange={e => setCurrentNeed({ ...currentNeed, estimated_price: Number(e.target.value) || 0 })}
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
