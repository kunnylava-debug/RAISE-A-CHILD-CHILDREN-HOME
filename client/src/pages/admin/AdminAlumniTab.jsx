import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Edit2, Trash2, Image, User, Upload,
  MapPin, Briefcase, Calendar, RefreshCw, X, Check, Quote 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAlumniTab({ onShowToast }) {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const initialForm = {
    name: '',
    stay_years: '2015 – 2021',
    current_position: '',
    location: '',
    photo_url: '',
    quote: '',
    order_num: 1
  };

  const [form, setForm] = useState(initialForm);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const data = await api.getAlumni();
      setAlumni(data || []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to load records: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
  }, []);

  const handleOpenCreate = () => {
    setEditingAlumni(null);
    setForm({
      ...initialForm,
      order_num: (alumni.length || 0) + 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (al) => {
    setEditingAlumni(al);
    setForm({
      name: al.name || '',
      stay_years: al.stay_years || '',
      current_position: al.current_position || '',
      location: al.location || '',
      photo_url: al.photo_url || '',
      quote: al.quote || '',
      order_num: al.order_num || 1
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete record for "${name}"?`)) return;
    try {
      await api.deleteAlumni(id);
      onShowToast?.({ type: 'success', message: 'Record deleted successfully' });
      loadAlumni();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to delete record: ' + err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.current_position.trim()) {
      onShowToast?.({ type: 'error', message: 'Name and current position are required' });
      return;
    }

    try {
      setSubmitting(true);
      if (editingAlumni) {
        await api.updateAlumni(editingAlumni.id, form);
        onShowToast?.({ type: 'success', message: `Record for "${form.name}" updated successfully!` });
      } else {
        await api.createAlumni(form);
        onShowToast?.({ type: 'success', message: `Record for "${form.name}" added successfully!` });
      }
      setModalOpen(false);
      loadAlumni();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Error saving record: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Success Stories • People Who Left From Home Until Now</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            People Who Left From Home Until Now
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showcase where individuals are working and thriving after leaving from our home until now.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAlumni}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Person Who Left From Home</span>
          </button>
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm">Loading records...</p>
        </div>
      ) : alumni.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-blue-300" />
          <h3 className="text-base font-bold text-slate-800">No Records Added Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add Person Who Left From Home" to publish your first success story.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((al) => (
            <div
              key={al.id}
              className="glass-card rounded-2xl overflow-hidden p-6 border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Header with photo and name */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0 shadow-sm flex items-center justify-center bg-slate-100">
                    {al.photo_url ? (
                      <img 
                        src={al.photo_url} 
                        alt={al.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      style={{ display: al.photo_url ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center text-slate-400 bg-slate-100"
                    >
                      <User className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {al.name}
                    </h3>
                    <div className="flex items-center text-xs text-slate-500 mt-0.5 space-x-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      <span>Hostel: {al.stay_years || 'Left From Home'}</span>
                    </div>
                  </div>
                </div>

                {/* Position and Location */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                  <div className="flex items-start space-x-2 text-xs font-semibold text-slate-900">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{al.current_position}</span>
                  </div>
                  {al.location && (
                    <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{al.location}</span>
                    </div>
                  )}
                </div>

                {/* Testimonial Quote */}
                {al.quote && (
                  <div className="text-xs text-slate-600 italic border-l-2 border-blue-400 pl-3 leading-relaxed">
                    "{al.quote}"
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Display Order #{al.order_num || 1}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(al)}
                    className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 shadow-xs flex items-center space-x-1 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(al.id, al.name)}
                    className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-500 border border-red-200 shadow-xs"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    {editingAlumni ? 'Edit Record' : 'Add Person Who Left From Home'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingAlumni ? `Updating ${editingAlumni.name}` : 'Display where individuals who left from home until now are working'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sen"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Years at Hostel</label>
                  <input
                    type="text"
                    placeholder="e.g. 2012 – 2018"
                    value={form.stay_years}
                    onChange={(e) => setForm({ ...form, stay_years: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Position / Profession *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Engineer, Tech Mahindra"
                  value={form.current_position}
                  onChange={(e) => setForm({ ...form, current_position: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Kolkata, West Bengal"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={form.order_num}
                    onChange={(e) => setForm({ ...form, order_num: Number(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs sm:text-sm">
                  <span>Photograph (Optional)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave blank for clean avatar</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Direct Image URL or click Upload"
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                    className="flex-1 p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingPhoto(true);
                        try {
                          const res = await api.uploadFile(file);
                          setForm({ ...form, photo_url: res.url });
                          onShowToast?.({ type: 'success', message: 'Alumni photo uploaded successfully!' });
                        } catch (err) {
                          onShowToast?.({ type: 'error', message: 'Failed to upload photo: ' + err.message });
                        } finally {
                          setUploadingPhoto(false);
                        }
                      }}
                    />
                  </label>
                  {form.photo_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photo_url: '' })}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                      title="Clear photo to keep blank"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  If left blank, the alumni card displays a clean placeholder avatar. No random or predefined stock photos are ever displayed.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Quote / Testimonial</label>
                <textarea
                  rows="3"
                  placeholder="How did the hostel shape their character and future?..."
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 transition disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : editingAlumni ? 'Save Changes' : 'Add Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
