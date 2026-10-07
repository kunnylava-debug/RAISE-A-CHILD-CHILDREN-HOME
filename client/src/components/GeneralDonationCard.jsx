import React, { useState } from 'react';
import { Heart, Sparkles, CreditCard, Copy, Check, QrCode, ShieldCheck, ArrowRight, Utensils, BookOpen, Coffee } from 'lucide-react';

export default function GeneralDonationCard({ settings, onOpenGeneralDonation, onCopy }) {
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('250');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const upiId = settings?.upi_id || 'pn9059491777@ybl';
  const gpayNumber = settings?.gpay_number || settings?.contact_phone || '+91 90594 91777';
  const phonepeNumber = settings?.phonepe_number || settings?.contact_phone || '+91 90594 91777';
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings?.upi_name || "RISE A CHILD Welfare Trust")}&am=${customAmount || 250}&cu=INR`;

  const presetAmounts = [
    { value: 100, label: '₹100', desc: 'Daily Breakfast', icon: Coffee },
    { value: 250, label: '₹250', desc: 'Notebooks & Pen Kit', icon: BookOpen },
    { value: 500, label: '₹500', desc: 'Special Meal & Fruit', icon: Utensils },
    { value: 1000, label: '₹1,000', desc: 'Weekly Groceries', icon: Heart },
    { value: 2500, label: '₹2,500', desc: 'Monthly Child Care', icon: Sparkles }
  ];

  const handleSelectPreset = (val) => {
    setSelectedAmount(val);
    setCustomAmount(String(val));
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setSelectedAmount(val ? Number(val) : null);
  };

  const handleDonateClick = () => {
    const amountToDonate = Number(customAmount) > 0 ? Number(customAmount) : 100;
    if (onOpenGeneralDonation) {
      onOpenGeneralDonation(amountToDonate);
    }
  };

  const handleCopyUpi = () => {
    if (onCopy) {
      onCopy(upiId, 'UPI ID');
    } else {
      navigator.clipboard.writeText(upiId);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border-2 border-emerald-500/40">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header & Warm Message */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-600" />
              <span>General Donations • No Minimum Amount</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif text-white tracking-tight">
              Can't Sponsor a Full Unit? Donate Any Amount!
            </h2>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Every small gift from the heart makes a profound difference! Even a modest contribution of <strong>₹50, ₹100, or ₹250</strong> directly provides hot meals, morning milk, fresh fruits, and school stationery for our resident children.
            </p>
          </div>

          {/* 100% Transparency Trust Badge */}
          <div className="self-start bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/20 flex items-center space-x-2.5 text-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-300 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">100% Directly Utilized</span>
              <span className="text-[11px] text-emerald-200 block">Instant Official Receipt</span>
            </div>
          </div>
        </div>

        {/* Amount Selector Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/15 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2.5">
              Select or Enter Any Amount to Contribute:
            </label>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {presetAmounts.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedAmount === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-white text-white shadow-lg scale-102 ring-2 ring-emerald-300'
                        : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-lg font-black font-mono">{preset.label}</span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-200' : 'text-emerald-300'}`} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] opacity-80 mt-1 block">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input & Donate CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-950 font-mono">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder="Enter any amount"
                className="w-full pl-8 pr-4 py-3 bg-white text-slate-900 font-mono font-black text-lg rounded-xl border-2 border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={handleDonateClick}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <Heart className="w-5 h-5 fill-current text-rose-600" />
              <span>Donate ₹{customAmount || '0'} via UPI / GPay / PhonePe</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Instant UPI & Payment Options Micro-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-white/10 text-emerald-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-300">Quick UPI ID:</span>
            <div className="inline-flex items-center space-x-1.5 bg-white/15 px-3 py-1 rounded-lg border border-white/15 font-mono font-bold text-white">
              <span>{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 hover:text-emerald-300 transition"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copied && <span className="text-emerald-300 font-bold text-[11px]">Copied!</span>}
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span>Google Pay / PhonePe: <strong>{gpayNumber}</strong></span>
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="inline-flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </div>
        </div>

        {/* Optional Collapsible QR Code Drawer */}
        {showQr && (
          <div className="bg-white text-slate-900 rounded-2xl p-5 text-center max-w-xs mx-auto shadow-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Scan with any UPI App
            </span>
            <div className="p-2 bg-white rounded-xl border border-slate-200 inline-block shadow-inner">
              <img
                src={settings?.payment_qr || "/payment_qr.png"}
                alt="Payment QR Code"
                onError={(e) => {
                  e.currentTarget.src = "/payment_qr.png";
                }}
                className="w-44 h-44 mx-auto object-contain"
              />
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              Open PhonePe, GPay, Paytm, or BHIM to pay ₹{customAmount || 'any amount'}.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
