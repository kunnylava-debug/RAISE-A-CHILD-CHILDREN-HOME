import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Edit3, Trash2, ArrowUp, ArrowDown, X, 
  Check, Bell, Activity, Droplets, Coffee, Bus, 
  BookOpen, Utensils, Moon, GraduationCap, Smile, 
  Sun, Edit, Bed, Sparkles, Save, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function TimeTable({ onShowToast }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'am' | 'pm'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const { adminUser } = useAdminAuth();

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

  const iconMap = {
    Bell, Activity, Droplets, Coffee, Bus, 
    BookOpen, Utensils, Moon, GraduationCap, 
    Smile, Sun, Edit, Bed, Clock
  };

  const getIconComponent = (name) => {
    return iconMap[name] || Clock;
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const data = await api.getTimetable();
      setSchedule(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      onShowToast?.({ type: 'error', message: 'Failed to load timetable: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenAdd = () => {
    setCurrentRow({
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
    setCurrentRow({
      id: item.id,
      time_slot: item.time_slot || '',
      activity: item.activity || '',
      location_or_notes: item.location_or_notes || '',
      icon_name: item.icon_name || 'Clock',
      order_num: item.order_num || 1
    });
    setEditModalOpen(true);
  };

  const handleSaveRow = async (e) => {
    e.preventDefault();
    if (!currentRow.time_slot.trim() || !currentRow.activity.trim()) {
      onShowToast?.({ type: 'error', message: 'Time slot and activity name are required' });
      return;
    }

    try {
      setSubmitting(true);
      if (currentRow.id) {
        await api.updateTimetableRow(currentRow.id, currentRow);
        onShowToast?.({ type: 'success', message: 'Timetable activity updated' });
      } else {
        await api.createTimetableRow(currentRow);
        onShowToast?.({ type: 'success', message: 'New activity added to schedule' });
      }
      setEditModalOpen(false);
      setCurrentRow(null);
      fetchSchedule();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRow = async (id, activity) => {
    if (!window.confirm(`Remove "${activity || 'this activity'}" from the schedule?`)) return;
    try {
      await api.deleteTimetableRow(id);
      onShowToast?.({ type: 'success', message: 'Schedule row deleted' });
      fetchSchedule();
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
      onShowToast?.({ type: 'error', message: 'Failed to adjust order: ' + err.message });
      fetchSchedule();
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filterMode === 'am') return (item.time_slot || '').toUpperCase().includes('AM');
    if (filterMode === 'pm') return (item.time_slot || '').toUpperCase().includes('PM');
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Discipline & Balance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-slate-900 leading-tight">
            Hostel Daily Time Table
          </h1>
          <p className="text-slate-600 text-xs sm:text-base mt-1 max-w-2xl">
            A balanced 24-hour routine combining academics, physical training, spiritual prayer, healthy meals, and restful sleep.
          </p>
        </div>

        {adminUser && (
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md transition self-stretch sm:self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {/* Filter Tabs for Phone & Desktop */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center space-x-1.5">
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
            Evening PM ({schedule.filter(s => (s.time_slot || '').toUpperCase().includes('PM')).length})
          </button>
        </div>

        {adminUser && (
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Admin mode active: Tap <strong>Adjust</strong> or <strong>▲ / ▼</strong> to customize
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 font-medium">No routine items found in this section.</p>
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* MOBILE VIEW (CARDS TIMELINE) - Displayed on phones (md:hidden) */}
          {/* ============================================================ */}
          <div className="md:hidden space-y-3">
            {filteredSchedule.map((item, index) => {
              const Icon = getIconComponent(item.icon_name);
              const fullIndex = schedule.findIndex(s => s.id === item.id);
              const isFirst = fullIndex === 0;
              const isLast = fullIndex === schedule.length - 1;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
                >
                  {/* Top Bar: Time Slot & Action Icons */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{item.time_slot}</span>
                    </span>

                    <span className="text-[11px] font-bold text-slate-400">
                      Slot #{fullIndex !== -1 ? fullIndex + 1 : index + 1}
                    </span>
                  </div>

                  {/* Activity Details */}
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.activity}
                      </h3>
                      {item.location_or_notes && (
                        <p className="text-xs text-slate-500 mt-1 break-words">
                          📍 {item.location_or_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Touch Controls (Visible on mobile if admin is logged in) */}
                  {adminUser && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {/* Move Up/Down Controls */}
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => handleMove(item.id, 'up')}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-25 transition"
                          title="Move Earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMove(item.id, 'down')}
                          disabled={isLast}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-25 transition"
                          title="Move Later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit & Delete Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center space-x-1 transition border border-emerald-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRow(item.id, item.activity)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* DESKTOP VIEW (CLEAN DATA TABLE) - Displayed on tablet/desktop */}
          {/* ============================================================ */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-48 whitespace-nowrap">Time Slot</th>
                  <th className="py-4 px-6 min-w-[200px]">Scheduled Activity</th>
                  <th className="py-4 px-6">Location & Notes</th>
                  {adminUser && <th className="py-4 px-6 text-right w-44">Manage & Order</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedule.map((item, index) => {
                  const Icon = getIconComponent(item.icon_name);
                  const fullIndex = schedule.findIndex(s => s.id === item.id);
                  const isFirst = fullIndex === 0;
                  const isLast = fullIndex === schedule.length - 1;

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Time Column */}
                      <td className="py-4 px-6 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200/80 inline-block text-xs sm:text-sm">
                          {item.time_slot}
                        </span>
                      </td>

                      {/* Activity Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-sm">
                            {item.activity}
                          </span>
                        </div>
                      </td>

                      {/* Location / Notes Column */}
                      <td className="py-4 px-6 text-slate-600 text-xs leading-relaxed">
                        {item.location_or_notes || '—'}
                      </td>

                      {/* Admin Controls */}
                      {adminUser && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            {/* Reorder Buttons */}
                            <button
                              onClick={() => handleMove(item.id, 'up')}
                              disabled={isFirst}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-25 transition"
                              title="Move Earlier"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMove(item.id, 'down')}
                              disabled={isLast}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-25 transition"
                              title="Move Later"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition"
                              title="Adjust"
                            >
                              Adjust
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteRow(item.id, item.activity)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TOUCH-FRIENDLY ADD / EDIT MODAL FOR MOBILE & DESKTOP */}
      {/* ============================================================ */}
      {editModalOpen && currentRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Clock className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900">
                  {currentRow.id ? 'Adjust Schedule Activity' : 'Add Activity to Timetable'}
                </h3>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="space-y-4 text-xs sm:text-sm">
              {/* Time Slot */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Time Slot * <span className="font-normal text-slate-400 text-[11px]">(e.g. 05:30 AM or 04:00 PM – 05:00 PM)</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentRow.time_slot}
                  onChange={e => setCurrentRow({ ...currentRow, time_slot: e.target.value })}
                  placeholder="e.g. 05:30 AM – 06:00 AM"
                  className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                />
              </div>

              {/* Quick Presets for Mobile/Desktop */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Quick Presets (Tap to Fill):</span>
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
                      onClick={() => setCurrentRow({ ...currentRow, time_slot: preset.t, activity: preset.a })}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 transition text-[11px]"
                    >
                      {preset.t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Activity Name *</label>
                <input
                  type="text"
                  required
                  value={currentRow.activity}
                  onChange={e => setCurrentRow({ ...currentRow, activity: e.target.value })}
                  placeholder="e.g. Morning Yoga & Physical Exercise"
                  className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Location or Guidance Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Location / Guidance Notes (Optional)</label>
                <input
                  type="text"
                  value={currentRow.location_or_notes}
                  onChange={e => setCurrentRow({ ...currentRow, location_or_notes: e.target.value })}
                  placeholder="e.g. Main Playground with Physical Instructor"
                  className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Visual Icon Grid */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Select Visual Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                  {iconList.map(item => {
                    const Ic = item.Icon;
                    const isSelected = (currentRow.icon_name || 'Clock') === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCurrentRow({ ...currentRow, icon_name: item.name })}
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

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
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
                      <span>{currentRow.id ? 'Save Adjustments' : 'Add Activity'}</span>
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
