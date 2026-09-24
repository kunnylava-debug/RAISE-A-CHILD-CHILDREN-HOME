import React, { useState } from 'react';
import { 
  Menu, X, Phone, Mail, ShieldCheck, Heart, 
  Clock, Utensils, Lock, UserCheck, ChevronDown, ExternalLink 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Navbar({ activeTab, setActiveTab, settings }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const { adminUser, setLoginModalOpen, logout } = useAdminAuth();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'staff', label: 'Staff' },
    { id: 'licence', label: 'Licence' },
    { id: 'children', label: "Children's" },
    { id: 'views', label: 'Views' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'needed', label: 'Needed' },
  ];

  const secondaryItems = [
    { id: 'timetable', label: 'Time Table', icon: Clock },
    { id: 'menu', label: 'Food Menu', icon: Utensils },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all">
      {/* Top micro-bar */}
      <div className="bg-slate-950 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-4 text-xs font-medium">
            <a 
              href={`tel:${settings?.contact_phone || '+919830123456'}`} 
              className="flex items-center hover:text-blue-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>{settings?.contact_phone || '+91 98301 23456'}</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a 
              href={`mailto:${settings?.contact_email || 'contact@raiseachildchildrenhome.org'}`} 
              className="hidden sm:flex items-center hover:text-blue-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 mr-1 text-blue-400" />
              <span>{settings?.contact_email || 'contact@raiseachildchildrenhome.org'}</span>
            </a>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="inline-flex items-center text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Govt. Registered Child Care & Youth Institution
            </span>
            <span className="text-slate-700">|</span>
            {adminUser ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('admin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-0.5 rounded text-xs font-semibold flex items-center transition shadow-xs"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Admin Panel
                </button>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="text-slate-300 hover:text-blue-300 flex items-center transition font-medium"
                title="Staff & Admin Portal Login"
              >
                <Lock className="w-3 h-3 mr-1" />
                Staff Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo & Name */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="flex items-center space-x-3 text-left group focus:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                {settings?.logo_url ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Hostel Logo" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-blue-600" />
                )}
              </div>
            </div>
            <div>
              <span className="block text-lg sm:text-xl font-bold font-serif text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {settings?.hostel_name || "RAISE A CHILD CHILDREN HOME"}
              </span>
              <span className="block text-xs font-semibold text-blue-700 tracking-wide uppercase">
                {settings?.hostel_tagline || "A Haven of Love, Learning & Leadership"}
              </span>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 border border-blue-200/80 shadow-xs'
                      : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Daily Routine / Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center transition-all ${
                  ['timetable', 'menu'].includes(activeTab)
                    ? 'text-blue-700 bg-blue-50/90 border border-blue-200/80 shadow-xs'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100/70'
                }`}
              >
                <span>Schedules</span>
                <ChevronDown className="w-4 h-4 ml-1 text-slate-500" />
              </button>

              {moreDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  {secondaryItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center transition ${
                          activeTab === item.id
                            ? 'text-blue-700 bg-blue-50 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2.5 text-blue-600" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Support CTA Button */}
            <button
              onClick={() => handleNavClick('needed')}
              className="ml-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center space-x-1.5"
            >
              <Heart className="w-4 h-4 fill-white/80" />
              <span>Support Us</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => handleNavClick('needed')}
              className="bg-amber-500 text-white p-2 rounded-lg text-xs font-semibold shadow-sm"
              title="Support Us"
            >
              <Heart className="w-4 h-4 fill-white" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[116px] z-50 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-h-[calc(100vh-116px)] overflow-y-auto px-5 py-6 shadow-2xl border-b border-slate-200 space-y-4">
            <div className="grid grid-cols-1 gap-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-4 py-3 rounded-xl text-base font-semibold text-left transition flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100 my-2">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Schedules & Routines
                </p>
                {secondaryItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`px-4 py-3 rounded-xl text-base font-medium text-left transition flex items-center space-x-3 w-full ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {adminUser && (
                <div className="pt-2 border-t border-slate-100 my-2">
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="w-full px-4 py-3 rounded-xl text-base font-bold bg-slate-900 text-white text-left flex items-center space-x-2"
                  >
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <span>Admin Dashboard</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => handleNavClick('needed')}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <Heart className="w-5 h-5 fill-white/80" />
                <span>Support Our Children (Donate)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
