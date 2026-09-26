import React from 'react';
import { CreditCard, Copy, Building, Send } from 'lucide-react';

export default function SupportSection({ settings, onOpenDonationModal, onCopy }) {
  const upiId = settings?.upi_id || 'nelson@upi';
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings?.upi_name || "RISE A CHILD Welfare Trust")}&cu=INR`;

  return (
    <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
            Tax Exempted Charitable Contribution
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-serif text-white">
            You Can Support Us
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Every contribution directly provides food, education, and healthcare for our resident children. Support seamlessly via UPI or direct bank transfer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          {/* QR Code Container */}
          <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Scan with any UPI App
            </span>
            
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={settings?.payment_qr || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dnelson%40upi%26pn%3DRISE%2520A%2520CHILD%2520Hostel%26cu%3DINR"}
                alt="UPI Payment QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 block">Official UPI ID:</span>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono font-extrabold text-base text-slate-900 select-all">
                  {upiId}
                </span>
                <button
                  onClick={() => onCopy(upiId, 'UPI ID')}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                  title="Copy UPI ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={upiPayLink}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open PhonePe / GPay / Paytm</span>
              </a>
            </div>
          </div>

          {/* Bank & Payment Method Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                Supported Payment Options
              </h3>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-900">
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">UPI Transfer</span>
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">Google Pay ({settings?.gpay_number || '+91 90594 91777'})</span>
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">PhonePe ({settings?.phonepe_number || '+91 90594 91777'})</span>
                <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm">Paytm / BHIM</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center">
                  <Building className="w-4 h-4 mr-1.5" />
                  <span>Direct Bank NEFT / RTGS Transfer</span>
                </h3>
                <span className="text-[11px] text-slate-300">Verified Trust Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-200">
                <div>
                  <span className="text-slate-400 block text-xs">Account Name:</span>
                  <span className="font-bold text-white">{settings?.upi_name || "RISE A CHILD Welfare Trust"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Bank Name:</span>
                  <span className="font-bold text-white">{settings?.bank_name || "State Bank of India"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Account Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {settings?.bank_account_no || "38491029384"}
                    </span>
                    <button 
                      onClick={() => onCopy(settings?.bank_account_no || "38491029384", "Account Number")}
                      className="p-1 hover:text-emerald-400"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">IFSC Code:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {settings?.bank_ifsc || "SBIN0001423"}
                    </span>
                    <button 
                      onClick={() => onCopy(settings?.bank_ifsc || "SBIN0001423", "IFSC Code")}
                      className="p-1 hover:text-emerald-400"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenDonationModal()}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-xl shadow-blue-950/50 flex items-center justify-center space-x-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>Already Donated? Register Contribution To Receive Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
