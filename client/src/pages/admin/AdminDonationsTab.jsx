import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, Heart, RefreshCw, Plus, 
  CheckCircle2, AlertCircle, ArrowUpRight, Search, 
  Filter, Calendar, ExternalLink, Phone, MessageSquare, Trash2,
  Clock, Handshake, Check, XCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDonationsTab({ onShowToast }) {
  const [donations, setDonations] = useState([]);
  const [neededItems, setNeededItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending_pledges' | 'confirmed_pledges' | 'direct_donations' | 'matched'
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    donor_name: '',
    donor_phone: '',
    donor_email: '',
    entry_type: 'Direct Donation', // 'Direct Donation' | 'Pledge'
    amount: '',
    payment_method: 'UPI',
    transaction_ref: '',
    notes: '',
    needed_item_id: '',
    quantity_donated: 1
  };
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [donationsData, neededData] = await Promise.all([
        api.getDonations(),
        api.getNeeded()
      ]);
      setDonations(donationsData || []);
      setNeededItems(neededData || []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to load donations audit: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmPledge = async (donation) => {
    try {
      setLoading(true);
      const res = await api.confirmPledge(donation.id || donation._cloud_id);
      onShowToast?.({
        type: 'success',
        title: 'Pledge Confirmed & Added to Inventory',
        message: res.message || 'Pledge confirmed! Received units have been increased.'
      });
      await loadData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to confirm pledge: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPledge = async (donation) => {
    if (!window.confirm(`Cancel pledge from ${donation.donor_name}? If previously counted, received units will be decreased.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.cancelPledge(donation.id || donation._cloud_id);
      onShowToast?.({
        type: 'info',
        title: 'Pledge Cancelled',
        message: res.message || 'Pledge commitment has been cancelled.'
      });
      await loadData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to cancel pledge: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDonation = async (e) => {
    e.preventDefault();
    if (!form.donor_name.trim()) {
      onShowToast?.({ type: 'error', message: 'Donor name is required' });
      return;
    }

    try {
      setSubmitting(true);
      const isPledge = form.entry_type === 'Pledge';
      const res = await api.createDonation({
        ...form,
        amount: Number(form.amount) || 0,
        quantity_donated: Number(form.quantity_donated) || 1,
        needed_item_id: form.needed_item_id ? Number(form.needed_item_id) : null,
        status: isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed'
      });

      onShowToast?.({
        type: 'success',
        title: isPledge ? 'Pledge Registered (Pending Call)' : 'Donation Recorded & Count Updated',
        message: res.message || 'Entry successfully recorded into registry.'
      });

      setModalOpen(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const matchedDonations = donations.filter(d => !!d.needed_item_id || !!d.linked_need_title);

  const pendingPledges = donations.filter(d => {
    const isPledgeType = d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge');
    return isPledgeType && d.status !== 'Confirmed' && d.status !== 'Cancelled';
  });

  const confirmedPledges = donations.filter(d => {
    return d.entry_type === 'Pledge' && d.status === 'Confirmed';
  });

  const directDonations = donations.filter(d => {
    return d.entry_type === 'Direct Donation' || (!d.entry_type && !String(d.status || '').toLowerCase().includes('pledge'));
  });

  const displayedDonations = donations.filter(d => {
    if (filterMode === 'pending_pledges') {
      const isPledgeType = d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge');
      return isPledgeType && d.status !== 'Confirmed' && d.status !== 'Cancelled';
    }
    if (filterMode === 'confirmed_pledges') {
      return d.entry_type === 'Pledge' && d.status === 'Confirmed';
    }
    if (filterMode === 'direct_donations') {
      return d.entry_type === 'Direct Donation' || (!d.entry_type && !String(d.status || '').toLowerCase().includes('pledge'));
    }
    if (filterMode === 'matched') return !!d.needed_item_id || !!d.linked_need_title;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>Pledges & Direct Donations Manager</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Donations & Pledge Verification Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Direct donations increase received items immediately. Pledges remain pending until you call and confirm them here.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Offline Gift / Pledge</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Pledges alert card */}
        <div className={`glass-card rounded-2xl p-5 border transition ${
          pendingPledges.length > 0 ? 'border-amber-300 bg-amber-50/40 shadow-xs' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900">Pending Pledges</span>
            {pendingPledges.length > 0 && (
              <span className="animate-pulse bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Needs Admin Call
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-900">
              {pendingPledges.length}
            </span>
            <span className="text-xs text-amber-700 font-semibold">To Verify</span>
          </div>
          <p className="text-[11px] text-amber-800 mt-1">Call donor & click "Confirm Pledge" to add to received</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-100 bg-emerald-50/20">
          <span className="text-xs font-bold uppercase text-emerald-800">Direct Donations Logged</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700">
              {directDonations.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Immediate</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Auto-incremented to received inventory</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-500">Total Funds Collected</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 font-medium">INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct gifts & fulfilled commitments</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMode === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Records ({donations.length})
        </button>

        <button
          onClick={() => setFilterMode('pending_pledges')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            filterMode === 'pending_pledges'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-800 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Pledges ({pendingPledges.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('direct_donations')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            filterMode === 'direct_donations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Direct Donations ({directDonations.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('confirmed_pledges')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            filterMode === 'confirmed_pledges'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirmed Pledges ({confirmedPledges.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('matched')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            filterMode === 'matched'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-700 hover:bg-purple-50'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Cross-Checked Needs ({matchedDonations.length})</span>
        </button>
      </div>

      {/* Donations Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm">Loading records...</p>
          </div>
        ) : displayedDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Records In This View</h3>
            <p className="text-xs text-slate-500 mt-1">Switch filter or record a new donation/pledge.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            {/* Mobile swipe helper */}
            <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
              <span>Donations & Pledges Ledger</span>
              <span className="font-semibold text-emerald-700">← Swipe table sideways →</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] sm:text-xs uppercase">
                  <tr>
                    <th className="p-3 sm:p-4 whitespace-nowrap">Receipt / Donor</th>
                    <th className="p-3 sm:p-4 whitespace-nowrap">Type & Status</th>
                    <th className="p-3 sm:p-4 min-w-[140px]">Linked Need Item</th>
                    <th className="p-3 sm:p-4 whitespace-nowrap">Units / Amount</th>
                    <th className="p-3 sm:p-4 whitespace-nowrap">Date</th>
                    <th className="p-3 sm:p-4 text-right whitespace-nowrap">Admin Actions & Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {displayedDonations.map((d) => {
                  const isMatched = !!d.needed_item_id || !!d.linked_need_title;
                  const donorPhone = (d.donor_phone || '').trim();
                  const isPledge = d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge');
                  const isPending = isPledge && d.status !== 'Confirmed' && d.status !== 'Cancelled';
                  const isConfirmedPledge = isPledge && d.status === 'Confirmed';
                  const isCancelled = d.status === 'Cancelled';

                  return (
                    <tr 
                      key={d.id || d._cloud_id} 
                      className={`hover:bg-slate-50/50 transition ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{d.donor_name}</div>
                        <div className="text-[11px] text-blue-600 font-mono font-bold">{d.receipt_no || (isPledge ? `PLG-${d.id}` : `REC-${d.id}`)}</div>
                        {donorPhone && (
                          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold mt-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <a href={`tel:${donorPhone}`} className="hover:underline" title="Call Donor">
                              {donorPhone}
                            </a>
                          </div>
                        )}
                        {d.donor_email && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                            {d.donor_email}
                          </div>
                        )}
                        {d.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 max-w-[240px]">
                            "{d.notes}"
                          </p>
                        )}
                      </td>

                      {/* Type & Status Badge */}
                      <td className="p-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pledge (Pending Call)</span>
                          </span>
                        ) : isConfirmedPledge ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pledge Confirmed</span>
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancelled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <Heart className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Direct Donation</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          Method: {d.payment_method || (isPledge ? 'Pledge' : 'UPI')}
                        </div>
                      </td>

                      {/* Linked Need Item */}
                      <td className="p-4">
                        {isMatched ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <PackageCheck className="w-3 h-3 text-emerald-600" />
                              <span>{d.linked_need_title || d.needed_item_name || 'Matched Need'}</span>
                            </span>
                            <div className="text-[11px] text-slate-600 font-medium">
                              Units: <strong>{d.quantity_donated || 1} unit(s)</strong>
                            </div>
                            {isPending && (
                              <div className="text-[10px] text-amber-700 font-bold">
                                * Not added to received yet
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            General Fund
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {d.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : 'In-kind'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {d.quantity_donated || 1} unit(s)
                        </div>
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-mono whitespace-nowrap">
                        {d.created_at ? d.created_at.split(' ')[0] : 'Today'}
                      </td>

                      {/* Admin Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Confirm Pledge button for pending pledges */}
                          {isPending && (
                            <button
                              onClick={() => handleConfirmPledge(d)}
                              className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs shadow-sm transition active:scale-95"
                              title="Click to confirm receipt of pledge and add to received inventory"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Pledge</span>
                            </button>
                          )}

                          {/* Cancel Pledge button */}
                          {isPledge && !isCancelled && (
                            <button
                              onClick={() => handleCancelPledge(d)}
                              className="inline-flex items-center space-x-1 border border-slate-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-xl text-xs transition"
                              title="Cancel pledge commitment"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          )}

                          {/* Call Donor Button */}
                          {donorPhone && (
                            <a
                              href={`tel:${donorPhone}`}
                              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-xl text-xs transition border border-emerald-200"
                              title={`Call ${d.donor_name} at ${donorPhone}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          )}

                          {/* WhatsApp Button */}
                          {donorPhone && (
                            <a
                              href={`https://wa.me/${donorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                isPledge
                                  ? `Dear ${d.donor_name}, greetings from Bro. Nelson (RISE A CHILD CHILDREN HOME). Thank you for your pledge commitment of ${d.quantity_donated || 1} units for "${d.linked_need_title || 'our children'}". Please let us know how we can coordinate delivery or receipt.`
                                  : `Dear ${d.donor_name}, greetings from Brother Nelson (RISE A CHILD CHILDREN HOME). We received your generous donation of ₹${d.amount || 0}. Thank you so much for blessing our children!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-xl text-xs transition border border-emerald-200"
                              title="Send WhatsApp Message"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          {/* Delete Record Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Delete record for ${d.donor_name}? If confirmed, received count on linked item will decrease.`)) return;
                              try {
                                await api.deleteDonation(d.id || d._cloud_id);
                                onShowToast?.({ type: 'success', message: 'Record deleted.' });
                                loadData();
                              } catch (err) {
                                onShowToast?.({ type: 'error', message: err.message });
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Record Offline Donation / Pledge Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    Record Offline Gift or Pledge
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose whether this is an immediate confirmed donation or a pledge commitment
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDonation} className="space-y-3.5 text-xs sm:text-sm">
              {/* Entry Type Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, entry_type: 'Direct Donation' })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                    form.entry_type === 'Direct Donation'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Direct Donation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, entry_type: 'Pledge' })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                    form.entry_type === 'Pledge'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Handshake className="w-3.5 h-3.5" />
                  <span>Pledge Commitment</span>
                </button>
              </div>

              {form.entry_type === 'Pledge' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">
                  <strong>Pledge Note:</strong> Received units will stay unchanged until you speak with the donor and click "Confirm Pledge" later.
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800">
                  <strong>Donation Note:</strong> Will immediately increase received units on the selected item.
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Donor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Mukherjee"
                  value={form.donor_name}
                  onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98300 XXXXX"
                    value={form.donor_phone}
                    onChange={(e) => setForm({ ...form, donor_phone: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="donor@example.com"
                    value={form.donor_email}
                    onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Need Cross-Check Selector */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <label className="block font-bold text-emerald-900">
                  Cross-Check: Match With Hostel Need
                </label>
                <select
                  value={form.needed_item_id}
                  onChange={(e) => setForm({ ...form, needed_item_id: e.target.value })}
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm font-medium"
                >
                  <option value="">-- No specific need (General Donation) --</option>
                  {neededItems.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.item_name} ({n.quantity_received || 0}/{n.quantity_needed} received) - {n.category}
                    </option>
                  ))}
                </select>

                {form.needed_item_id && (
                  <div className="pt-2 flex items-center space-x-3">
                    <label className="text-xs font-semibold text-emerald-800">
                      Quantity of items {form.entry_type === 'Pledge' ? 'pledged' : 'donated'}:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity_donated}
                      onChange={(e) => setForm({ ...form, quantity_donated: e.target.value })}
                      className="w-24 p-1.5 bg-white border border-emerald-300 rounded-lg text-center font-bold text-emerald-900"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 if in-kind physical items"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Google Pay">Google Pay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Bank Transfer">Bank NEFT/RTGS</option>
                    <option value="Cash">Cash Receipt</option>
                    <option value="Direct In-Kind">Physical Items / Goods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/409823412984 or Cash Voucher 102"
                  value={form.transaction_ref}
                  onChange={(e) => setForm({ ...form, transaction_ref: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Purpose</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Will bring rice bags on Sunday, or In loving memory of..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : form.entry_type === 'Pledge' ? 'Save Pledge' : 'Save & Sync Need'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
