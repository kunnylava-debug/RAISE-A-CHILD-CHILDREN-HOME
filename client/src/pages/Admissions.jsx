import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, AlertCircle, Send, Check, 
  X, Info, Phone, Mail, User, MapPin, Sparkles, 
  HelpCircle, ShieldCheck, Download, Printer, Clock, 
  Search, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';

export default function Admissions({ settings, onShowToast }) {
  const [activeSubTab, setActiveSubTab] = useState('apply');
  const [trackAppNo, setTrackAppNo] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);

  const [formData, setFormData] = useState({
    child_name: '',
    age: '',
    dob: '',
    class_applying: 'Class 1',
    gender: 'Male',
    address: '',
    guardian_name: '',
    phone: '',
    email: '',
    photo_url: '',
    reason: '',
    hear_about: 'Panchayat / Community Leader',
    previous_school: ''
  });

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackAppNo.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await api.trackAdmission(trackAppNo.trim(), trackPhone.trim());
      setTrackResult(res.application);
    } catch (err) {
      setTrackError(err.message || 'No application found. Please verify the Application Reference Number.');
    } finally {
      setTrackLoading(false);
    }
  };

  // Retrieve editable dos & donts from settings
  const dos = settings?.instructions_dos || [
    'Follow hostel rules diligently and adhere to daily timing.',
    'Maintain personal hygiene, room cleanliness, and tidy study desks.',
    'Respect staff members, teachers, caretakers, and fellow children.',
    'Follow the daily schedule and attend morning yoga and evening prayers.',
    'Attend educational activities, school, and remedial tutoring attentively.',
    'Report any illness, injury, or concern immediately to the hostel warden.'
  ];

  const donts = settings?.instructions_donts || [
    'Do not damage or deface hostel property, furniture, or library books.',
    'Do not disturb other children during study or sleeping hours.',
    'Do not violate hostel rules or leave the campus without authorization.',
    'Do not bring prohibited items, unapproved electronics, or outside junk food.',
    'Do not engage in fighting, bullying, or disrespectful language.',
    'Do not store unauthorized valuables or cash in dormitories.'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rulesAccepted) {
      alert('Please check the box confirming you have read and agreed to the Hostel Rules & Do’s and Don’ts.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.submitAdmission(formData);
      setSubmittedData(response);
      onShowToast?.({
        type: 'success',
        title: 'Application Submitted',
        message: `Reference: ${response.application_number}. Notified hostel admissions desk.`
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Please verify form fields.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Heading */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Academic Session 2026 - 2027</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
          Hostel Admissions & Student Enrollment
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          We welcome applications for students and youths of all age groups and educational stages — Primary, Secondary, Higher Secondary (11th & 12th), College / University, and Vocational Training.
        </p>
      </div>

      {/* SubTab Switcher: Apply vs Track Status */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex space-x-2 border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveSubTab('apply')}
            className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 ${
              activeSubTab === 'apply'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>New Admission Application</span>
          </button>
          <button
            onClick={() => setActiveSubTab('track')}
            className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 ${
              activeSubTab === 'track'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Track Application Status</span>
          </button>
        </div>
      </div>

      {/* TRACK STATUS VIEW */}
      {activeSubTab === 'track' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900">Check Admission Status Online</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter the Application Reference Number provided when you registered (e.g. ADM-2026-0001) to view real-time decisions, administrative remarks, and next steps.
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 text-xs sm:text-sm mb-1">
                    Application Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM-2026-0001"
                    value={trackAppNo}
                    onChange={e => setTrackAppNo(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs sm:text-sm mb-1">
                    Registered Mobile Number (Optional Verification)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9059491777"
                    value={trackPhone}
                    onChange={e => setTrackPhone(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {trackError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={trackLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {trackLoading ? (
                  <span>Checking Live Records...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Check Application Status</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Track Result Card */}
          {trackResult && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">Application #{trackResult.app_no}</span>
                  <h3 className="text-xl font-bold font-serif text-slate-900">{trackResult.child_name}</h3>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  trackResult.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                  trackResult.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  trackResult.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {trackResult.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 p-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-xs">Class Applied:</span>
                  <span className="font-bold text-slate-800">{trackResult.class_applying}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Guardian Name:</span>
                  <span className="font-bold text-slate-800">{trackResult.guardian_name}</span>
                </div>
              </div>

              {/* Status explanation */}
              <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                trackResult.status === 'Accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                trackResult.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                trackResult.status === 'Under Review' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {trackResult.status === 'Accepted' ? (
                  <div>
                    <h4 className="font-bold text-base flex items-center space-x-1.5 mb-1.5 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Congratulations! Admission Approved & Accepted</span>
                    </h4>
                    <p>
                      Your child has been officially selected for enrollment and residence at RISE A CHILD CHILDREN HOME.
                      Please report with original certificates (Birth Certificate, Aadhar Card, Transfer Certificate/Marks Sheet) and 3 photographs.
                    </p>
                  </div>
                ) : trackResult.status === 'Rejected' ? (
                  <div>
                    <h4 className="font-bold text-sm mb-1 text-rose-800">Application Decision Notice</h4>
                    <p>
                      Thank you for applying. Due to our current residential bed capacity limitations, we are unable to accept this application at this time. We wish the applicant the very best in their educational journey.
                    </p>
                  </div>
                ) : trackResult.status === 'Under Review' ? (
                  <div>
                    <h4 className="font-bold text-sm mb-1 text-blue-800">Application Under Active Review</h4>
                    <p>
                      Our admissions committee is actively evaluating your submission. Our hostel warden or representative may contact you on your registered phone number for document verification.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-bold text-sm mb-1 text-amber-800">Application Received & Pending Review</h4>
                    <p>
                      Your application has been received and is queued for verification by the hostel superintendent.
                    </p>
                  </div>
                )}

                {trackResult.admin_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <span className="font-bold block text-xs">Official Remarks from Administration:</span>
                    <p className="italic mt-0.5">"{trackResult.admin_notes}"</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href={`tel:${settings?.contact_phone || '+919059491777'}`}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>Call Admissions Helpdesk</span>
                </a>

                {trackResult.status === 'Accepted' && (
                  <button
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Confirmation Letter</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPLY VIEW */}
      {activeSubTab === 'apply' && (
        <>
      {submittedData ? (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border-2 border-emerald-200 shadow-2xl p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Application Successfully Registered
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              Thank You, {formData.child_name}'s Guardian!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Your application has been logged into the hostel administrative portal and automatically dispatched to our configured admissions office.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Application Reference No:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {submittedData.application_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Child's Name:</span>
              <span className="font-bold text-slate-800">{formData.child_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Class Applied For:</span>
              <span className="font-semibold text-slate-800">{formData.class_applying}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Dispatched Notification To:</span>
              <span className="text-slate-700 font-mono text-[11px] truncate">
                {submittedData.email_notification_sent_to}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Acknowledgment Slip</span>
            </button>

            <button
              onClick={() => {
                setSubmittedData(null);
                setFormData({
                  child_name: '',
                  age: '',
                  dob: '',
                  class_applying: 'Class 1',
                  gender: 'Male',
                  address: '',
                  guardian_name: '',
                  phone: '',
                  email: '',
                  photo_url: '',
                  reason: '',
                  hear_about: 'Panchayat / Community Leader',
                  previous_school: ''
                });
                setRulesAccepted(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Online Admission Form (approx 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                Online Admission Application
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Please provide accurate details of the child and guardian. All fields marked with * are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Child Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Child Information
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Child's Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.child_name}
                    onChange={e => setFormData({ ...formData, child_name: e.target.value })}
                    placeholder="Enter child's full name"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                    <input
                      type="number"
                      min="4"
                      max="35"
                      required
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 14"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="Male">Boy / Male</option>
                      <option value="Female">Girl / Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Standard / Course Applying For *</label>
                    <select
                      value={formData.class_applying}
                      onChange={e => setFormData({ ...formData, class_applying: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <optgroup label="Primary School (Classes 1 - 5)">
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                      </optgroup>
                      <optgroup label="Secondary School (Classes 6 - 10)">
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10 (Secondary / Madhyamik)</option>
                      </optgroup>
                      <optgroup label="Higher Secondary (11th & 12th)">
                        <option value="Class 11 - Science">Class 11 (Science)</option>
                        <option value="Class 11 - Arts/Humanities">Class 11 (Arts / Humanities)</option>
                        <option value="Class 11 - Commerce">Class 11 (Commerce)</option>
                        <option value="Class 12 - Science">Class 12 (Science)</option>
                        <option value="Class 12 - Arts/Humanities">Class 12 (Arts / Humanities)</option>
                        <option value="Class 12 - Commerce">Class 12 (Commerce)</option>
                      </optgroup>
                      <optgroup label="College & Higher Education">
                        <option value="Undergraduate Degree (BA / BSc / BCom)">Undergraduate (BA / BSc / BCom / BTech)</option>
                        <option value="Postgraduate Degree (MA / MSc / MCom)">Postgraduate Degree (MA / MSc / MCom)</option>
                        <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                      </optgroup>
                      <optgroup label="Vocational & Skill Training">
                        <option value="Vocational ITI / Technical Training">Vocational ITI / Technical Skills</option>
                        <option value="Computer Software & Hardware Diploma">Computer Software & Hardware Certification</option>
                        <option value="Other Educational Stage">Other / Adult Literacy & Vocational</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Previous School Attended</label>
                    <input
                      type="text"
                      value={formData.previous_school}
                      onChange={e => setFormData({ ...formData, previous_school: e.target.value })}
                      placeholder="e.g. Village Primary School"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Child's Photograph URL</label>
                  <input
                    type="text"
                    value={formData.photo_url}
                    onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                    placeholder="https://... (or leave blank to submit photograph at hostel office)"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Guardian Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Parent / Guardian Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.guardian_name}
                      onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Guardian name & relationship"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="guardian@gmail.com"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Permanent Residential Address *</label>
                  <textarea
                    rows="2"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Village/Town, Post Office, Police Station, District, State, PIN"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Justification & Referral */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Admission Purpose
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Joining the Hostel *</label>
                  <textarea
                    rows="3"
                    required
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Describe family background, financial or social hardship, and why the child needs residential accommodation..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">How did you hear about us?</label>
                  <select
                    value={formData.hear_about}
                    onChange={e => setFormData({ ...formData, hear_about: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Panchayat / Community Leader">Panchayat / Community Leader</option>
                    <option value="Person who left from home">Person who left from home</option>
                    <option value="Social Welfare Dept">Social Welfare Dept</option>
                    <option value="Word of Mouth">Word of Mouth / Relative</option>
                    <option value="Internet / Website">Internet / Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Rules acceptance checkbox */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-start space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={rulesAccepted}
                    onChange={e => setRulesAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I confirm that I have read the hostel rules, Do's and Don'ts, and agree to abide by all disciplinary and safety standards of RISE A CHILD CHILDREN HOME.
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Registering Application...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Official Admission Form</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Instructions / Rules (Do's & Don'ts) (approx 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rules Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Campus Regulations</span>
                </div>
                <h2 className="text-xl font-bold font-serif text-slate-900">
                  Instructions / Do's & Don'ts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hostel code of conduct ensuring safety, harmony, and academic excellence.
                </p>
              </div>

              {/* Do's Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  <span>Do's (Expected Conduct)</span>
                </h3>
                <ul className="space-y-2">
                  {dos.map((item, idx) => (
                    <li key={idx} className="flex items-start text-xs sm:text-sm text-slate-700 space-x-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don'ts Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600" />
                  <span>Don'ts (Strictly Prohibited)</span>
                </h3>
                <ul className="space-y-2">
                  {donts.map((item, idx) => (
                    <li key={idx} className="flex items-start text-xs sm:text-sm text-slate-700 space-x-2">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ✕
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visiting Hours Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block">Parent Visitation Policy:</span>
                <p>
                  Parents/Guardians may visit students on the 2nd and 4th Sunday of each month between 10:00 AM and 04:00 PM with mandatory registration at the security gate.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
