import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RestrictionModal from './components/RestrictionModal';
import Toast from './components/Toast';

import Home from './pages/Home';
import Staff from './pages/Staff';
import Licence from './pages/Licence';
import Children from './pages/Children';
import Views from './pages/Views';
import Admissions from './pages/Admissions';
import Needed from './pages/Needed';
import TimeTable from './pages/TimeTable';
import Menu from './pages/Menu';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginModal from './pages/admin/AdminLoginModal';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null);
  const [restrictionModalOpen, setRestrictionModalOpen] = useState(false);
  const [hasAcceptedRestriction, setHasAcceptedRestriction] = useState(false);

  const fetchSettings = () => {
    api.getSettings()
      .then(data => setSettings(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
    const accepted = localStorage.getItem('shanti_restriction_accepted');
    if (accepted === 'true') {
      setHasAcceptedRestriction(true);
    }
  }, []);

  const handleTabChange = (tabId) => {
    // Check if visiting admissions or children for the first time
    if (!hasAcceptedRestriction && (tabId === 'admissions' || tabId === 'children')) {
      setRestrictionModalOpen(true);
      return;
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptRestriction = () => {
    localStorage.setItem('shanti_restriction_accepted', 'true');
    setHasAcceptedRestriction(true);
    setRestrictionModalOpen(false);
    setToast({
      type: 'success',
      title: 'Consent Recorded',
      message: 'Thank you for accepting the Hostel Safety Protocol.'
    });
  };

  return (
    <AdminAuthProvider>
      <div className="min-h-screen flex flex-col bg-transparent text-slate-800 font-sans">
        {/* Navigation Bar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          settings={settings} 
        />

        {/* Dynamic Page Content */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <Home 
              setActiveTab={handleTabChange} 
              settings={settings} 
              onShowToast={setToast} 
            />
          )}

          {activeTab === 'staff' && (
            <Staff onShowToast={setToast} />
          )}

          {activeTab === 'licence' && (
            <Licence onShowToast={setToast} />
          )}

          {activeTab === 'children' && (
            <Children onShowToast={setToast} />
          )}

          {activeTab === 'views' && (
            <Views onShowToast={setToast} />
          )}

          {activeTab === 'admissions' && (
            <Admissions 
              settings={settings} 
              onShowToast={setToast} 
            />
          )}

          {activeTab === 'needed' && (
            <Needed 
              settings={settings} 
              onShowToast={setToast} 
            />
          )}

          {activeTab === 'timetable' && (
            <TimeTable onShowToast={setToast} />
          )}

          {activeTab === 'menu' && (
            <Menu onShowToast={setToast} />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard 
              settings={settings} 
              onRefreshSettings={fetchSettings} 
              setActiveTab={handleTabChange} 
              onShowToast={setToast} 
            />
          )}
        </main>

        {/* Global Footer */}
        <Footer 
          setActiveTab={handleTabChange} 
          settings={settings} 
        />

        {/* Modals & Feedback */}
        <RestrictionModal
          isOpen={restrictionModalOpen}
          settings={settings}
          onAccept={handleAcceptRestriction}
          onCancel={() => setRestrictionModalOpen(false)}
        />

        <AdminLoginModal 
          onShowToast={setToast} 
          onLoginSuccess={() => setActiveTab('admin')} 
        />

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </AdminAuthProvider>
  );
}
