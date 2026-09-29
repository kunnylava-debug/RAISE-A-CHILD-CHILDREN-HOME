import React from 'react';
import { 
  Home, Search, ArrowLeft, Phone, Mail, 
  HelpCircle, Compass, ShieldCheck, Heart 
} from 'lucide-react';

export default function NotFound({ setActiveTab, settings }) {
  const phone = settings?.contact_phone || '+91 90594 91777';
  const email = settings?.contact_email || 'pn9059491777@gmail.com';
  const hostelName = settings?.hostel_name || 'RISE A CHILD CHILDREN HOME';

  const quickLinks = [
    { id: 'home', label: 'Home Page', desc: 'Main welcome overview & mission' },
    { id: 'children', label: 'Children Directory', desc: 'Student roster & transparent records' },
    { id: 'needed', label: 'Hostel Needs & Donate', desc: 'Direct giving & sponsorship pledges' },
    { id: 'admissions', label: 'Admissions & Tracking', desc: 'Apply or check application status' },
    { id: 'staff', label: 'Staff & Guardians', desc: 'Resident mentors and caregivers' },
    { id: 'licence', label: 'Govt. Licence & JJ Act', desc: 'Statutory government compliance' },
    { id: 'views', label: 'Campus Views', desc: 'Dormitories, dining & facility photos' },
    { id: 'timetable', label: 'Daily Routine', desc: 'Study, prayer and activity timetable' }
  ];

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* Error Badge */}
        <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
          <HelpCircle className="w-4 h-4 text-rose-600" />
          <span>Error 404 — Page Not Found</span>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold font-serif text-slate-900 tracking-tight">
            Page Not Located
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            The link you followed may be misspelled, archived, or temporarily unavailable. 
            All official records and portal sections of <strong className="text-slate-800">{hostelName}</strong> are safe and accessible below.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md transition active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Safe Home Page</span>
          </button>
          
          <button
            onClick={() => setActiveTab('needed')}
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-2xl text-sm border border-slate-200 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Support & Urgent Needs</span>
          </button>
        </div>

        {/* Quick Directory Grid */}
        <div className="pt-6 border-t border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-center space-x-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Direct Navigation Directory</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            {quickLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="p-3 bg-white hover:bg-emerald-50/50 rounded-xl border border-slate-200 hover:border-emerald-300 transition text-left group shadow-2xs cursor-pointer"
              >
                <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Assistance Footer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl mx-auto">
          <div className="flex items-center space-x-2 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Need direct help or inquiry? Speak with our founder directly:</span>
          </div>
          <div className="flex items-center space-x-3 font-bold text-emerald-800">
            <a href={`tel:${phone}`} className="hover:underline flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5" />
              <span>{phone}</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
