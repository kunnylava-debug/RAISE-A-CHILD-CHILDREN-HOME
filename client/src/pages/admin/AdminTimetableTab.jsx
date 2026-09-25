import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Save, X, 
  CheckCircle2, Bell, Activity, Droplets, Coffee, Bus, 
  BookOpen, Utensils, Moon, GraduationCap, Smile, Sun, Bed, 
  RefreshCw, Check 
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminTimetableTab({ onShowToast }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'am' | 'pm'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    time_slot: '',
    activity: '',
    location_or_notes: '',
    icon_name: 'Clock',
    order_num: 1
  };
  const [form, setForm] = useState(initialForm);

  const iconList = [
    { name: 'Clock', label: 'General / Clock', Icon: Clock },
    { name: 'Bell', label: 'Wake up / Bell', Icon: Bell },
    { name: 'Activity', label: 'Exercise / PT', Icon: Activity },
    { name: 'Droplets', label: 'Bath / Freshen up', Icon: Droplets },
    { name: 'Coffee', label: 'Tea / Milk', Icon: Coffee },
    { name: 'Utensils', label: 'Meals (Breakfast/Lunch/Dinner)', Icon: Utensils },
    { name: 'Bus', label: 'School Departure / Return', Icon: Bus },
    { name: 'BookOpen', label: 'Study / Tuition', Icon: BookOpen },
    { name: 'GraduationCap', label: 'Academics / Coaching', Icon: GraduationCap },
    { name: 'Smile', label: 'Sports & Play', Icon: Smile },
    { name: 'Sun', label: 'Morning Prayer', Icon: Sun },
    { name: 'Moon', label: 'Evening Assembly / Prayer', Icon: Moon },
    { name: 'Bed', label: 'Lights Out / Bedtime', Icon: Bed }
  ];

  const getIconComponent = (name) => {
    const found = iconList.find(i => i.name === name);
    return found ? found.Icon : Clock;
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await api.getTimetable();
      setSchedule(Array.isArray(data) ? data : []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to load timetable: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleOpenAdd = () => {
    setForm({
      id: null,
      time_slot: '',
      activity: '',
      location_or_notes: '',
      icon_name: 'Clock',
      order_num: schedule.length + 1
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      id: item.id,
      time_slot: item.time_slot || '',
      activity: item.activity || '',
      location_or_notes: item.location_or_notes || '',
      icon_name: item.icon_name || 'Clock',
      order_num: item.order_num || 1
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.time_slot.trim() || !form.activity.trim()) {
      onShowToast?.({ type: 'error', message: 'Time slot and activity name are required' });
      return;
    }

    try {
      setSubmitting(true);
      if (form.id) {
        await api.updateTimetableRow(form.id, form);
        onShowToast?.({ type: 'success', message: 'Schedule item adjusted successfully' });
      } else {
        await api.createTimetableRow(form);
        onShowToast?.({ type: 'success', message: 'New activity added to schedule' });
      }
      setEditModalOpen(false);
      loadSchedule();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Save failed: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, activity) => {
    if (!window.confirm(`Delete "${activity}" from the timetable?`)) return;
    try {
      await api.deleteTimetableRow(id);
      onShowToast?.({ type: 'success', message: 'Activity removed from schedule' });
      loadSchedule();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleMove = async (itemId, direction) => {
    const fullIndex = schedule.findIndex(s => s.id === itemId);
    if (fullIndex === -1) return;

    const targetIndex = direction === 'up' ? fullIndex - 1 : fullIndex + 1;
    if (targetIndex < 0 || targetIndex >= schedule.length) return;

    const newSchedule = [...schedule];
    const temp = newSchedule[fullIndex];
    newSchedule[fullIndex] = newSchedule[targetIndex];
    newSchedule[targetIndex] = temp;

    const orderedIds = newSchedule.map(s => s.id);
    setSchedule(newSchedule);

    try {
      await api.reorderTimetable(orderedIds);
      onShowToast?.({ type: 'success', message: 'Schedule order adjusted' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to save order: ' + err.message });
      loadSchedule();
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filterMode === 'am') return (item.time_slot || '').toUpperCase().includes('AM');
    if (filterMode === 'pm') return (item.time_slot || '').toUpperCase().includes('PM');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Interactive Schedule Dashboard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Daily Routine & Time Table
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, adjust time slots, and reorder daily activities. Mobile-optimized for phone screens.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs sm:text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routine Activity</span>
        </button>
      </div>

      {/* Filter Chips & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMode === 'all' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Day ({schedule.length})
          </button>
          <button
            onClick={() => setFilterMode('am')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMode === 'am' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Morning AM ({schedule.filter(s => (s.time_slot || '').toUpperCase().includes('AM')).length})
          </button>
          <button
            onClick={() => setFilterMode('pm')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMode === 'pm' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Afternoon / Night PM ({schedule.filter(s => (s.time_slot || '').toUpperCase().includes('PM')).length})
          </button>
        </div>

        <span className="text-slate-400 text-[11px] hidden sm:inline">
          Use the <strong>▲ Up / ▼ Down</strong> buttons to adjust routine order
        </span>
      </div>

      {/* Schedule Items List (Adjustable Card Grid for Phone & Desktop) */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">No routine items found in this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedule.map((item, index) => {
            const Icon = getIconComponent(item.icon_name);
            const fullIndex = schedule.findIndex(s => s.id === item.id);
            const isFirst = fullIndex === 0;
            const isLast = fullIndex === schedule.length - 1;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left Info: Icon, Time, Activity & Location */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-2xs mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block bg-emerald-100/80 text-emerald-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {item.time_slot}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        #{fullIndex !== -1 ? fullIndex + 1 : index + 1}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words">
                      {item.activity}
                    </h3>

                    {item.location_or_notes && (
                      <p className="text-xs text-slate-500 break-words">
                        📍 {item.location_or_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Controls: Move Up/Down, Edit, Delete (Large touch targets for Phone) */}
                <div className="flex items-center justify-end space-x-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Reorder Buttons */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => handleMove(item.id, 'up')}
                      disabled={isFirst}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-25 transition"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(item.id, 'down')}
                      disabled={isLast}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-25 transition"
                      title="Move later"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center space-x-1 transition border border-emerald-200"
                    title="Edit Activity"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Adjust</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id, item.activity)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                    title="Remove Activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Touch-Friendly Add/Edit Modal (Adjustable on all phone screens) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Clock className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900">
                  {form.id ? 'Adjust Schedule Activity' : 'Add New Schedule Activity'}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {/* Time Slot */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Time Slot * <span className="font-normal text-slate-400 text-[11px]">(e.g. 05:30 AM or 04:00 PM – 05:00 PM)</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.time_slot}
                  onChange={e => setForm({ ...form, time_slot: e.target.value })}
                  placeholder="e.g. 05:30 AM – 06:00 AM"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { t: '05:30 AM', a: 'Wake-up & Personal Hygiene' },
                    { t: '06:00 AM', a: 'Physical Training & Yoga' },
                    { t: '07:30 AM', a: 'Nutritious Breakfast' },
                    { t: '08:30 AM', a: 'School Assembly & Classes' },
                    { t: '01:00 PM', a: 'Wholesome Lunch' },
                    { t: '04:30 PM', a: 'Games, Sports & Recreation' },
                    { t: '06:30 PM', a: 'Evening Study Coaching' },
                    { t: '08:30 PM', a: 'Healthy Dinner & Milk' },
                    { t: '09:30 PM', a: 'Night Prayer & Lights Out' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, time_slot: preset.t, activity: preset.a })}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 transition"
                    >
                      {preset.t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.activity}
                  onChange={e => setForm({ ...form, activity: e.target.value })}
                  placeholder="e.g. Morning Study & Homework Coaching"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Location or Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Location or Guidance Notes <span className="font-normal text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.location_or_notes}
                  onChange={e => setForm({ ...form, location_or_notes: e.target.value })}
                  placeholder="e.g. Main Study Hall with Teachers"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Select Visual Icon
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {iconList.map(item => {
                    const Ic = item.Icon;
                    const isSelected = form.icon_name === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setForm({ ...form, icon_name: item.name })}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center space-y-1 transition text-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                        title={item.label}
                      >
                        <Ic className="w-4 h-4" />
                        <span className="text-[9px] font-semibold truncate w-full">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 text-xs sm:text-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{form.id ? 'Save Adjustments' : 'Add Activity'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
