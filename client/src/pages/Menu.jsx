import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Utensils, Coffee, Sun, Moon, Edit3, X, CheckCircle2, 
  Apple, Plus, Calendar, Sparkles, Clock, Trash2, 
  Check, AlertCircle, ChevronRight, Eye
} from 'lucide-react';
import { api, subscribeToRealtimeSync } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Menu({ onShowToast }) {
  // Instant cache hydration: Render immediately from localStorage if available (0ms lag)
  const [weeklyMenu, setWeeklyMenu] = useState(() => {
    try {
      const cached = localStorage.getItem('rac_cached_menu');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(() => weeklyMenu.length === 0);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all'); // 'all' | 'Monday' | 'Tuesday' | ...
  const [editingDay, setEditingDay] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialNewDay = {
    day_of_week: 'Monday',
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: ''
  };
  const [newDayForm, setNewDayForm] = useState(initialNewDay);

  const { adminUser } = useAdminAuth();

  // Current Day of the Week in user's locale
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  const standardDaysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Stale-While-Revalidate: Fetch latest menu without blocking UI
  const fetchMenu = useCallback((showLoading = false) => {
    if (showLoading && weeklyMenu.length === 0) setLoading(true);
    api.getMenu()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Sort in natural Monday..Sunday order
        const sorted = [...list].sort((a, b) => {
          const indexA = standardDaysOrder.indexOf(a.day_of_week);
          const indexB = standardDaysOrder.indexOf(b.day_of_week);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return (a.id || 0) - (b.id || 0);
        });
        setWeeklyMenu(sorted);
        try {
          localStorage.setItem('rac_cached_menu', JSON.stringify(sorted));
        } catch (e) {}
      })
      .catch((err) => {
        console.error(err);
        if (weeklyMenu.length === 0) {
          onShowToast?.({ type: 'error', message: 'Failed to load food timetable: ' + err.message });
        }
      })
      .finally(() => setLoading(false));
  }, [weeklyMenu.length, onShowToast]);

  useEffect(() => {
    fetchMenu(weeklyMenu.length === 0);
    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'MENU_UPDATED') {
        console.log('[REAL-TIME SYNC] Food timetable updated, reloading...');
        fetchMenu(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDay.day_of_week?.trim()) {
      onShowToast?.({ type: 'error', message: 'Day of week is required' });
      return;
    }
    try {
      setSubmitting(true);
      await api.updateMenuDay(editingDay.id, editingDay);
      onShowToast?.({ 
        type: 'success', 
        title: 'Food Time Table Updated',
        message: `${editingDay.day_of_week} menu schedule has been updated successfully.` 
      });
      setEditingDay(null);
      fetchMenu(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to update day menu' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDay = async (e) => {
    e.preventDefault();
    if (!newDayForm.day_of_week?.trim()) {
      onShowToast?.({ type: 'error', message: 'Please provide the day name (e.g. Monday, Sunday, Special Festival Day).' });
      return;
    }

    try {
      setSubmitting(true);
      if (api.createMenuDay) {
        await api.createMenuDay(newDayForm);
      } else {
        await api.updateMenuDay(Date.now(), newDayForm);
      }
      onShowToast?.({ 
        type: 'success', 
        title: 'Day Added to Food Time Table',
        message: `Schedule for ${newDayForm.day_of_week} created successfully.` 
      });
      setAddModalOpen(false);
      setNewDayForm(initialNewDay);
      fetchMenu(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to add day to food timetable' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDay = async (id, dayName) => {
    if (!window.confirm(`Are you sure you want to remove ${dayName} from the food timetable?`)) return;
    try {
      if (api.deleteMenuDay) {
        await api.deleteMenuDay(id);
      }
      onShowToast?.({ type: 'success', message: `${dayName} removed from food timetable.` });
      fetchMenu(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to delete day' });
    }
  };

  // Memoized filter items according to selected day filter
  const displayedMenu = useMemo(() => {
    if (selectedDayFilter === 'all') return weeklyMenu;
    return weeklyMenu.filter(m => (m.day_of_week || '').toLowerCase() === selectedDayFilter.toLowerCase());
  }, [weeklyMenu, selectedDayFilter]);

  const todayMenu = useMemo(() => {
    return weeklyMenu.find(m => (m.day_of_week || '').toLowerCase() === todayName.toLowerCase());
  }, [weeklyMenu, todayName]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>Daily Nutrition & Dining Schedule</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Food Time Table & Weekly Menu
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
            Our certified head chef and kitchen staff serve 4 freshly prepared, hygienic meals every day according to recommended pediatric dietary standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {adminUser && (
            <button
              onClick={() => {
                setNewDayForm({
                  day_of_week: '',
                  breakfast: '',
                  lunch: '',
                  snacks: '',
                  dinner: ''
                });
                setAddModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Day to Food Time Table</span>
            </button>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 flex items-center space-x-2 text-xs text-emerald-900 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>RO Purified Water • Farm Vegetables • Fresh Cow Milk</span>
          </div>
        </div>
      </div>

      {/* TODAY'S ACTIVE HIGHLIGHT BANNER */}
      {todayMenu && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 rounded-3xl border border-amber-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
                Today's Food Time Table ({todayName})
              </span>
            </div>
            <button
              onClick={() => setSelectedDayFilter(todayName)}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Focus on Today's Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Breakfast */}
            <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1 text-amber-700 font-bold text-[11px]">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>Morning Breakfast (07:30 AM)</span>
              </div>
              <p className="text-slate-800 line-clamp-2 leading-relaxed">{todayMenu.breakfast}</p>
            </div>

            {/* Lunch */}
            <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1 text-yellow-800 font-bold text-[11px]">
                <Sun className="w-3.5 h-3.5 text-yellow-600" />
                <span>Hot Lunch (02:15 PM)</span>
              </div>
              <p className="text-slate-800 line-clamp-2 leading-relaxed font-medium">{todayMenu.lunch}</p>
            </div>

            {/* Snacks */}
            <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1 text-emerald-800 font-bold text-[11px]">
                <Apple className="w-3.5 h-3.5 text-emerald-600" />
                <span>Evening Snacks (05:00 PM)</span>
              </div>
              <p className="text-slate-800 line-clamp-2 leading-relaxed">{todayMenu.snacks || 'Fresh seasonal fruit / milk'}</p>
            </div>

            {/* Dinner */}
            <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
              <div className="flex items-center space-x-1 text-indigo-800 font-bold text-[11px]">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Night Dinner (08:30 PM)</span>
              </div>
              <p className="text-slate-800 line-clamp-2 leading-relaxed">{todayMenu.dinner}</p>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DAYS OF THE WEEK SELECTOR / FILTER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Select Day to View Food Schedule:</span>
          </div>
          {selectedDayFilter !== 'all' && (
            <button
              onClick={() => setSelectedDayFilter('all')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Show All 7 Days
            </button>
          )}
        </div>

        {/* Day Pills Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All Days Tab */}
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
              selectedDayFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All 7 Days (Full Timetable)
          </button>

          {/* Today Button */}
          {todayMenu && (
            <button
              onClick={() => setSelectedDayFilter(todayName)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                selectedDayFilter.toLowerCase() === todayName.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today ({todayName})</span>
            </button>
          )}

          {/* Individual Days Buttons */}
          {weeklyMenu.map((item) => {
            const isSelected = selectedDayFilter.toLowerCase() === item.day_of_week.toLowerCase();
            const isToday = item.day_of_week.toLowerCase() === todayName.toLowerCase();
            const isSunday = item.day_of_week.toLowerCase() === 'sunday';

            return (
              <button
                key={item.id}
                onClick={() => setSelectedDayFilter(item.day_of_week)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer relative ${
                  isSelected
                    ? isSunday
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-900 text-white shadow-md'
                    : isToday
                    ? 'bg-white text-emerald-800 border-2 border-emerald-500 hover:bg-emerald-50'
                    : isSunday
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{item.day_of_week}</span>
                {isSunday && (
                  <span className="ml-1 text-[10px] text-amber-700 font-extrabold hidden sm:inline">
                    (Feast)
                  </span>
                )}
                {isToday && !isSelected && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Food Timetable Display */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : displayedMenu.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto">
          <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Meals Listed for This Day</h3>
          <p className="text-xs text-slate-500">
            No schedule entered for {selectedDayFilter}. You can add it using the button above.
          </p>
          {adminUser && (
            <button
              onClick={() => {
                setNewDayForm({ ...initialNewDay, day_of_week: selectedDayFilter });
                setAddModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add {selectedDayFilter} Menu</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* MOBILE VIEW & FOCUSED DAY VIEW: Responsive Meal Cards */}
          <div className={`${selectedDayFilter !== 'all' ? 'block' : 'lg:hidden'} space-y-4`}>
            {displayedMenu.map((item) => {
              const isSunday = item.day_of_week === 'Sunday';
              const isToday = item.day_of_week.toLowerCase() === todayName.toLowerCase();

              return (
                <div 
                  key={item.id} 
                  className={`rounded-3xl border p-5 sm:p-6 shadow-sm transition space-y-4 ${
                    isToday
                      ? 'bg-emerald-50/20 border-emerald-300 shadow-md ring-1 ring-emerald-200'
                      : isSunday
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isSunday
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-900 text-white'
                      }`}>
                        {item.day_of_week}
                      </span>
                      {isToday && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Today</span>
                        </span>
                      )}
                      {isSunday && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                          Weekly Festive Feast
                        </span>
                      )}
                    </div>

                    {adminUser && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingDay(item)}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDay(item.id, item.day_of_week)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Breakfast */}
                    <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-amber-800 font-bold text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-600" />
                          <span>Breakfast</span>
                        </span>
                        <span className="text-amber-700 font-mono text-[10px] bg-amber-100/80 px-2 py-0.5 rounded-full">07:30 AM</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-normal">{item.breakfast || 'Nutritious morning meal & warm milk'}</p>
                    </div>

                    {/* Lunch */}
                    <div className="bg-yellow-50/70 p-3.5 rounded-2xl border border-yellow-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-yellow-900 font-bold text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Sun className="w-3.5 h-3.5 text-yellow-600" />
                          <span>Wholesome Lunch</span>
                        </span>
                        <span className="text-yellow-800 font-mono text-[10px] bg-yellow-100/80 px-2 py-0.5 rounded-full">02:15 PM</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">{item.lunch || 'Steamed rice, dal & hot vegetables'}</p>
                    </div>

                    {/* Snacks */}
                    <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-900 font-bold text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Apple className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Evening Nutrition</span>
                        </span>
                        <span className="text-emerald-800 font-mono text-[10px] bg-emerald-100/80 px-2 py-0.5 rounded-full">05:00 PM</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{item.snacks || 'Fresh seasonal fruit / milk'}</p>
                    </div>

                    {/* Dinner */}
                    <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200/60 space-y-1.5">
                      <div className="flex items-center justify-between text-indigo-900 font-bold text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Moon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Night Dinner</span>
                        </span>
                        <span className="text-indigo-800 font-mono text-[10px] bg-indigo-100/80 px-2 py-0.5 rounded-full">08:30 PM</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{item.dinner || 'Rotis, sabzi, dal & bedtime milk'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP FULL TABLE VIEW (Shown when 'All Days' is selected on large screens) */}
          {selectedDayFilter === 'all' && (
            <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-4 px-6 w-36">Day of Week</th>
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
                      {adminUser && <th className="py-4 px-6 text-right w-24">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weeklyMenu.map((item, index) => {
                      const isSunday = item.day_of_week === 'Sunday';
                      const isToday = item.day_of_week.toLowerCase() === todayName.toLowerCase();

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isToday
                              ? 'bg-emerald-50/30 font-medium'
                              : isSunday
                              ? 'bg-amber-50/30'
                              : index % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Day Column */}
                          <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isToday
                                  ? 'bg-emerald-600 text-white'
                                  : isSunday
                                  ? 'bg-amber-100 text-amber-900 font-extrabold'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {item.day_of_week}
                              </span>
                              {isToday && (
                                <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Today
                                </span>
                              )}
                            </div>
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

                          {/* Admin Actions */}
                          {adminUser && (
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => setEditingDay(item)}
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Edit meals"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDay(item.id, item.day_of_week)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete day"
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
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW DAY TO FOOD TIMETABLE */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Add Day to Food Time Table
                </h3>
              </div>
              <button 
                onClick={() => setAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDay} className="space-y-4 text-xs sm:text-sm">
              {/* Day Name Selector / Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Day of the Week <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={standardDaysOrder.includes(newDayForm.day_of_week) ? newDayForm.day_of_week : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setNewDayForm({ ...newDayForm, day_of_week: e.target.value });
                      }
                    }}
                    className="p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                  >
                    {standardDaysOrder.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="custom">Custom Day Name...</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Monday or Festival Day"
                    value={newDayForm.day_of_week}
                    onChange={e => setNewDayForm({ ...newDayForm, day_of_week: e.target.value })}
                    className="p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Breakfast */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Morning Breakfast (07:30 AM)</span>
                  </span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Idli / Vegetable Upma, Sambar, Boiled Egg / Sprouts, Warm Cow Milk"
                  value={newDayForm.breakfast}
                  onChange={e => setNewDayForm({ ...newDayForm, breakfast: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              {/* Lunch */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Sun className="w-3.5 h-3.5 text-yellow-600" />
                    <span>Hot Lunch (02:15 PM)</span>
                  </span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Steamed Rice, Dal, Seasonal Curry, Papad, Sweet Curd"
                  value={newDayForm.lunch}
                  onChange={e => setNewDayForm({ ...newDayForm, lunch: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              {/* Snacks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Apple className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Evening Snacks (05:00 PM)</span>
                  </span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Boiled Chana Chaat / Poha, Fresh Banana / Apple, Warm Milk"
                  value={newDayForm.snacks}
                  onChange={e => setNewDayForm({ ...newDayForm, snacks: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              {/* Dinner */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Night Dinner (08:30 PM)</span>
                  </span>
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Handmade Tawa Rotis, Paneer Bhurji / Veg Korma, Dal Tadka, Bedtime Milk"
                  value={newDayForm.dinner}
                  onChange={e => setNewDayForm({ ...newDayForm, dinner: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Saving Day...' : 'Add Day to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING DAY */}
      {editingDay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Update Food Schedule: {editingDay.day_of_week}
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day Name</label>
                <input
                  type="text"
                  required
                  value={editingDay.day_of_week || ''}
                  onChange={e => setEditingDay({ ...editingDay, day_of_week: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Breakfast Menu (07:30 AM)</span>
                </label>
                <textarea
                  rows="2"
                  value={editingDay.breakfast || ''}
                  onChange={e => setEditingDay({ ...editingDay, breakfast: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Sun className="w-3.5 h-3.5 text-yellow-600" />
                  <span>Lunch Menu (02:15 PM)</span>
                </label>
                <textarea
                  rows="2"
                  value={editingDay.lunch || ''}
                  onChange={e => setEditingDay({ ...editingDay, lunch: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Apple className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evening Snacks (05:00 PM)</span>
                </label>
                <textarea
                  rows="2"
                  value={editingDay.snacks || ''}
                  onChange={e => setEditingDay({ ...editingDay, snacks: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dinner Menu (08:30 PM)</span>
                </label>
                <textarea
                  rows="2"
                  value={editingDay.dinner || ''}
                  onChange={e => setEditingDay({ ...editingDay, dinner: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteDay(editingDay.id, editingDay.day_of_week)}
                  className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center space-x-1 p-2 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Day</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingDay(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
