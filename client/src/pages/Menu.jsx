import React, { useState, useEffect } from 'react';
import { Utensils, Coffee, Sun, Moon, Edit3, X, CheckCircle2, Apple } from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Menu({ onShowToast }) {
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const { adminUser } = useAdminAuth();

  const fetchMenu = () => {
    setLoading(true);
    api.getMenu()
      .then(setWeeklyMenu)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      await api.updateMenuDay(editingDay.id, editingDay);
      onShowToast?.({ type: 'success', message: `${editingDay.day_of_week} menu updated` });
      setEditingDay(null);
      fetchMenu();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>Wholesome & Balanced Nutrition</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Weekly Food & Nutrition Menu
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
            Our certified head chef and kitchen team prepare 4 hygienic, fresh, and nutritious meals every day planned according to pediatric dietary guidelines.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 flex items-center space-x-2 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Filtered RO Drinking Water • Fresh Farm Vegetables • Dairy Cow Milk</span>
        </div>
      </div>

      {/* Menu Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-32">Day</th>
                  <th className="py-4 px-6 min-w-[200px]">
                    <div className="flex items-center space-x-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-400" />
                      <span>Breakfast (07:30 AM)</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 min-w-[220px]">
                    <div className="flex items-center space-x-1.5">
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Lunch (02:15 PM)</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 min-w-[180px]">
                    <div className="flex items-center space-x-1.5">
                      <Apple className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Snacks (05:00 PM)</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 min-w-[220px]">
                    <div className="flex items-center space-x-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dinner (08:30 PM)</span>
                    </div>
                  </th>
                  {adminUser && <th className="py-4 px-6 text-right w-20">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(weeklyMenu) ? weeklyMenu : []).map((item, index) => {
                  const isSunday = item.day_of_week === 'Sunday';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSunday ? 'bg-amber-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Day Column */}
                      <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isSunday ? 'bg-amber-100 text-amber-900 font-extrabold' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.day_of_week}
                        </span>
                        {isSunday && (
                          <span className="block text-[10px] text-amber-700 font-bold uppercase mt-1">
                            Festive Feast
                          </span>
                        )}
                      </td>

                      {/* Breakfast */}
                      <td className="py-4 px-6 text-slate-700 leading-relaxed text-xs">
                        {item.breakfast}
                      </td>

                      {/* Lunch */}
                      <td className="py-4 px-6 text-slate-700 leading-relaxed text-xs font-medium">
                        {item.lunch}
                      </td>

                      {/* Snacks */}
                      <td className="py-4 px-6 text-slate-600 leading-relaxed text-xs">
                        {item.snacks || 'Fresh seasonal fruit / milk'}
                      </td>

                      {/* Dinner */}
                      <td className="py-4 px-6 text-slate-700 leading-relaxed text-xs">
                        {item.dinner}
                      </td>

                      {/* Admin Edit */}
                      {adminUser && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingDay(item)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit meal schedule"
                          >
                            <Edit3 className="w-4 h-4" />
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

      {/* Admin Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Update Food Schedule: {editingDay.day_of_week}
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Breakfast Menu</label>
                <textarea
                  rows="2"
                  value={editingDay.breakfast || ''}
                  onChange={e => setEditingDay({ ...editingDay, breakfast: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch Menu</label>
                <textarea
                  rows="2"
                  value={editingDay.lunch || ''}
                  onChange={e => setEditingDay({ ...editingDay, lunch: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evening Snacks</label>
                <textarea
                  rows="2"
                  value={editingDay.snacks || ''}
                  onChange={e => setEditingDay({ ...editingDay, snacks: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dinner Menu</label>
                <textarea
                  rows="2"
                  value={editingDay.dinner || ''}
                  onChange={e => setEditingDay({ ...editingDay, dinner: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Save Day's Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
