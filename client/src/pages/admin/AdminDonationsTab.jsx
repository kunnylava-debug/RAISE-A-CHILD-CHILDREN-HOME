import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, Heart, RefreshCw, Plus, 
  CheckCircle2, AlertCircle, ArrowUpRight, Search, 
  Filter, Calendar, ExternalLink 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDonationsTab({ onShowToast }) {
  const [donations, setDonations] = useState([]);
  const [neededItems, setNeededItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'matched' | 'general'
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    donor_name: '',
    donor_phone: '',
    donor_email: '',
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

  const handleRecordDonation = async (e) => {
    e.preventDefault();
    if (!form.donor_name.trim()) {
      onShowToast?.({ type: 'error', message: 'Donor name is required' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createDonation({
        ...form,
        amount: Number(form.amount) || 0,
        quantity_donated: Number(form.quantity_donated) || 1,
        needed_item_id: form.needed_item_id ? Number(form.needed_item_id) : null
      });

      onShowToast?.({
        type: 'success',
        title: 'Donation Recorded & Verified',
        message: res.message || 'Donation registered into database and requirement updated.'
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
  const matchedDonations = donations.filter(d => !!d.needed_item_id);

  const displayedDonations = donations.filter(d => {
    if (filterMode === 'matched') return !!d.needed_item_id;
    if (filterMode === 'general') return !d.needed_item_id;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>Cross-Check Verification & Live Audit</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Donations & Matched Needs Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Every donation matched to a hostel need automatically updates received inventory.
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
            <span>Record Offline Donation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-400">Total Donations Logged</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">{donations.length}</span>
            <span className="text-xs text-blue-600 font-semibold">Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From public pledges & direct contributors</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-100 bg-emerald-50/20">
          <span className="text-xs font-bold uppercase text-emerald-700">Matched To Active Needs</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700">{matchedDonations.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">Auto-Synced</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Instantly updated quantity received</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-100 bg-amber-50/20">
          <span className="text-xs font-bold uppercase text-slate-500">Total Funds Collected</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 font-medium">INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Bank, UPI & direct contributions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMode === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Donations ({donations.length})
        </button>
        <button
          onClick={() => setFilterMode('matched')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            filterMode === 'matched'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Cross-Checked Needs ({matchedDonations.length})</span>
        </button>
        <button
          onClick={() => setFilterMode('general')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMode === 'general'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          General Support ({donations.length - matchedDonations.length})
        </button>
      </div>

      {/* Donations Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm">Loading verified donations...</p>
          </div>
        ) : displayedDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Donations In This View</h3>
            <p className="text-xs text-slate-500 mt-1">Switch filter or record a new donation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Receipt / Donor</th>
                  <th className="p-4">Cross-Checked Need</th>
                  <th className="p-4">Amount / Qty</th>
                  <th className="p-4">Method & Ref</th>
                  <th className="p-4">Need Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDonations.map((d) => {
                  const isMatched = !!d.needed_item_id;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{d.donor_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{d.receipt_no || `REC-${d.id}`}</div>
                        {(d.donor_phone || d.donor_email) && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {d.donor_phone} {d.donor_email && `• ${d.donor_email}`}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {isMatched ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <PackageCheck className="w-3 h-3" />
                              <span>{d.linked_need_title || d.needed_item_name || d.item_name || 'Matched Need'}</span>
                            </span>
                            <div className="text-[11px] text-emerald-700 font-medium">
                              Donated: <strong>+{d.quantity_donated || 1} units</strong>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            General Fund
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        {d.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : 'In-kind item'}
                      </td>

                      <td className="p-4 text-slate-600">
                        <div className="font-medium text-slate-800">{d.payment_method || 'UPI'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{d.transaction_ref || 'N/A'}</div>
                      </td>

                      <td className="p-4">
                        {isMatched ? (
                          (d.linked_need_fulfilled || d.is_fulfilled) ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Fulfilled</span>
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                                <span>{(d.linked_need_current ?? d.quantity_received) || 0} / {(d.linked_need_total ?? d.quantity_needed) || 0} received</span>
                              </span>
                              <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${Math.min(100, Math.round((((d.linked_need_current ?? d.quantity_received) || 0) / ((d.linked_need_total ?? d.quantity_needed) || 1)) * 100))}%` }}
                                />
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-mono">
                        {d.created_at ? d.created_at.split(' ')[0] : 'Today'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Offline Donation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    Record & Cross-Check Donation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Match with our active needs to update quantities automatically
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

            <form onSubmit={handleRecordDonation} className="space-y-4 text-xs sm:text-sm">
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
                  Cross-Check: Match With Hostel Need (Auto-Updates Requirement)
                </label>
                <select
                  value={form.needed_item_id}
                  onChange={(e) => setForm({ ...form, needed_item_id: e.target.value })}
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm font-medium"
                >
                  <option value="">-- No specific need (General Donation) --</option>
                  {neededItems.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.item_name} ({n.quantity_received}/{n.quantity_needed} received) - {n.category}
                    </option>
                  ))}
                </select>

                {form.needed_item_id && (
                  <div className="pt-2 flex items-center space-x-3">
                    <label className="text-xs font-semibold text-emerald-800">
                      Quantity of items donated:
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
                    placeholder="0 if in-kind goods"
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
                  placeholder="e.g. In loving memory of..., or For Puja clothes distribution"
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
                  <span>{submitting ? 'Cross-Checking...' : 'Save & Sync Need'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
