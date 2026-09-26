import React, { useState } from 'react';
import { 
  CreditCard, Save, QrCode, Phone, Building, 
  CheckCircle2, Copy, Sparkles, RefreshCw, ExternalLink, ShieldCheck 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminPaymentsTab({ settings, onRefreshSettings, onShowToast }) {
  const [form, setForm] = useState({
    gpay_number: settings?.gpay_number || '',
    phonepe_number: settings?.phonepe_number || '',
    upi_id: settings?.upi_id || 'nelson@upi',
    upi_name: settings?.upi_name || "RISE A CHILD Welfare Trust",
    payment_qr: settings?.payment_qr || '',
    bank_name: settings?.bank_name || 'State Bank of India',
    bank_account_no: settings?.bank_account_no || '38491029384',
    bank_ifsc: settings?.bank_ifsc || 'SBIN0001423',
    bank_branch: settings?.bank_branch || 'Sullurpeta Branch'
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Dynamic live QR code URL based on UPI ID and Trust Name
  const dynamicQrUrl = form.upi_id
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${form.upi_id.trim()}&pn=${encodeURIComponent(form.upi_name || "Hostel Trust")}&cu=INR`)}`
    : '';

  const activeQrCode = form.payment_qr || '/payment_qr.png';

  const handleGenerateDefaultQr = () => {
    if (!form.upi_id) {
      onShowToast?.({ type: 'error', message: 'Please enter your UPI ID first.' });
      return;
    }
    const autoQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${form.upi_id.trim()}&pn=${encodeURIComponent(form.upi_name || "Hostel Trust")}&cu=INR`)}`;
    handleChange('payment_qr', autoQr);
    onShowToast?.({ type: 'success', message: 'Generated dynamic QR code matching your UPI ID!' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(form);
      onShowToast?.({ 
        type: 'success', 
        title: 'Payment Details Saved',
        message: 'PhonePe, Google Pay, UPI ID & Bank details updated successfully.' 
      });
      onRefreshSettings?.();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to update payment settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Donations & Payment Gateway Configuration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            PhonePe, Google Pay, UPI & Bank Accounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your registered PhonePe number, Google Pay number, and UPI QR code so donations go directly to your hostel's accounts.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 text-xs sm:text-sm transition disabled:opacity-50 flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Payment Options'}</span>
        </button>
      </div>

      {/* 1. PhonePe & Google Pay Configuration */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shadow-xs">
              ₹
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                PhonePe & Google Pay (GPay) Mobile Numbers
              </h3>
              <p className="text-xs text-slate-500">
                Displayed in the public "Support Us / Needed" page for mobile wallet donors.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publicly Linked</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PhonePe Number */}
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>PhonePe Number</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                PhonePe Wallet
              </span>
            </div>
            <label className="block text-xs text-slate-600">
              Enter registered PhonePe mobile number:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.phonepe_number}
                onChange={e => handleChange('phonepe_number', e.target.value)}
                placeholder="e.g. +91 90594 91777"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900"
              />
            </div>
            <p className="text-[11px] text-purple-700/80">
              Current display on website: <strong>{form.phonepe_number || 'Not set'}</strong>
            </p>
          </div>

          {/* Google Pay Number */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Google Pay (GPay) Number</span>
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                Google Pay
              </span>
            </div>
            <label className="block text-xs text-slate-600">
              Enter registered Google Pay mobile number:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={form.gpay_number}
                onChange={e => handleChange('gpay_number', e.target.value)}
                placeholder="e.g. +91 90594 91777"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900"
              />
            </div>
            <p className="text-[11px] text-blue-700/80">
              Current display on website: <strong>{form.gpay_number || 'Not set'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. UPI ID & QR Code Management */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                UPI ID & Instant Payment QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Used for instant 1-click scanning with BHIM, Google Pay, PhonePe, Paytm, and bank UPI apps.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">
                Official UPI ID (VPA) *
              </label>
              <input
                type="text"
                required
                value={form.upi_id}
                onChange={e => handleChange('upi_id', e.target.value)}
                placeholder="e.g. nelson@upi or 9059491777@ybl"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs sm:text-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Can be a bank VPA or mobile number VPA (e.g. yournumber@okaxis / yournumber@ybl / yourname@sbi)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">
                Beneficiary / Account Holder Name (UPI Name)
              </label>
              <input
                type="text"
                value={form.upi_name}
                onChange={e => handleChange('upi_name', e.target.value)}
                placeholder="e.g. RISE A CHILD Welfare Trust"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 text-xs sm:text-sm">
                  QR Code Image URL (Custom or Auto-Generated)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleChange('payment_qr', '/payment_qr.png')}
                    className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-500" />
                    <span>Official Scanner</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateDefaultQr}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={form.payment_qr}
                onChange={e => handleChange('payment_qr', e.target.value)}
                placeholder="/payment_qr.png (Default official scanner)"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* QR Code Preview Box */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live QR Preview
            </span>
            <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
              <img
                src={activeQrCode}
                alt="UPI QR Code Preview"
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                onError={e => { e.target.src = '/payment_qr.png'; }}
              />
            </div>
            <div className="text-xs">
              <span className="text-slate-500 block text-[11px]">Scans to UPI ID:</span>
              <span className="font-mono font-bold text-emerald-700 text-xs block truncate max-w-[200px]">
                {form.upi_id || 'Enter UPI ID'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Direct Bank Account Transfer (NEFT / RTGS / IMPS) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Direct Bank Transfer (NEFT / RTGS / IMPS)
              </h3>
              <p className="text-xs text-slate-500">
                For major benefactors, institutions, and direct wire deposits.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">Bank Name</label>
            <input
              type="text"
              value={form.bank_name}
              onChange={e => handleChange('bank_name', e.target.value)}
              placeholder="e.g. State Bank of India"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">Bank Branch</label>
            <input
              type="text"
              value={form.bank_branch}
              onChange={e => handleChange('bank_branch', e.target.value)}
              placeholder="e.g. Sullurpeta Branch"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">Account Number</label>
            <input
              type="text"
              value={form.bank_account_no}
              onChange={e => handleChange('bank_account_no', e.target.value)}
              placeholder="e.g. 38491029384"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs sm:text-sm">IFSC Code</label>
            <input
              type="text"
              value={form.bank_ifsc}
              onChange={e => handleChange('bank_ifsc', e.target.value)}
              placeholder="e.g. SBIN0001423"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs sm:text-sm uppercase"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-blue-200 transition disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : 'Save All Payment & Wallet Details'}</span>
        </button>
      </div>
    </form>
  );
}
