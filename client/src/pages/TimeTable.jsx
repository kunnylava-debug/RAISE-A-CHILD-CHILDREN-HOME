import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Edit3, Trash2, ArrowUpDown, X, 
  Check, Bell, Activity, Droplets, Coffee, Bus, 
  BookOpen, Utensils, Moon, GraduationCap, Smile, 
  Sun, Edit, Bed 
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function TimeTable({ onShowToast }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const { adminUser } = useAdminAuth();

  const iconMap = {
    Bell, Activity, Droplets, Coffee, Bus, 
    BookOpen, Utensils, Moon, GraduationCap, 
    Smile, Sun, Edit, Bed, Clock
  };

  const fetchSchedule = () => {
    setLoading(true);
    api.getTimetable()
      .then(setSchedule)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleSaveRow = async (e) => {
    e.preventDefault();
    try {
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
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm('Remove this schedule row?')) return;
    try {
      await api.deleteTimetableRow(id);
      onShowToast?.({ type: 'success', message: 'Schedule row deleted' });
      fetchSchedule();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Discipline & Balance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Hostel Daily Time Table
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
            A balanced 24-hour routine combining academics, physical training, spiritual prayer, healthy meals, and restful sleep.
          </p>
        </div>

        {adminUser && (
          <button
            onClick={() => {
              setCurrentRow({
                time_slot: '',
                activity: '',
                location_or_notes: '',
                icon_name: 'Clock',
                order_num: schedule.length + 1
              });
              setEditModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {/* Responsive Table / Timeline Layout */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-36 sm:w-48">Time</th>
                  <th className="py-4 px-6">Scheduled Activity</th>
                  <th className="py-4 px-6 hidden md:table-cell">Location & Notes</th>
                  {adminUser && <th className="py-4 px-6 text-right w-28">Manage</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(schedule) ? schedule : []).map((item, index) => {
                  const Icon = iconMap[item.icon_name] || Clock;
                  const isMorning = item.time_slot.includes('AM');
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Time Column */}
                      <td className="py-4 px-6 font-mono font-bold text-emerald-800 flex-shrink-0 whitespace-nowrap">
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
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {item.activity}
                            </span>
                            <span className="text-slate-500 text-xs md:hidden block mt-0.5">
                              {item.location_or_notes}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location / Notes Column */}
                      <td className="py-4 px-6 text-slate-600 hidden md:table-cell text-xs leading-relaxed">
                        {item.location_or_notes || '—'}
                      </td>

                      {/* Admin Controls */}
                      {adminUser && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setCurrentRow(item);
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg mr-1 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Modal */}
      {editModalOpen && currentRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentRow.id ? 'Edit Timetable Row' : 'Add Activity to Timetable'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                <input
                  type="text"
                  required
                  value={currentRow.time_slot}
                  onChange={e => setCurrentRow({ ...currentRow, time_slot: e.target.value })}
                  placeholder="e.g. 05:30 AM or 03:45 PM - 05:00 PM"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activity Name *</label>
                <input
                  type="text"
                  required
                  value={currentRow.activity}
                  onChange={e => setCurrentRow({ ...currentRow, activity: e.target.value })}
                  placeholder="e.g. Morning Yoga & Physical Exercise"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Notes</label>
                <input
                  type="text"
                  value={currentRow.location_or_notes}
                  onChange={e => setCurrentRow({ ...currentRow, location_or_notes: e.target.value })}
                  placeholder="e.g. Open Sports Ground with Instructor"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Icon Representation</label>
                  <select
                    value={currentRow.icon_name || 'Clock'}
                    onChange={e => setCurrentRow({ ...currentRow, icon_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {Object.keys(iconMap).map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={currentRow.order_num || 0}
                    onChange={e => setCurrentRow({ ...currentRow, order_num: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Save Schedule Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
