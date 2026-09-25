import React, { useState } from 'react';
import { Save, Image, Phone, Mail, MapPin, Shield, CheckCircle2, CreditCard, Share2, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSettingsTab({ settings, onRefreshSettings, onShowToast }) {
  const [form, setForm] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(form);
      onShowToast?.({ type: 'success', message: 'Hostel website settings saved successfully' });
      onRefreshSettings?.();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-xs sm:text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900">Hostel Branding, Logo & Location</h2>
          <p className="text-xs text-slate-500 mt-0.5">Customize homepage hero, logo, headline, vision, and Google Maps location.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Hostel Official Name</label>
          <input
            type="text"
            value={form.hostel_name || ''}
            onChange={e => handleChange('hostel_name', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
          <input
            type="text"
            value={form.hostel_tagline || ''}
            onChange={e => handleChange('hostel_tagline', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Hero Welcoming Headline</label>
        <input
          type="text"
          value={form.hostel_headline || ''}
          onChange={e => handleChange('hostel_headline', e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Hero Welcome Introduction Text</label>
        <textarea
          rows="3"
          value={form.hostel_intro || ''}
          onChange={e => handleChange('hostel_intro', e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Logo & Hero Images with Live Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Hostel Logo Image URL</label>
          <input
            type="text"
            value={form.logo_url || ''}
            onChange={e => handleChange('logo_url', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {/* Logo preview */}
          <div className="mt-3 flex items-center space-x-3">
            <div className="w-14 h-14 rounded-xl p-0.5 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                {form.logo_url ? (
                  <img 
                    src={form.logo_url} 
                    alt="Logo Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Shield className="w-7 h-7 text-blue-600" />
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              <strong className="block text-slate-800">Current Logo Emblem</strong>
              <span>Appears on Home hero badge & top navigation bar</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Hero Background Image URL</label>
          <input
            type="text"
            value={form.hero_image || ''}
            onChange={e => handleChange('hero_image', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {form.hero_image && (
            <div className="mt-3 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
              <img src={form.hero_image} alt="Hero Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Hostel Vision Statement</label>
        <textarea
          rows="2"
          value={form.vision_statement || ''}
          onChange={e => handleChange('vision_statement', e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Google Maps Location Configuration */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Google Maps Location & Campus Address Configuration</span>
        </div>
        <p className="text-xs text-slate-500">
          Your hostel is fixed as <strong>Home</strong> in Google Maps. When users click "Get Directions", Google Maps will navigate directly to this destination.
        </p>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Displayed Campus Address Text</label>
          <input
            type="text"
            value={form.map_address || form.contact_address || ''}
            onChange={e => {
              handleChange('map_address', e.target.value);
              handleChange('contact_address', e.target.value);
            }}
            placeholder="e.g. Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Google Maps Embed URL (Interactive Map)</label>
            <input
              type="text"
              value={form.map_embed_url || ''}
              onChange={e => handleChange('map_embed_url', e.target.value)}
              placeholder="https://maps.google.com/maps?q=13.705267,79.999285&hl=en&z=17&output=embed"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Google Maps Navigation Link</label>
            <input
              type="text"
              value={form.map_directions_url || 'https://www.google.com/maps/dir/?api=1&destination=13.705267,79.999285'}
              onChange={e => handleChange('map_directions_url', e.target.value)}
              placeholder="https://www.google.com/maps/dir/?api=1&destination=13.705267,79.999285"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
            />
            <span className="text-[11px] text-blue-600 mt-1 block">
              Configured: Direct navigation to 13.7053° N, 79.9993° E (Sullurpeta, AP)
            </span>
          </div>
        </div>
      </div>

      {/* PhonePe, Google Pay & UPI Payment Settings */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>PhonePe, Google Pay (GPay) & UPI Payment Settings</span>
        </div>
        <p className="text-xs text-slate-500">
          Specify your registered mobile numbers and UPI ID so public donations through the website reach your exact accounts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">PhonePe Registered Mobile Number</label>
            <input
              type="text"
              value={form.phonepe_number || ''}
              onChange={e => handleChange('phonepe_number', e.target.value)}
              placeholder="e.g. +91 90594 91777"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Google Pay (GPay) Mobile Number</label>
            <input
              type="text"
              value={form.gpay_number || ''}
              onChange={e => handleChange('gpay_number', e.target.value)}
              placeholder="e.g. +91 90594 91777"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official UPI ID (VPA)</label>
            <input
              type="text"
              value={form.upi_id || ''}
              onChange={e => handleChange('upi_id', e.target.value)}
              placeholder="e.g. nelson@upi or 9059491777@ybl"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">UPI Beneficiary / Trust Name</label>
            <input
              type="text"
              value={form.upi_name || ''}
              onChange={e => handleChange('upi_name', e.target.value)}
              placeholder="e.g. RISE A CHILD Welfare Trust"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Payment QR Code Image URL</label>
          <input
            type="text"
            value={form.payment_qr || ''}
            onChange={e => handleChange('payment_qr', e.target.value)}
            placeholder="https://... (or leave blank to auto-generate from UPI ID)"
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
          />
        </div>
      </div>

      {/* Social Media & Follow Us Links */}
      <div className="space-y-4 p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
          <Share2 className="w-4 h-4" />
          <span>Follow Us Social Links (Footer Integration)</span>
        </div>
        <p className="text-xs text-slate-500">
          Enter your official Facebook, Instagram, and YouTube links. These will be displayed as clickable buttons in the website footer.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facebook Page URL</label>
            <input
              type="url"
              value={form.social_facebook || ''}
              onChange={e => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instagram Profile URL</label>
            <input
              type="url"
              value={form.social_instagram || ''}
              onChange={e => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/yourprofile"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">YouTube Channel URL</label>
            <input
              type="url"
              value={form.social_youtube || ''}
              onChange={e => handleChange('social_youtube', e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Google Sheets & Excel Integration for Children Records */}
      <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-800">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold font-serif text-base">Children Records Google Sheet & Excel Integration</h3>
        </div>
        <p className="text-xs text-slate-600">
          Connect your official Google Sheet to automatically store and synchronize all children records added through the website.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">Connected Google Sheet URL</label>
            <input
              type="url"
              value={form.children_google_sheet_url || ''}
              onChange={e => handleChange('children_google_sheet_url', e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">Google Apps Script Webhook URL (For Direct Live Append)</label>
            <input
              type="url"
              value={form.children_google_sheet_webhook_url || ''}
              onChange={e => handleChange('children_google_sheet_webhook_url', e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={form.children_google_sheet_url || 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100/50 transition inline-flex items-center space-x-1"
          >
            <span>Open Current Google Sheet ↗</span>
          </a>
          <a
            href="/api/children/export/excel"
            download="RISE_A_CHILD_Children_Records.xlsx"
            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center space-x-1 shadow-xs"
          >
            <span>Download Live Excel File (.xlsx) 📥</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
          <input
            type="text"
            value={form.contact_phone || ''}
            onChange={e => handleChange('contact_phone', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Contact Email Address</label>
          <input
            type="email"
            value={form.contact_email || ''}
            onChange={e => handleChange('contact_email', e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-blue-200 transition disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save All Settings'}
        </button>
      </div>
    </form>
  );
}
