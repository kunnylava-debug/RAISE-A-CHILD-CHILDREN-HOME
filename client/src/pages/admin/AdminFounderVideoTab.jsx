import React, { useState } from 'react';
import { Save, UserCheck, Video } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminFounderVideoTab({ settings, onRefreshSettings, onShowToast }) {
  const [form, setForm] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(form);
      onShowToast?.({ type: 'success', message: 'Founder and video details saved successfully' });
      onRefreshSettings?.();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-xs sm:text-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900">Founder & Hostel Video Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Edit founder biography, quote, and direct-play embedded video.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow flex items-center space-x-2 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Founder Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <UserCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
          <span>Founder Section Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Founder Full Name</label>
            <input
              type="text"
              value={form.founder_name || ''}
              onChange={e => handleChange('founder_name', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Founder Role / Title</label>
            <input
              type="text"
              value={form.founder_role || ''}
              onChange={e => handleChange('founder_role', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Photograph URL</label>
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
              <img
                src={form.founder_photo || "/founder_square.jpg"}
                alt="Founder Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/founder_square.jpg"; }}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={form.founder_photo || ''}
                onChange={e => handleChange('founder_photo', e.target.value)}
                placeholder="/founder_square.jpg"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: /founder_square.jpg (Official enhanced portrait of BRO.NELSON A)</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Biography & Background</label>
          <textarea
            rows="3"
            value={form.founder_bio || ''}
            onChange={e => handleChange('founder_bio', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Vision Quote</label>
          <input
            type="text"
            value={form.founder_vision || ''}
            onChange={e => handleChange('founder_vision', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Message to Children, Parents & Supporters</label>
          <textarea
            rows="3"
            value={form.founder_message || ''}
            onChange={e => handleChange('founder_message', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Video Settings */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Video className="w-4 h-4 mr-1.5 text-emerald-600" />
          <span>Hostel Video Section (Playable Directly on Website)</span>
        </h3>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Video Title</label>
          <input
            type="text"
            value={form.video_title || ''}
            onChange={e => handleChange('video_title', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Video File / Stream URL (.mp4)</label>
          <input
            type="text"
            value={form.video_url || ''}
            onChange={e => handleChange('video_url', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Video Poster Cover Image URL</label>
          <input
            type="text"
            value={form.video_poster || ''}
            onChange={e => handleChange('video_poster', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save Founder & Video Settings'}
        </button>
      </div>
    </form>
  );
}
