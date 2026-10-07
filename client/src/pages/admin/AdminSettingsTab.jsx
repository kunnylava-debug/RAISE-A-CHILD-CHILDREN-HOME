import React, { useState, useEffect } from 'react';
import { Save, Mail, MapPin, Shield, CreditCard, Share2, FileSpreadsheet, Send, Key, Upload } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSettingsTab({ settings, onRefreshSettings, onShowToast }) {
  const [form, setForm] = useState({ ...settings });
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);
  const [quickSavingEmail, setQuickSavingEmail] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm(prev => ({ ...settings, ...prev, hero_image: prev.hero_image || settings.hero_image, logo_url: prev.logo_url || settings.logo_url }));
    }
  }, [settings]);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleQuickSaveEmail = async () => {
    const targetEmail = (form.notification_email || form.contact_email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      onShowToast?.({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setQuickSavingEmail(true);
    try {
      const updated = {
        ...form,
        notification_email: targetEmail,
        contact_email: targetEmail
      };
      await api.updateSettings(updated);
      onShowToast?.({
        type: 'success',
        title: 'Email Address Updated!',
        message: `Alerts will now be delivered directly to ${targetEmail}.`
      });
      onRefreshSettings?.();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to update email: ' + err.message });
    } finally {
      setQuickSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      // First save current settings so backend has updated credentials
      await api.updateSettings(form);
      const recipient = form.notification_email || form.contact_email || 'pn9059491777@gmail.com';
      const res = await api.testEmail(recipient);
      onShowToast?.({ type: 'success', message: res.message || `Test email successfully delivered to ${recipient}!` });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'SMTP Connection failed. Verify email and App Password.' });
    } finally {
      setTestingEmail(false);
    }
  };

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

      {/* Logo & Hero Images with Live Preview & Direct Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs sm:text-sm">
            <span>Hostel Logo Image</span>
            <span className="text-[11px] text-slate-400 font-normal">PNG / SVG / JPG</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.logo_url || ''}
              onChange={e => handleChange('logo_url', e.target.value)}
              placeholder="Paste Logo URL or Upload below"
              className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono"
            />
            <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-800 px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs flex items-center space-x-1 transition shadow-xs whitespace-nowrap">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{uploadingLogo ? '...' : 'Upload'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingLogo}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingLogo(true);
                  try {
                    const res = await api.uploadFile(file);
                    handleChange('logo_url', res.url);
                    onShowToast?.({ type: 'success', message: 'Logo uploaded successfully!' });
                  } catch (err) {
                    onShowToast?.({ type: 'error', message: 'Failed to upload logo: ' + err.message });
                  } finally {
                    setUploadingLogo(false);
                  }
                }}
              />
            </label>
            {form.logo_url && (
              <button
                type="button"
                onClick={() => handleChange('logo_url', '')}
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition"
                title="Remove custom logo"
              >
                Clear
              </button>
            )}
          </div>
          {/* Logo preview */}
          <div className="mt-3 flex items-center space-x-3">
            <div className="w-14 h-14 rounded-xl p-0.5 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                {form.logo_url ? (
                  <img 
                    src={form.logo_url} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain p-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Shield className="w-7 h-7 text-blue-600" />
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              <strong className="block text-slate-800">Current Logo Emblem</strong>
              <span>Displays in top header, hero banner, and official footer</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs sm:text-sm">
            <span>Hero Background Image (Homepage Banner)</span>
            <span className="text-[11px] text-blue-600 font-bold">Editable</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.hero_image || ''}
              onChange={e => handleChange('hero_image', e.target.value)}
              placeholder="Paste Image URL or click Upload"
              className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono"
            />
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-sm whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingHero ? 'Uploading...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingHero}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingHero(true);
                  try {
                    const res = await api.uploadFile(file);
                    handleChange('hero_image', res.url);
                    onShowToast?.({ type: 'success', message: 'Hero background photo uploaded successfully!' });
                  } catch (err) {
                    onShowToast?.({ type: 'error', message: 'Failed to upload photo: ' + err.message });
                  } finally {
                    setUploadingHero(false);
                  }
                }}
              />
            </label>
            {form.hero_image && (
              <button
                type="button"
                onClick={() => handleChange('hero_image', '')}
                className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition"
                title="Clear background photo"
              >
                Clear
              </button>
            )}
          </div>

          {/* Background Photo Live Preview */}
          <div className="mt-3 relative h-28 rounded-xl overflow-hidden border border-slate-300 shadow-sm group">
            <img 
              src={form.hero_image || "/hero_group_hd.jpg"} 
              alt="Hero Background Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent flex items-center p-4">
              <div className="text-white text-xs max-w-xs">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Live Banner Preview</span>
                <span className="font-bold text-sm line-clamp-1">{form.hostel_name || 'RISE A CHILD CHILDREN HOME'}</span>
                <span className="text-[11px] text-slate-300 line-clamp-1">{form.hostel_tagline || 'A Haven of Love & Learning'}</span>
              </div>
            </div>
          </div>
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
          <label className="block font-semibold text-slate-700 mb-1">Payment QR Code Image (Gallery Upload or URL)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={form.payment_qr || ''}
              onChange={e => handleChange('payment_qr', e.target.value)}
              placeholder="https://... (or choose from gallery below)"
              className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
            />
            <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingQr ? 'Uploading QR...' : 'Upload From Gallery'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingQr}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingQr(true);
                  try {
                    const res = await api.uploadFile(file);
                    handleChange('payment_qr', res.url);
                    onShowToast?.({ type: 'success', message: 'Payment QR Code image uploaded directly from gallery!' });
                  } catch (err) {
                    onShowToast?.({ type: 'error', message: 'Failed to upload QR image: ' + err.message });
                  } finally {
                    setUploadingQr(false);
                  }
                }}
              />
            </label>
          </div>
          {form.payment_qr && (
            <div className="mt-2.5 flex items-center space-x-3">
              <img 
                src={form.payment_qr} 
                alt="QR Preview" 
                className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={() => handleChange('payment_qr', '')}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Custom QR (Revert to Auto)
              </button>
            </div>
          )}
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
              placeholder="https://youtube.com/@nelsonministrys"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-xs"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Official YouTube channel link (e.g. https://youtube.com/@nelsonministrys)</span>
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
            href={api.getChildrenExportExcelUrl()}
            download="RISE_A_CHILD_Children_Records.xlsx"
            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center space-x-1 shadow-xs"
          >
            <span>Download Live Excel File (.xlsx) 📥</span>
          </a>
        </div>
      </div>

      {/* Admissions & Notification Email Settings (Simple 1-Click Update, Zero SMTP Hassle) */}
      <div className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 rounded-2xl p-5 sm:p-7 border border-blue-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
          <div className="flex items-center space-x-2.5 text-blue-900">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-base text-slate-900">
                Official Hostel Notification & Admissions Email
              </h3>
              <p className="text-xs text-slate-500">
                Simple email setup — change your email here anytime with 1 click.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={testingEmail}
            onClick={handleTestEmail}
            className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testingEmail ? 'Sending...' : 'Send Test Email Verification'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Whenever a parent or guardian submits an online admission form, or when donors make inquiries, instant notifications are automatically sent to this email address. <strong>You do not need to configure any SMTP server names or passwords!</strong>
        </p>

        {/* Clean, Simple 1-Click Email Address Field */}
        <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-200/80 space-y-3">
          <label className="block font-bold text-slate-800 text-xs sm:text-sm">
            Recipient Email Address (Where all alerts arrive)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={form.notification_email || form.contact_email || ''}
              onChange={e => {
                const val = e.target.value;
                handleChange('notification_email', val);
                handleChange('contact_email', val);
              }}
              placeholder="e.g. pn9059491777@gmail.com"
              className="flex-1 p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-semibold text-slate-900"
            />
            <button
              type="button"
              disabled={quickSavingEmail}
              onClick={handleQuickSaveEmail}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-blue-200 flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{quickSavingEmail ? 'Updating...' : 'Save New Email'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Currently active recipient: <strong className="text-blue-700 font-semibold">{form.notification_email || form.contact_email || 'pn9059491777@gmail.com'}</strong></span>
          </div>
        </div>

        {/* Optional Collapsed Advanced SMTP Dropdown */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
            className="text-xs font-semibold text-slate-500 hover:text-blue-700 flex items-center space-x-1 cursor-pointer transition"
          >
            <span>{showAdvancedSmtp ? '▼ Hide Advanced SMTP Settings' : '▶ Advanced SMTP Settings (Optional - Not Needed for Normal Use)'}</span>
          </button>

          {showAdvancedSmtp && (
            <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 space-y-3 animate-in fade-in text-xs">
              <p className="text-[11px] text-slate-500">
                Optional: Only fill these if you want to route outgoing mail through your own private mail server instead of direct cloud dispatch.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={form.smtp_host || ''}
                    onChange={e => handleChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SMTP Port</label>
                  <input
                    type="text"
                    value={form.smtp_port || ''}
                    onChange={e => handleChange('smtp_port', e.target.value)}
                    placeholder="465 or 587"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SMTP Username</label>
                  <input
                    type="email"
                    value={form.smtp_user || ''}
                    onChange={e => handleChange('smtp_user', e.target.value)}
                    placeholder="user@example.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={form.smtp_pass || ''}
                    onChange={e => handleChange('smtp_pass', e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
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
