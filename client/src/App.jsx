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

const SEO_CONFIG = {
  home: {
    title: "RISE A CHILD CHILDREN HOME | Loving Haven, Education & Care | Sullurpeta",
    description: "Official website of RISE A CHILD CHILDREN HOME, founded by BRO.NELSON A in Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh. Providing safe residential care, wholesome nutrition, and quality schooling for children and youths."
  },
  staff: {
    title: "Staff & Resident Guardians | RISE A CHILD CHILDREN HOME",
    description: "Meet the dedicated resident caregivers, wardens, tutors, and management of RISE A CHILD CHILDREN HOME providing round-the-clock child care and guidance."
  },
  licence: {
    title: "Government Registration & Statutory Licence (JJ Act) | RISE A CHILD CHILDREN HOME",
    description: "View statutory registration, JJ Act 2015 institutional certificate, government compliance, and safety inspection records of RISE A CHILD CHILDREN HOME."
  },
  children: {
    title: "Children Directory & Student Roster | RISE A CHILD CHILDREN HOME",
    description: "Transparent, privacy-protected directory of resident students and youths pursuing primary, secondary, and higher secondary education at RISE A CHILD CHILDREN HOME."
  },
  views: {
    title: "Campus Facilities, Dormitories & Infrastructure Views | RISE A CHILD CHILDREN HOME",
    description: "Explore photographic views of our dormitories, dining hall, sanitized washrooms, playground, study lab, and kitchen infrastructure in Mannar Polur, Sullurpeta."
  },
  admissions: {
    title: "Online Admission Application & Status Tracking | RISE A CHILD CHILDREN HOME",
    description: "Apply online for residential schooling admission at RISE A CHILD CHILDREN HOME or track your existing application number in real time."
  },
  needed: {
    title: "Support Us & Urgent Needs | Donate via UPI, GPay & PhonePe | RISE A CHILD CHILDREN HOME",
    description: "Support underprivileged students at RISE A CHILD CHILDREN HOME. Sponsor meals, educational supplies, uniforms, or donate directly via UPI QR, GPay, and PhonePe."
  },
  timetable: {
    title: "Daily Student Routine & Schedule | RISE A CHILD CHILDREN HOME",
    description: "Explore the structured daily timetable of prayers, yoga, schooling, study coaching, sports, and wholesome meals at RISE A CHILD CHILDREN HOME."
  },
  menu: {
    title: "Weekly Nutritious Food & Dining Menu | RISE A CHILD CHILDREN HOME",
    description: "Review the nutritious weekly diet plan served to resident children, including balanced breakfast, hot lunch, evening milk snacks, and wholesome dinner."
  },
  admin: {
    title: "Hostel Management Console | RISE A CHILD CHILDREN HOME",
    description: "Authorized administrator and staff operations portal for RISE A CHILD CHILDREN HOME."
  }
};

function updatePageSEO(tabId, hostelName) {
  const meta = SEO_CONFIG[tabId] || SEO_CONFIG.home;
  const pageTitle = meta.title.replace(/RISE A CHILD CHILDREN HOME/g, hostelName || 'RISE A CHILD CHILDREN HOME');
  document.title = pageTitle;

  const updateMeta = (selector, content) => {
    let el = document.querySelector(selector);
    if (el) {
      el.setAttribute('content', content);
    }
  };

  updateMeta('meta[name="description"]', meta.description);
  updateMeta('meta[property="og:title"]', pageTitle);
  updateMeta('meta[property="og:description"]', meta.description);
  updateMeta('meta[name="twitter:title"]', pageTitle);
  updateMeta('meta[name="twitter:description"]', meta.description);
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null);
  const [restrictionModalOpen, setRestrictionModalOpen] = useState(false);
  const [hasAcceptedRestriction, setHasAcceptedRestriction] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

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

    // Support direct hash deep-linking (e.g. #admissions, #needed, #timetable) for SEO
    const initialHash = window.location.hash.replace('#', '').toLowerCase();
    const validTabs = ['home', 'staff', 'licence', 'children', 'views', 'admissions', 'needed', 'timetable', 'menu', 'admin'];
    if (validTabs.includes(initialHash)) {
      setActiveTab(initialHash);
    }

    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Update document title and SEO meta tags when tab or settings change
  useEffect(() => {
    updatePageSEO(activeTab, settings?.hostel_name);
  }, [activeTab, settings]);

  const handleTabChange = (tabId) => {
    // Check if visiting admissions or children for the first time
    if (!hasAcceptedRestriction && (tabId === 'admissions' || tabId === 'children')) {
      setPendingTab(tabId);
      setRestrictionModalOpen(true);
      return;
    }
    setActiveTab(tabId);
    if (window.history && window.history.pushState) {
      const newUrl = tabId === 'home' 
        ? window.location.pathname + window.location.search 
        : `#${tabId}`;
      window.history.pushState(null, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptRestriction = () => {
    localStorage.setItem('shanti_restriction_accepted', 'true');
    setHasAcceptedRestriction(true);
    setRestrictionModalOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', `#${pendingTab}`);
      }
      setPendingTab(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
            <Licence onShowToast={setToast} setActiveTab={setActiveTab} />
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
