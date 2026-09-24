import React from 'react';
import { 
  MapPin, Phone, Mail, ExternalLink, Navigation, Compass, ShieldCheck 
} from 'lucide-react';

export default function Footer({ setActiveTab, settings }) {
  const googleMapsUrl = "https://goo.gl/maps/rVLiCyNsMd157RUC8";
  const address = settings?.contact_address || 'Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121';
  const phone = settings?.contact_phone || '+91 90594 91777';
  const email = settings?.contact_email || 'pn9059491777@gmail.com';
  const hostelName = settings?.hostel_name || "RAISE A CHILD CHILDREN HOME";
  const founderName = settings?.founder_name || "BRO .NELSON";

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 py-6 sm:py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Row 1: Brand & Contact Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800/60">
          {/* Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              RC
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide block">
                {hostelName}
              </span>
              <span className="text-[11px] text-amber-400 font-medium">
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

        {/* Row 2: Address Followed By Campus Location Google Maps Link */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-start sm:items-center space-x-2 text-slate-300 leading-relaxed">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
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

        {/* Row 3: Minimal Inline Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-400">
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
              className="hover:text-amber-300 text-amber-400/90 font-medium transition"
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
              onClick={() => { setActiveTab('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-slate-300 text-slate-500 transition"
            >
              Admin
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
