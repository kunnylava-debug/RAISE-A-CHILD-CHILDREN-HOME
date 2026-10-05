import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  PackageCheck, Heart, RefreshCw, Plus, 
  CheckCircle2, AlertCircle, 
  Filter, Calendar, Phone, MessageSquare, Trash2,
  Clock, Handshake, Check, XCircle, DollarSign,
  History, CalendarDays, X
} from 'lucide-react';
import { api, subscribeToRealtimeSync, broadcastLocalSyncEvent } from '../../services/api';

export default function AdminDonationsTab({ onShowToast }) {
  const [donations, setDonations] = useState([]);
  const [neededItems, setNeededItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending_pledges' | 'confirmed_pledges' | 'direct_donations' | 'matched'
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [resettingIncome, setResettingIncome] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString());

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

  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setDonations(prev => {
          if (prev.length === 0) setLoading(true);
          return prev;
        });
      }
      const [donationsData, neededData] = await Promise.all([
        api.getDonations(),
        api.getNeeded()
      ]);
      const dons = Array.isArray(donationsData) ? donationsData : (donationsData?.donations || []);
      setDonations(dons);
      setNeededItems(Array.isArray(neededData) ? neededData : []);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Failed to load donations audit:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Multi-Device Instant Real-Time Synchronization Engine
  useEffect(() => {
    // Initial silent/clean fetch without synchronous render cascade
    let isMounted = true;
    (async () => {
      try {
        const [donationsData, neededData] = await Promise.all([
          api.getDonations(),
          api.getNeeded()
        ]);
        if (!isMounted) return;
        setDonations(Array.isArray(donationsData) ? donationsData : (donationsData?.donations || []));
        setNeededItems(Array.isArray(neededData) ? neededData : []);
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Initial load warning:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'DONATIONS_UPDATED' || event.type === 'NEEDED_UPDATED') {
        console.log('[REAL-TIME MULTI-DEVICE SYNC] Donation event received, refreshing instantly...');
        loadData(false);
      }
    });

    // 3-second active polling interval: updates automatically across mobile and desktop
    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    // Instant update whenever user switches back to this tab or unlocks mobile phone screen
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [loadData]);

  // Total All-Time Amount (placed first to preserve clean memoization)
  const totalAmount = useMemo(() => {
    return donations
      .filter(d => d.status !== 'Cancelled')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donations]);

  // Compute month-by-month financial groups
  const monthlyBreakdown = useMemo(() => {
    const map = new Map();

    for (const d of donations) {
      if (d.status === 'Cancelled') continue;
      const dateObj = new Date(d.created_at || 0);
      const isDateValid = !isNaN(dateObj.getTime());
      const year = isDateValid ? dateObj.getFullYear() : 2026;
      const monthNum = isDateValid ? (dateObj.getMonth() + 1) : 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
      const monthLabel = isDateValid
        ? dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : 'Current Period';

      if (!map.has(monthKey)) {
        map.set(monthKey, {
          month_key: monthKey,
          month_label: monthLabel,
          year,
          month_num: monthNum,
          total_amount: 0,
          direct_amount: 0,
          pledge_amount: 0,
          donors_count: 0,
          donations: []
        });
      }

      const grp = map.get(monthKey);
      const amt = Number(d.amount) || 0;
      grp.total_amount += amt;
      if (d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge')) {
        grp.pledge_amount += amt;
      } else {
        grp.direct_amount += amt;
      }
      grp.donors_count += 1;
      grp.donations.push(d);
    }

    // Sort descending by month key (most recent months first)
    return Array.from(map.values()).sort((a, b) => b.month_key.localeCompare(a.month_key));
  }, [donations]);

  // Current Month Stats
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return monthlyBreakdown.find(m => m.month_key === currentMonthKey) || {
      month_key: currentMonthKey,
      month_label: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      total_amount: 0,
      direct_amount: 0,
      pledge_amount: 0,
      donors_count: 0
    };
  }, [monthlyBreakdown]);

  // Available Distinct Years across all donations
  const availableYears = useMemo(() => {
    const set = new Set([new Date().getFullYear()]);
    for (const d of donations) {
      if (d.created_at) {
        const y = new Date(d.created_at).getFullYear();
        if (!isNaN(y)) set.add(y);
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [donations]);

  // All 12 calendar months for selectedYear inspection
  const yearlyMonthsList = useMemo(() => {
    const list = [];
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const d = new Date(selectedYear, m - 1, 1);
      const name = d.toLocaleString('en-US', { month: 'long' });
      const found = monthlyBreakdown.find(mb => mb.month_key === monthKey);
      list.push(found || {
        month_key: monthKey,
        month_label: `${name} ${selectedYear}`,
        month_name: name,
        year: selectedYear,
        month_num: m,
        total_amount: 0,
        direct_amount: 0,
        pledge_amount: 0,
        donors_count: 0,
        donations: []
      });
    }
    return list;
  }, [selectedYear, monthlyBreakdown]);

  // Active Inspected Month data (or all-time summary)
  const activeInspectedMonth = useMemo(() => {
    if (selectedMonth === 'all') {
      return {
        is_all: true,
        month_key: 'all',
        month_label: 'All-Time Record Ledger',
        total_amount: totalAmount,
        direct_amount: donations.filter(d => d.entry_type !== 'Pledge' && d.status !== 'Cancelled').reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
        pledge_amount: donations.filter(d => (d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge')) && d.status !== 'Cancelled').reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
        donors_count: donations.filter(d => d.status !== 'Cancelled').length
      };
    }
    const found = monthlyBreakdown.find(m => m.month_key === selectedMonth);
    if (found) return { is_all: false, ...found };
    const [y, m] = selectedMonth.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return {
      is_all: false,
      month_key: selectedMonth,
      month_label: !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : selectedMonth,
      total_amount: 0,
      direct_amount: 0,
      pledge_amount: 0,
      donors_count: 0
    };
  }, [selectedMonth, monthlyBreakdown, totalAmount, donations]);

  const matchedDonations = useMemo(() => {
    return donations.filter(d => !!d.needed_item_id || !!d.linked_need_title);
  }, [donations]);

  const pendingPledges = useMemo(() => {
    return donations.filter(d => {
      const isPledgeType = d.entry_type === 'Pledge' || String(d.status || '').toLowerCase().includes('pledge');
      return isPledgeType && d.status !== 'Confirmed' && d.status !== 'Cancelled';
    });
  }, [donations]);

  const confirmedPledges = useMemo(() => {
    return donations.filter(d => d.entry_type === 'Pledge' && d.status === 'Confirmed');
  }, [donations]);

  const directDonations = useMemo(() => {
    return donations.filter(d => {
      return d.entry_type === 'Direct Donation' || (!d.entry_type && !String(d.status || '').toLowerCase().includes('pledge'));
    });
  }, [donations]);

  // Combined Filtering: Status Mode + Selected Month
  const displayedDonations = useMemo(() => {
    return donations.filter(d => {
      // Month Filter
      if (selectedMonth !== 'all') {
        const dateObj = new Date(d.created_at || 0);
        const dMonthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (dMonthKey !== selectedMonth) return false;
      }

      // Status/Type Filter
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
  }, [donations, filterMode, selectedMonth]);

  const handleConfirmPledge = async (donation) => {
    const donId = donation.id || donation._cloud_id;
    const wasConfirmed = donation.status === 'Confirmed';
    if (wasConfirmed) return;

    const confirmedAt = new Date().toISOString();
    const qtyToAdd = Number(donation.quantity_donated) || 1;

    // 1. Instant optimistic state update (0ms lag!)
    setDonations(prev => prev.map(d => {
      if (String(d.id) === String(donId) || String(d._cloud_id) === String(donId) || (d.receipt_no && d.receipt_no === donation.receipt_no)) {
        return { ...d, status: 'Confirmed', confirmed_at: confirmedAt };
      }
      return d;
    }));

    setNeededItems(prev => prev.map(item => {
      const matchId = donation.needed_item_id && String(donation.needed_item_id) === String(item.id);
      const matchName = donation.item_name && item.item_name &&
        donation.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim();
      const matchLinked = donation.linked_need_title && item.item_name &&
        donation.linked_need_title.toLowerCase().trim() === item.item_name.toLowerCase().trim();
      if (matchId || matchName || matchLinked) {
        const newRec = (Number(item.quantity_received) || 0) + qtyToAdd;
        return {
          ...item,
          quantity_received: newRec,
          is_fulfilled: newRec >= (Number(item.quantity_needed) || 1)
        };
      }
      return item;
    }));

    onShowToast?.({
      type: 'success',
      title: 'Pledge Confirmed & Added to Inventory',
      message: `Pledge confirmed! Added +${qtyToAdd} units to inventory.`
    });

    broadcastLocalSyncEvent({ type: 'DONATIONS_UPDATED', action: 'CONFIRM_PLEDGE', id: donId });
    broadcastLocalSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE' });

    // 2. Background persistence without blocking UI
    try {
      await api.confirmPledge(donId);
      loadData(false);
    } catch (err) {
      console.warn('Background pledge confirm error:', err.message);
    }
  };

  const handleCancelPledge = async (donation) => {
    if (!window.confirm(`Cancel pledge from ${donation.donor_name}? If previously counted, received units will be decreased.`)) {
      return;
    }
    const donId = donation.id || donation._cloud_id;
    const wasConfirmed = donation.status === 'Confirmed';
    const qtyToSub = Number(donation.quantity_donated) || 1;

    // 1. Instant optimistic state update (0ms lag!)
    setDonations(prev => prev.map(d => {
      if (String(d.id) === String(donId) || String(d._cloud_id) === String(donId) || (d.receipt_no && d.receipt_no === donation.receipt_no)) {
        return { ...d, status: 'Cancelled', cancelled_at: new Date().toISOString() };
      }
      return d;
    }));

    if (wasConfirmed) {
      setNeededItems(prev => prev.map(item => {
        const matchId = donation.needed_item_id && String(donation.needed_item_id) === String(item.id);
        const matchName = donation.item_name && item.item_name &&
          donation.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim();
        const matchLinked = donation.linked_need_title && item.item_name &&
          donation.linked_need_title.toLowerCase().trim() === item.item_name.toLowerCase().trim();
        if (matchId || matchName || matchLinked) {
          const newRec = Math.max(0, (Number(item.quantity_received) || 0) - qtyToSub);
          return {
            ...item,
            quantity_received: newRec,
            is_fulfilled: newRec >= (Number(item.quantity_needed) || 1)
          };
        }
        return item;
      }));
    }

    onShowToast?.({
      type: 'info',
      title: 'Pledge Cancelled',
      message: 'Pledge commitment has been cancelled.'
    });

    broadcastLocalSyncEvent({ type: 'DONATIONS_UPDATED', action: 'CANCEL_PLEDGE', id: donId });
    broadcastLocalSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE' });

    // 2. Background persistence without blocking UI
    try {
      await api.cancelPledge(donId);
      loadData(false);
    } catch (err) {
      console.warn('Background pledge cancel error:', err.message);
    }
  };

  const handleRecordDonation = async (e) => {
    e.preventDefault();
    if (!form.donor_name.trim()) {
      onShowToast?.({ type: 'error', message: 'Donor name is required' });
      return;
    }

    const isPledge = form.entry_type === 'Pledge';
    const qty = Number(form.quantity_donated) || 1;
    const tempId = Date.now();
    const prefix = isPledge ? 'PLG' : 'REC';
    const currentYear = new Date().getFullYear();
    const receiptNo = `${prefix}-${currentYear}-${String(donations.length + 101).padStart(4, '0')}`;

    let matchedItemName = '';
    if (form.needed_item_id) {
      const match = neededItems.find(n => String(n.id) === String(form.needed_item_id));
      if (match) matchedItemName = match.item_name;
    }

    const optimisticDonation = {
      id: tempId,
      receipt_no: receiptNo,
      donor_name: form.donor_name.trim(),
      donor_phone: form.donor_phone.trim(),
      donor_email: form.donor_email.trim(),
      amount: Number(form.amount) || 0,
      payment_method: form.payment_method || (isPledge ? 'Pledge Commitment' : 'UPI'),
      transaction_ref: form.transaction_ref.trim(),
      notes: form.notes.trim(),
      needed_item_id: form.needed_item_id ? Number(form.needed_item_id) : null,
      item_name: matchedItemName,
      quantity_donated: qty,
      entry_type: isPledge ? 'Pledge' : 'Direct Donation',
      status: isPledge ? 'Pledged (Pending Admin Confirmation)' : 'Confirmed',
      created_at: new Date().toISOString()
    };

    // 1. Instant optimistic state update (0ms lag!)
    setDonations(prev => [optimisticDonation, ...prev]);

    if (!isPledge && form.needed_item_id) {
      setNeededItems(prev => prev.map(item => {
        if (String(item.id) === String(form.needed_item_id)) {
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

    setModalOpen(false);
    setForm(initialForm);

    onShowToast?.({
      type: 'success',
      title: isPledge ? 'Pledge Registered (Pending Call)' : 'Donation Recorded & Count Updated',
      message: 'Entry successfully recorded into registry.'
    });

    broadcastLocalSyncEvent({ type: 'DONATIONS_UPDATED', action: 'CREATE', data: optimisticDonation });
    broadcastLocalSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE' });

    // 2. Background sync
    try {
      setSubmitting(true);
      await api.createDonation(optimisticDonation);
      loadData(false);
    } catch (err) {
      console.warn('Background record donation error:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDonation = async (d) => {
    if (!window.confirm(`Delete record for ${d.donor_name}? If confirmed, received count on linked item will decrease.`)) return;
    const donId = d.id || d._cloud_id;
    const wasConfirmed = d.status === 'Confirmed';
    const qtyToDeduct = Number(d.quantity_donated) || 1;

    // 1. Instant optimistic state update (0ms lag!)
    setDonations(prev => prev.filter(item => String(item.id) !== String(donId) && String(item._cloud_id) !== String(donId)));

    if (wasConfirmed) {
      setNeededItems(prev => prev.map(item => {
        const matchId = d.needed_item_id && String(d.needed_item_id) === String(item.id);
        const matchName = d.item_name && item.item_name &&
          d.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim();
        const matchLinked = d.linked_need_title && item.item_name &&
          d.linked_need_title.toLowerCase().trim() === item.item_name.toLowerCase().trim();
        if (matchId || matchName || matchLinked) {
          const newRec = Math.max(0, (Number(item.quantity_received) || 0) - qtyToDeduct);
          return {
            ...item,
            quantity_received: newRec,
            is_fulfilled: newRec >= (Number(item.quantity_needed) || 1)
          };
        }
        return item;
      }));
    }

    onShowToast?.({ type: 'success', message: 'Record deleted.' });
    broadcastLocalSyncEvent({ type: 'DONATIONS_UPDATED', action: 'DELETE', id: donId });
    broadcastLocalSyncEvent({ type: 'NEEDED_UPDATED', action: 'UPDATE' });

    // 2. Background persistence
    try {
      await api.deleteDonation(donId);
      loadData(false);
    } catch (err) {
      console.warn('Background delete error:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center space-x-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Donations & Monthly Financial Breakdown</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Multi-Device Sync Active</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Donations, Monthly Receipts & Needs Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Auto-synchronized across your mobile and computer. Changes on one device reflect instantly on all others. Last synced: <strong className="text-slate-700">{lastSyncTime}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 transition cursor-pointer"
            title="Reset overall income to ₹0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Income to ₹0</span>
          </button>
          <button
            onClick={() => loadData(true)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
            title="Force Instant Sync from Cloud"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 text-xs sm:text-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Gift / Pledge</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (All-Time Total + Monthly Division) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: All-Time Total Funds */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">All-Time Total Received</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 font-medium">INR</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {monthlyBreakdown.length} calendar month(s)
          </p>
        </div>

        {/* Card 2: Current Month Received */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              {currentMonthStats.month_label}
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
              Current Month
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-800">
              ₹{currentMonthStats.total_amount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-700 font-bold">This Month</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            {currentMonthStats.donors_count} gift(s) received this month
          </p>
        </div>

        {/* Card 3: Pending Pledges */}
        <div className={`glass-card rounded-2xl p-5 border transition ${
          pendingPledges.length > 0 ? 'border-amber-300 bg-amber-50/50 shadow-xs' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Pending Pledges</span>
            {pendingPledges.length > 0 && (
              <span className="animate-pulse bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Action Required
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-900">
              {pendingPledges.length}
            </span>
            <span className="text-xs text-amber-700 font-semibold">To Verify</span>
          </div>
          <p className="text-[11px] text-amber-800 mt-1">Call donor & click "Confirm Pledge" to add to received</p>
        </div>

        {/* Card 4: Direct Donations Logged */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Direct Donations Logged</span>
            <Heart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700">
              {directDonations.length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Auto-incremented to received inventory</p>
        </div>
      </div>

      {/* YEARLY & MONTHLY INSPECTION DASHBOARD (ACTIVE MONTH VIEW ONLY) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              <CalendarDays className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  {selectedMonth === 'all' ? 'All-Time Record Ledger' : 'Monthly Financial Inspection'}
                </span>
                {selectedMonth === currentMonthKey && (
                  <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    Current Calendar Month
                  </span>
                )}
                {selectedMonth !== 'all' && selectedMonth !== currentMonthKey && (
                  <span className="text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Archived Month
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                {activeInspectedMonth.month_label}
              </h3>
            </div>
          </div>

          {/* Quick Inspector Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-slate-400 text-[11px]">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  const m = selectedMonth !== 'all' ? selectedMonth.split('-')[1] : String(new Date().getMonth() + 1).padStart(2, '0');
                  setSelectedMonth(`${y}-${m}`);
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Month Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-slate-400 text-[11px]">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">All Months</option>
                {yearlyMonthsList.map(m => (
                  <option key={m.month_key} value={m.month_key} className="bg-slate-900 text-white">
                    {m.month_name} ({m.total_amount > 0 ? `₹${m.total_amount.toLocaleString('en-IN')}` : '₹0'})
                  </option>
                ))}
              </select>
            </div>

            {/* Open Full Year & Month History Modal */}
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>View Months History</span>
            </button>

            {/* Quick Jump Buttons */}
            {selectedMonth !== currentMonthKey && (
              <button
                type="button"
                onClick={() => setSelectedMonth(currentMonthKey)}
                className="px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition"
              >
                This Month
              </button>
            )}
            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className="px-2.5 py-2 text-slate-300 hover:text-white text-xs underline"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Selected Month Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 uppercase tracking-wider block font-medium">
              Total Funds Received
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-400 mt-1 block">
              ₹{activeInspectedMonth.total_amount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {activeInspectedMonth.donors_count} contribution(s) logged
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 uppercase tracking-wider block font-medium">
              Direct Donations (Cash/UPI/Bank)
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-white mt-1 block">
              ₹{activeInspectedMonth.direct_amount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-teal-300 mt-0.5 block">
              Instantly incremented to funds
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <span className="text-xs text-slate-300 uppercase tracking-wider block font-medium">
              Pledges / Promises
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-300 mt-1 block">
              ₹{activeInspectedMonth.pledge_amount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-amber-200 mt-0.5 block">
              Pending or confirmed pledges
            </span>
          </div>
        </div>
      </div>

      {/* FILTER BAR: MONTH SELECTOR + STATUS TABS */}
      <div className="space-y-3">
        {/* Month Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700">Ledger Filter:</span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {activeInspectedMonth.month_label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Records ({donations.length})
            </button>

            <button
              onClick={() => setSelectedMonth(currentMonthKey)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedMonth === currentMonthKey
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Current Month ({now.toLocaleString('en-US', { month: 'short' })})
            </button>

            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Choose Any Month / History</span>
            </button>
          </div>
        </div>

        {/* Status Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Receipts ({donations.length})
          </button>

          <button
            onClick={() => setFilterMode('pending_pledges')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              filterMode === 'matched'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Cross-Checked Needs ({matchedDonations.length})</span>
          </button>
        </div>
      </div>

      {/* Selected Month Filter Notification Banner */}
      {selectedMonth !== 'all' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>
              Filtering receipts for <strong>{monthlyBreakdown.find(m => m.month_key === selectedMonth)?.month_label}</strong> • Month Total: <strong>₹{(monthlyBreakdown.find(m => m.month_key === selectedMonth)?.total_amount || 0).toLocaleString('en-IN')}</strong> ({displayedDonations.length} records)
            </span>
          </div>
          <button
            onClick={() => setSelectedMonth('all')}
            className="text-blue-700 font-bold hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Donations Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        {loading && donations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm">Loading records...</p>
          </div>
        ) : displayedDonations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <PackageCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Records In This View</h3>
            <p className="text-xs text-slate-500 mt-1">Switch month/filter or record a new donation/pledge.</p>
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
                        <div className="font-bold text-slate-900 text-base">
                          {d.amount ? `₹${Number(d.amount).toLocaleString('en-IN')}` : 'In-kind'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {d.quantity_donated || 1} unit(s)
                        </div>
                      </td>

                      <td className="p-4 text-slate-500 text-xs font-mono whitespace-nowrap">
                        {d.created_at ? d.created_at.split('T')[0] : 'Today'}
                      </td>

                      {/* Admin Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Confirm Pledge button for pending pledges */}
                          {isPending && (
                            <button
                              onClick={() => handleConfirmPledge(d)}
                              className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs shadow-sm transition active:scale-95 cursor-pointer"
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
                              className="inline-flex items-center space-x-1 border border-slate-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold px-2 py-1.5 rounded-xl text-xs transition cursor-pointer"
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
                            onClick={() => handleDeleteDonation(d)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto bg-white">
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
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${
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
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : form.entry_type === 'Pledge' ? 'Save Pledge' : 'Save & Sync Need'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. YEARLY & MONTHLY INSPECTION HISTORY MODAL */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-slate-900">
                    Yearly & Monthly Income Archive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspect past months and select any month to view its detailed receipts on the main board.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Year Selector Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Select Year:</span>
              {availableYears.map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    selectedYear === year
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Months Grid for Selected Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {yearlyMonthsList.map((m) => {
                const isSelected = selectedMonth === m.month_key;
                const isCurrent = m.month_key === currentMonthKey;
                const hasIncome = m.total_amount > 0;

                return (
                  <div
                    key={m.month_key}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-400'
                        : isCurrent
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : hasIncome
                        ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{m.month_name} {selectedYear}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Received</span>
                      <span className={`text-xl font-extrabold font-serif ${hasIncome ? 'text-slate-900' : 'text-slate-400'}`}>
                        ₹{m.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        {m.donors_count} contribution(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth(m.month_key);
                          setHistoryModalOpen(false);
                          onShowToast?.({
                            type: 'info',
                            message: `Inspecting ${m.month_name} ${selectedYear} financial records`
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Inspect Month'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESET INCOME TO ZERO CONFIRMATION MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-serif text-slate-900">
                Reset Overall Income to ₹0?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This will clear all recorded gift and pledge receipts (current total: <strong className="text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</strong>) and reset the income counter to zero across all your mobile phones and computers.
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Use this option when beginning a new financial year audit or if you want to start fresh with zero balance.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={resettingIncome}
                onClick={() => setResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingIncome}
                onClick={async () => {
                  setResettingIncome(true);
                  // 1. Instant optimistic reset (0ms lag!)
                  setDonations([]);
                  setSelectedMonth('all');
                  setResetModalOpen(false);
                  onShowToast?.({
                    type: 'success',
                    title: 'Income Reset Completed',
                    message: 'All donation records cleared. Overall income is now ₹0.'
                  });
                  broadcastLocalSyncEvent({ type: 'DONATIONS_UPDATED', action: 'RESET_ALL' });

                  try {
                    await api.resetDonationsIncome();
                    loadData(false);
                  } catch (err) {
                    onShowToast?.({ type: 'error', message: 'Failed to reset income: ' + err.message });
                  } finally {
                    setResettingIncome(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {resettingIncome ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Reset to ₹0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
