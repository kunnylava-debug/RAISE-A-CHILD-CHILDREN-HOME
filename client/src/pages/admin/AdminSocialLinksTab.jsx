import React, { useState, useEffect } from 'react';
import { Share2, Save, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminSocialLinksTab({ settings, onRefreshSettings, onShowToast }) {
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFacebook(settings.social_facebook || '');
      setInstagram(settings.social_instagram || '');
      setYoutube(settings.social_youtube || '');
    }
  }, [settings]);

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        social_facebook: facebook.trim(),
        social_instagram: instagram.trim(),
        social_youtube: youtube.trim()
      });

      // Also persist to localStorage for instant offline access
      const updated = {
        ...(settings || {}),
        social_facebook: facebook.trim(),
        social_instagram: instagram.trim(),
        social_youtube: youtube.trim()
      };
      localStorage.setItem('rac_cached_settings', JSON.stringify(updated));

      onRefreshSettings?.();
      onShowToast?.({
        type: 'success',
        title: 'Social Links Updated',
        message: 'Facebook, Instagram, and YouTube links saved successfully.'
      });
    } catch (err) {
      onShowToast?.({
        type: 'error',
        message: 'Failed to update social links: ' + (err.message || 'Server error')
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-3 text-indigo-700 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
              Social Media & Follow Us Links
            </h2>
            <p className="text-xs text-slate-500">
              Configure the official Facebook, Instagram, and YouTube links displayed across your website and footer.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Facebook Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 font-bold text-sm text-slate-800">
              <span className="w-6 h-6 rounded-lg bg-[#1877F2] text-white flex items-center justify-center font-extrabold text-xs">
                f
              </span>
              <span>Facebook Page URL</span>
            </label>
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <input
            type="url"
            value={facebook}
            onChange={e => setFacebook(e.target.value)}
            placeholder="https://facebook.com/your-hostel-page"
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
          />
          <p className="text-[11px] text-slate-400">
            e.g. https://facebook.com/raiseachild or your organization page link
          </p>
        </div>

        {/* Instagram Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 font-bold text-sm text-slate-800">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-xs">
                IG
              </span>
              <span>Instagram Profile URL</span>
            </label>
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-600 hover:text-pink-800 flex items-center space-x-1 font-semibold"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <input
            type="url"
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
            placeholder="https://instagram.com/your-hostel-profile"
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none text-sm transition"
          />
          <p className="text-[11px] text-slate-400">
            e.g. https://instagram.com/raiseachild
          </p>
        </div>

        {/* YouTube Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 font-bold text-sm text-slate-800">
              <span className="w-6 h-6 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-extrabold text-xs">
                ▶
              </span>
              <span>YouTube Channel URL</span>
            </label>
            {youtube && (
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1 font-semibold"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <input
            type="url"
            value={youtube}
            onChange={e => setYoutube(e.target.value)}
            placeholder="https://youtube.com/@your-channel-handle"
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none text-sm transition"
          />
          <p className="text-[11px] text-slate-400">
            e.g. https://youtube.com/@raiseachild
          </p>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-2 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
            Live Footer Preview:
          </span>
          <div className="flex items-center space-x-2 flex-wrap gap-y-2 pt-1">
            <div className="inline-flex items-center space-x-1.5 bg-[#1877F2]/20 text-blue-300 border border-[#1877F2]/40 px-3 py-1 rounded-lg text-xs font-semibold">
              <span>Facebook</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 bg-[#E4405F]/20 text-pink-300 border border-[#E4405F]/40 px-3 py-1 rounded-lg text-xs font-semibold">
              <span>Instagram</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 bg-[#FF0000]/20 text-red-300 border border-[#FF0000]/40 px-3 py-1 rounded-lg text-xs font-semibold">
              <span>YouTube</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Links...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Social Media Links</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
