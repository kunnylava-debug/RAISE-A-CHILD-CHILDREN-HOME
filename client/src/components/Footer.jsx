import React from 'react';
import { 
  ShieldCheck, Heart, MapPin, Phone, Mail, 
  ExternalLink, Award, FileText, CheckCircle2 
} from 'lucide-react';

export default function Footer({ setActiveTab, settings }) {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Hostel Identity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                RC
              </div>
              <span className="text-xl font-bold font-serif text-white">
                {settings?.hostel_name || "RAISE A CHILD CHILDREN HOME"}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A recognized residential sanctuary providing complete educational support, safe housing, nutritious meals, and holistic guidance for over 120 deserving children.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                JJ Act 2015 Registered & State Audited
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('staff'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Hostel Staff & Wardens
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('licence'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Official Government Licence
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('children'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Children's Directory (120 Total)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('views'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Campus Views & Facilities
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('admissions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Online Admissions & Rules
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Routine & Support */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Hostel Life & Needs
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => { setActiveTab('timetable'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Daily Activity Schedule
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Nutritious Weekly Food Menu
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('needed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition"
                >
                  Current Resource Needs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('needed'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-400 transition text-emerald-400 font-semibold"
                >
                  Support with UPI / QR Code
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-slate-200 transition text-slate-400 text-xs"
                >
                  Administrative Control Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Location */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Hostel Campus Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  {settings?.contact_address || 'Mannaripoluru, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121'}
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href={`tel:${settings?.contact_phone || '+919830123456'}`} className="hover:text-emerald-300">
                  {settings?.contact_phone || '+91 98301 23456'}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href={`mailto:${settings?.contact_email || 'contact@raiseachildchildrenhome.org'}`} className="hover:text-emerald-300 truncate">
                  {settings?.contact_email || 'contact@raiseachildchildrenhome.org'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {settings?.hostel_name || "RAISE A CHILD CHILDREN HOME"}. All rights reserved. Registered Welfare Trust.
          </p>
          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <span>Child Privacy Shield Active</span>
            <span>•</span>
            <span>Zero Discrimination Campus</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Safe • Loving • Empowering</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
