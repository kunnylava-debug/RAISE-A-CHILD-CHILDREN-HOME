import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Edit2, Trash2, Image, Sparkles, 
  X, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminEventsTab({ onShowToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Celebration',
    description: '',
    image_url: '',
    order_num: 1
  };

  const [form, setForm] = useState(initialForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      setEvents(data || []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to load events: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setForm({
      ...initialForm,
      order_num: (events.length || 0) + 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      date: event.date || '',
      category: event.category || 'Celebration',
      description: event.description || '',
      image_url: event.image_url || '',
      order_num: event.order_num || 1
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) return;
    try {
      await api.deleteEvent(id);
      onShowToast?.({ type: 'success', message: 'Event deleted successfully' });
      loadEvents();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to delete event: ' + err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      onShowToast?.({ type: 'error', message: 'Title and Image URL are required' });
      return;
    }

    try {
      setSubmitting(true);
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, form);
        onShowToast?.({ type: 'success', message: `Event "${form.title}" updated successfully!` });
      } else {
        await api.createEvent(form);
        onShowToast?.({ type: 'success', message: `New event "${form.title}" created successfully!` });
      }
      setModalOpen(false);
      loadEvents();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Error saving event: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Celebrations & Milestones</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Events Management & Photo Highlights
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add, edit, or remove hostel festivals, academic awards, and sports day events.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadEvents}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
            title="Reload Events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center space-x-2 text-xs sm:text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Event</span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm">Loading events from database...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-blue-300" />
          <h3 className="text-base font-bold text-slate-800">No Events Recorded</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Event" to publish the first hostel celebration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-200 hover:border-blue-400 transition-all group shadow-sm hover:shadow-md"
            >
              <div>
                {/* Event Photo Preview */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600/90 text-white backdrop-blur-sm shadow">
                      {event.category || 'Celebration'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-3 text-[11px] font-semibold text-white/90 bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    {event.date}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {event.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons (Edit & Delete) */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Order #{event.order_num || 1}
                </span>

                <div className="flex items-center space-x-2">
                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => handleOpenEdit(event)}
                    className="p-2 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 shadow-xs hover:border-blue-300 transition flex items-center space-x-1 text-xs font-bold"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDelete(event.id, event.title)}
                    className="p-2 rounded-lg bg-white hover:bg-red-50 text-red-500 border border-red-200 shadow-xs hover:border-red-400 transition"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  {editingEvent ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    {editingEvent ? 'Edit Event Details' : 'Add New Event'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingEvent ? `Modifying "${editingEvent.title}"` : 'Enter event celebration details'}
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cultural Fest & Sports Day"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Celebration">Celebration</option>
                    <option value="Sports">Sports & Fitness</option>
                    <option value="Academic">Academic / Science</option>
                    <option value="Cultural">Cultural & Arts</option>
                    <option value="Community">Community Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full p-2.5 bg-white/90 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {form.image_url && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img 
                      src={form.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Summary</label>
                <textarea
                  rows="3"
                  placeholder="Details about the event, activities, and achievements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  <span>{submitting ? 'Saving...' : editingEvent ? 'Save Event Changes' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
