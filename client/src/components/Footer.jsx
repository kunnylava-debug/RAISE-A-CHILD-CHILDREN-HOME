import React from 'react';
import { 
  MapPin, Phone, Mail, ExternalLink, Navigation, Compass 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Footer({ setActiveTab, settings }) {
  const { adminUser, setLoginModalOpen } = useAdminAuth();
  const googleMapsUrl = "https://goo.gl/maps/rVLiCyNsMd157RUC8";
  const address = settings?.contact_address || 'Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121';
  const phone = settings?.contact_phone || '+91 90594 91777';
  const email = settings?.contact_email || 'pn9059491777@gmail.com';
  const hostelName = settings?.hostel_name || "RISE A CHILD CHILDREN HOME";
  const founderName = settings?.founder_name || "BRO.NELSON A";

  const facebookUrl = settings?.social_facebook || "https://facebook.com/riseachild";
  const instagramUrl = settings?.social_instagram || "https://instagram.com/riseachild";
  const youtubeUrl = settings?.social_youtube || "https://youtube.com/@riseachild";

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 py-6 sm:py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Row 1: Brand & Contact Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800/60">
          {/* Official Identity & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img 
                src={settings?.logo_url || "/logo.png"} 
                alt={hostelName} 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide block">
                {hostelName}
              </span>
              <span className="text-[11px] text-blue-300 font-semibold block">
                Founder: {founderName}
              </span>
            </div>
          </div>

          {/* Quick Contact Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a 
              href={`tel:${phone}`}
              className="inline-flex items-center space-x-1.5 text-slate-300 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{phone}</span>
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <a 
              href={`mailto:${email}`}
              className="inline-flex items-center space-x-1.5 text-slate-300 hover:text-white transition"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{email}</span>
            </a>
          </div>
        </div>

        {/* Row 2: Follow Us on Social Media (Clean Public Links - Management in Admin Dashboard) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 bg-slate-900/90 rounded-xl border border-slate-800/90 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-200">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Follow Us:</span>
            <span className="text-[11px] text-slate-300">Stay connected with our hostel life, celebrations & activities</span>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-[#1877F2]/20 hover:bg-[#1877F2] text-blue-300 hover:text-white border border-[#1877F2]/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Follow us on Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Facebook</span>
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-[#E4405F]/20 hover:bg-[#E4405F] text-pink-300 hover:text-white border border-[#E4405F]/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Follow us on Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>Instagram</span>
            </a>

            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-[#FF0000]/20 hover:bg-[#FF0000] text-red-300 hover:text-white border border-[#FF0000]/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title="Subscribe on YouTube"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>YouTube</span>
            </a>
          </div>
        </div>

        {/* Row 3: Address Followed By Campus Location Google Maps Link */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-start sm:items-center space-x-2 text-slate-300 leading-relaxed">
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-white">Address:</strong> {address}
            </span>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 self-start sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Our Campus Location (Google Maps)</span>
            <ExternalLink className="w-3 h-3 opacity-75" />
          </a>
        </div>

        {/* Minimal Inline Navigation & Copyright */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button 
              onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Home
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('staff'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Staff
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('licence'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Licence
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('children'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Children
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('views'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Views
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('timetable'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Daily Routine
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Food Menu
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('needed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-emerald-300 text-emerald-400 font-medium transition"
            >
              Support / Needs
            </button>
            <span>•</span>
            <button 
              onClick={() => { setActiveTab('admissions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-white transition"
            >
              Admissions
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => { 
                if (adminUser) {
                  setActiveTab('admin');
                } else {
                  setLoginModalOpen(true);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
              className="hover:text-slate-300 text-slate-500 transition cursor-pointer"
              title="Administrator Sign-in"
            >
              Admin{adminUser ? ` (${adminUser.username})` : ''}
            </button>
          </div>

          <p className="text-slate-500">
            © {new Date().getFullYear()} {hostelName}. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
