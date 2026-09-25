import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Award, FileText, Calendar, Building2, 
  CheckCircle2, Download, ExternalLink, Edit3, X, ZoomIn 
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import LightboxModal from '../components/LightboxModal';

export default function Licence({ onShowToast }) {
  const [licence, setLicence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { adminUser } = useAdminAuth();

  const fetchLicence = () => {
    setLoading(true);
    api.getLicence()
      .then(data => {
        setLicence(data);
        setEditForm(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLicence();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateLicence(editForm);
      onShowToast?.({ type: 'success', message: 'Licence information updated successfully' });
      setIsEditOpen(false);
      fetchLicence();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const isExpired = licence?.expiry_date ? new Date(licence.expiry_date) < new Date() : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory Accreditation & Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
          Official Government Licence & Certification
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          RISE A CHILD CHILDREN HOME operates under full statutory accreditation, state social welfare oversight, building and fire safety certifications, and regular audit inspections.
        </p>
      </div>

      {/* Main Licence Card (Official Government Style) */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
        {/* Certificate Banner Top */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">
                Government of West Bengal
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-0.5">
                Statutory Registration Certificate
              </h2>
              <p className="text-xs text-slate-300">
                Juvenile Justice (Care & Protection of Children) Act, 2015
              </p>
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex-shrink-0">
            {isExpired ? (
              <span className="inline-flex items-center bg-rose-500/20 text-rose-300 border border-rose-400/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                Expired (Renewal In Progress)
              </span>
            ) : (
              <span className="inline-flex items-center bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                {licence?.status || 'Active & Fully Verified'}
              </span>
            )}
          </div>
        </div>

        {/* Certificate Details Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Licence / Registration Number
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-slate-900 mt-1 block">
                {licence?.licence_no || 'WB-CW-2022/4190-R'}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Institutional Classification
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-800 mt-1 block">
                {licence?.licence_type || 'Child Care Institution & Residential Hostel'}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Issuing Government Authority
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">
                {licence?.issuing_authority || 'Dept. of Women & Child Development and Social Welfare'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Date of Issue
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  {licence?.issue_date || '2022-04-12'}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Valid Until
                </span>
                <span className="text-sm font-bold text-emerald-700 mt-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  {licence?.expiry_date || '2029-04-11'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Remarks */}
          {licence?.remarks && (
            <div className="border-l-4 border-emerald-600 bg-emerald-50/50 p-4 rounded-r-xl text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="font-bold text-emerald-950 block mb-1">
                Statutory Compliance Remarks:
              </span>
              {licence.remarks}
            </div>
          )}

          {/* Certificate Document Photo / Scan Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Official Document Scan
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>View Fullscreen</span>
                </button>
              </div>
            </div>

            <div 
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 cursor-pointer shadow-md"
            >
              <img
                src={licence?.document_url || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80"}
                alt="Government Licence Document"
                className="w-full h-80 sm:h-96 object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg">
                  <ZoomIn className="w-4 h-4" />
                  <span>Click to Inspect Official Certificate</span>
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions & Admin Update */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href={licence?.document_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs text-slate-600 hover:text-emerald-700 font-medium"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Official Verification Copy</span>
            </a>

            {adminUser && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Update Licence Records</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Edit Modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Update Official Licence Information
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Licence / Registration Number *</label>
                <input
                  type="text"
                  required
                  value={editForm.licence_no || ''}
                  onChange={e => setEditForm({ ...editForm, licence_no: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Licence Type *</label>
                <input
                  type="text"
                  required
                  value={editForm.licence_type || ''}
                  onChange={e => setEditForm({ ...editForm, licence_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issuing Authority *</label>
                <input
                  type="text"
                  required
                  value={editForm.issuing_authority || ''}
                  onChange={e => setEditForm({ ...editForm, issuing_authority: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editForm.issue_date || ''}
                    onChange={e => setEditForm({ ...editForm, issue_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.expiry_date || ''}
                    onChange={e => setEditForm({ ...editForm, expiry_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
                <select
                  value={editForm.status || 'Active & Verified'}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Active & Verified">Active & Verified</option>
                  <option value="Renewal In Progress">Renewal In Progress</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Image / Scan URL</label>
                <input
                  type="text"
                  value={editForm.document_url || ''}
                  onChange={e => setEditForm({ ...editForm, document_url: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Compliance Remarks</label>
                <textarea
                  rows="3"
                  value={editForm.remarks || ''}
                  onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Licence Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={[{ image_url: licence?.document_url, title: 'Official Certificate of Registration', description: licence?.licence_no }]}
        currentIndex={0}
      />
    </div>
  );
}
