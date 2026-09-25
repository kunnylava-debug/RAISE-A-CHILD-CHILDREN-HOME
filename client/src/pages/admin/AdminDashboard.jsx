import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Settings, UserCheck, Users, 
  FileText, ShieldCheck, Image, Clock, Utensils, 
  Heart, CreditCard, LogOut, ArrowRight, ExternalLink, 
  Sparkles, CheckCircle2, Calendar, PackageCheck, GraduationCap, KeyRound, Lock, Share2 
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminSettingsTab from './AdminSettingsTab';
import AdminSocialLinksTab from './AdminSocialLinksTab';
import AdminTimetableTab from './AdminTimetableTab';
import AdminFounderVideoTab from './AdminFounderVideoTab';
import AdminAdmissionsTab from './AdminAdmissionsTab';
import AdminEventsTab from './AdminEventsTab';
import AdminDonationsTab from './AdminDonationsTab';
import AdminAlumniTab from './AdminAlumniTab';
import AdminCredentialsTab from './AdminCredentialsTab';
import AdminPaymentsTab from './AdminPaymentsTab';
import { api } from '../../services/api';

export default function AdminDashboard({ settings, onRefreshSettings, setActiveTab, onShowToast }) {
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [stats, setStats] = useState({
    total_children: 120,
    total_staff: 8,
    pending_admissions: 0,
    total_facilities: 6,
    needed_items: 8
  });

  const { adminUser, logout, setLoginModalOpen } = useAdminAuth();

  useEffect(() => {
    if (!adminUser) return;
    Promise.all([
      api.getChildren({ limit: 1 }),
      api.getStaff(),
      api.getAdmissions({ status: 'Pending' }),
      api.getViews(),
      api.getNeededItems()
    ]).then(([childRes, staff, admRes, views, needed]) => {
      setStats({
        total_children: childRes?.total_children ?? 120,
        total_staff: Array.isArray(staff) ? staff.length : 8,
        pending_admissions: admRes?.stats?.pending ?? 0,
        total_facilities: Array.isArray(views) ? views.length : 6,
        needed_items: Array.isArray(needed) ? needed.length : 8
      });
    }).catch(console.error);
  }, [adminUser]);

  if (!adminUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 mt-2">
              You must be signed in with valid staff or administrator credentials to view and manage hostel operations.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Open Staff / Admin Login</span>
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition text-xs"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'social_links', label: 'Follow Us (Facebook, Instagram & YouTube)', icon: Share2 },
    { id: 'payments', label: 'PhonePe, GPay & UPI Options', icon: CreditCard },
    { id: 'events', label: 'Events & Celebrations', icon: Calendar },
    { id: 'donations', label: 'Donations & Needs Sync', icon: PackageCheck },
    { id: 'alumni', label: 'People Who Left From Home Until Now', icon: GraduationCap },
    { id: 'admissions', label: 'Admissions Desk', icon: FileText, badge: stats.pending_admissions > 0 ? stats.pending_admissions : null },
    { id: 'settings', label: 'Home, Logo & Maps', icon: Settings },
    { id: 'credentials', label: 'Username & Password', icon: KeyRound },
    { id: 'founder_video', label: 'Founder & Video', icon: UserCheck },
    { id: 'manage_children', label: 'Children Records', icon: Users, navigateTo: 'children' },
    { id: 'manage_staff', label: 'Staff Profiles', icon: Users, navigateTo: 'staff' },
    { id: 'manage_licence', label: 'Licence & Certificate', icon: ShieldCheck, navigateTo: 'licence' },
    { id: 'manage_views', label: 'Facility Photos', icon: Image, navigateTo: 'views' },
    { id: 'timetable', label: 'Daily Routine & Schedule', icon: Clock },
    { id: 'manage_menu', label: 'Food Menu', icon: Utensils, navigateTo: 'menu' },
    { id: 'manage_needed', label: 'Needs & Supporters', icon: Heart, navigateTo: 'needed' },
  ];

  const handleSelectAdminTab = (tabId) => {
    setActiveAdminTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('admin-content-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-blue-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Master Administration System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mt-1 text-white">
            Hostel Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Logged in as <strong className="text-white font-semibold">{adminUser?.username}</strong> ({adminUser?.role})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('home')}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition border border-white/20"
          >
            <span>Preview Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav (approx 3 cols) */}
        <aside className="lg:col-span-3 glass-panel rounded-3xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Navigation Console
          </span>

          {menuItems.map(item => {
            const Icon = item.icon;
            const isSelected = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.navigateTo) {
                    setActiveTab(item.navigateTo);
                  } else {
                    handleSelectAdminTab(item.id);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.navigateTo && (
                  <ExternalLink className="w-3 h-3 opacity-40" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Area (approx 9 cols) */}
        <main id="admin-content-section" className="lg:col-span-9 scroll-mt-24">
          {/* Mobile Quick Tab Switcher */}
          <div className="lg:hidden mb-5 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Section</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                {menuItems.find(m => m.id === activeAdminTab)?.label || 'Overview'}
              </span>
            </div>
            <select
              value={activeAdminTab}
              onChange={(e) => {
                const found = menuItems.find(m => m.id === e.target.value);
                if (found?.navigateTo) {
                  setActiveTab(found.navigateTo);
                } else {
                  handleSelectAdminTab(e.target.value);
                }
              }}
              className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[170px] truncate"
            >
              {menuItems.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {activeAdminTab === 'overview' && (
            <div className="space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveTab('children')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase text-slate-400">Total Enrolled</span>
                  <span className="block text-3xl font-bold font-serif text-slate-900 mt-1">{stats.total_children}</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center mt-2">
                    <span>Manage Children Directory</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveAdminTab('admissions')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase text-slate-400">Pending Admissions</span>
                  <span className="block text-3xl font-bold font-serif text-amber-600 mt-1">{stats.pending_admissions}</span>
                  <span className="text-[11px] text-amber-700 font-semibold flex items-center mt-2">
                    <span>Review Applicants</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('staff')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase text-slate-400">Staff Members</span>
                  <span className="block text-3xl font-bold font-serif text-slate-900 mt-1">{stats.total_staff}</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center mt-2">
                    <span>View Staff Roster</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('needed')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase text-slate-400">Active Needs</span>
                  <span className="block text-3xl font-bold font-serif text-slate-900 mt-1">{stats.needed_items}</span>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center mt-2">
                    <span>Manage Needs & Donors</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="glass-card rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  Quick Administration Shortcuts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <button
                    onClick={() => handleSelectAdminTab('timetable')}
                    className="p-4 bg-white hover:bg-emerald-50/70 rounded-2xl border border-emerald-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-emerald-400"
                  >
                    <span>Adjust Daily Routine & Schedule</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('social_links')}
                    className="p-4 bg-white hover:bg-indigo-50/70 rounded-2xl border border-indigo-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-indigo-400"
                  >
                    <span>Edit Facebook, Instagram & YouTube Links</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('events')}
                    className="p-4 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-blue-300"
                  >
                    <span>Edit Events & Celebrations</span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('donations')}
                    className="p-4 bg-white hover:bg-emerald-50 rounded-2xl border border-emerald-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs"
                  >
                    <span>Cross-Check Donations & Needs</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('alumni')}
                    className="p-4 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-blue-300"
                  >
                    <span>People Who Left From Home Until Now</span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('credentials')}
                    className="p-4 bg-white hover:bg-amber-50 rounded-2xl border border-amber-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs"
                  >
                    <span>Change Admin Username/Password</span>
                    <ArrowRight className="w-4 h-4 text-amber-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('settings')}
                    className="p-4 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-blue-300"
                  >
                    <span>Change Logo, Hero & Google Maps</span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </button>

                  <button
                    onClick={() => setActiveAdminTab('payments')}
                    className="p-4 bg-white hover:bg-emerald-50/70 rounded-2xl border border-emerald-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-emerald-400"
                  >
                    <span>Edit PhonePe, GPay & UPI</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => setActiveTab('needed')}
                    className="p-4 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 font-bold text-slate-800 text-left transition flex items-center justify-between shadow-xs hover:border-blue-300"
                  >
                    <span>Public Needs & Bank UPI QR</span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeAdminTab === 'timetable' && (
            <AdminTimetableTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'social_links' && (
            <AdminSocialLinksTab 
              settings={settings}
              onRefreshSettings={onRefreshSettings}
              onShowToast={onShowToast}
            />
          )}

          {activeAdminTab === 'payments' && (
            <AdminPaymentsTab 
              settings={settings}
              onRefreshSettings={onRefreshSettings}
              onShowToast={onShowToast}
            />
          )}

          {activeAdminTab === 'events' && (
            <AdminEventsTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'donations' && (
            <AdminDonationsTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'alumni' && (
            <AdminAlumniTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'credentials' && (
            <AdminCredentialsTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'admissions' && (
            <AdminAdmissionsTab onShowToast={onShowToast} />
          )}

          {activeAdminTab === 'settings' && (
            <AdminSettingsTab 
              settings={settings} 
              onRefreshSettings={onRefreshSettings} 
              onShowToast={onShowToast} 
            />
          )}

          {activeAdminTab === 'founder_video' && (
            <AdminFounderVideoTab 
              settings={settings} 
              onRefreshSettings={onRefreshSettings} 
              onShowToast={onShowToast} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
