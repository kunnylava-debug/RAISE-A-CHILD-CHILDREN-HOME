import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Award, FileText, Calendar, Building2, 
  CheckCircle2, Download, ExternalLink, Edit3, X, ZoomIn, 
  AlertCircle, ArrowRight, Lock, Upload
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import LightboxModal from '../components/LightboxModal';

export default function Licence({ onShowToast, setActiveTab }) {
  const [licence, setLicence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { adminUser } = useAdminAuth();

  const fetchLicence = () => {
    setLoading(true);
    api.getLicence()
      .then(data => {
        if (data && data.licence_no && data.licence_no.trim()) {
          setLicence(data);
          setEditForm(data);
        } else {
          setLicence(null);
          setEditForm({
            licence_no: '',
            licence_type: '',
            issuing_authority: '',
            issue_date: '',
            expiry_date: '',
            status: 'Active & Fully Verified',
            document_url: '',
            remarks: ''
          });
        }
      })
      .catch(err => {
        console.error('Error fetching licence:', err);
        setLicence(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLicence();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.licence_no.trim()) {
      onShowToast?.({ type: 'error', message: 'Licence / Registration Number is required' });
      return;
    }
    try {
      await api.updateLicence(editForm);
      onShowToast?.({ type: 'success', message: 'Licence information updated successfully' });
      setIsEditOpen(false);
      fetchLicence();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to update licence' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onShowToast?.({ type: 'error', message: 'File is too large. Maximum size is 10MB.' });
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await api.uploadFile(file);
      setEditForm(prev => ({ ...prev, document_url: res.url }));
      onShowToast?.({ type: 'success', message: 'Certificate scan uploaded successfully!' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Upload failed: ' + err.message });
    } finally {
      setUploadingDoc(false);
    }
  };

  const isConfigured = Boolean(licence && licence.licence_no && licence.licence_no.trim());
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

      {loading ? (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading verification records...</p>
        </div>
      ) : isConfigured ? (
        /* Configured Official Licence Card */
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
          {/* Certificate Banner Top */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-300 font-semibold block">
                  {licence.issuing_authority || 'Official Government Certification'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-0.5">
                  Statutory Registration Certificate
                </h2>
                <p className="text-xs text-slate-300">
                  {licence.licence_type || 'Statutory Child Care & Protection Accreditation'}
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
                  {licence.status || 'Active & Fully Verified'}
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
                  {licence.licence_no}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Institutional Classification
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-800 mt-1 block">
                  {licence.licence_type || 'Child Care Institution & Residential Children Home'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Issuing Government Authority
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {licence.issuing_authority || 'Department of Women & Child Development'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Date of Issue
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    {licence.issue_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Valid Until
                  </span>
                  <span className="text-sm font-bold text-emerald-700 mt-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    {licence.expiry_date || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Remarks */}
            {licence.remarks && (
              <div className="border-l-4 border-emerald-600 bg-emerald-50/50 p-4 rounded-r-xl text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-bold text-emerald-950 block mb-1">
                  Statutory Compliance Remarks:
                </span>
                {licence.remarks}
              </div>
            )}

            {/* Certificate Document Photo / Scan Preview */}
            {licence.document_url && (
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
                    src={licence.document_url}
                    alt="Government Licence Document"
                    className="w-full h-80 sm:h-96 object-contain bg-slate-900/5 group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg">
                      <ZoomIn className="w-4 h-4" />
                      <span>Click to Inspect Official Certificate</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions & Admin Update */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {licence.document_url ? (
                <a
                  href={licence.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 text-xs text-slate-600 hover:text-emerald-700 font-medium"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Official Verification Copy</span>
                </a>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Official verification copy on file with administration.
                </span>
              )}

              {adminUser && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (setActiveTab) {
                        setActiveTab('admin');
                      } else {
                        setIsEditOpen(true);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Licence (Admin Console)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Clean Unconfigured State: Ready for User's Real Documents */
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Official Verification Status</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              Government Licence & Accreditation Records
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Official institutional registration number, certification certificates, and statutory audit documentation are being updated and verified by the administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Registration Code</span>
              <span className="text-sm font-semibold text-slate-700 mt-1 block">Awaiting Upload</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Statutory Status</span>
              <span className="text-sm font-semibold text-emerald-700 mt-1 block flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Compliant Institution</span>
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Inspection Copy</span>
              <span className="text-sm font-semibold text-slate-700 mt-1 block">On Admin File</span>
            </div>
          </div>

          {/* Action for Admin */}
          {adminUser && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab('admin');
                  } else {
                    setIsEditOpen(true);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-emerald-200 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Provide Official Licence in Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Quick Edit Modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Update Official Licence Information
                </h3>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Licence / Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234/AP/2024"
                  value={editForm.licence_no || ''}
                  onChange={e => setEditForm({ ...editForm, licence_no: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Classification / Type</label>
                <input
                  type="text"
                  placeholder="e.g. Child Care Institution & Residential Children Home"
                  value={editForm.licence_type || ''}
                  onChange={e => setEditForm({ ...editForm, licence_type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issuing Authority / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Department of Women Development & Child Welfare"
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
                  value={editForm.status || 'Active & Fully Verified'}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Active & Fully Verified">Active & Fully Verified</option>
                  <option value="Statutory Registration Active">Statutory Registration Active</option>
                  <option value="Renewal In Progress">Renewal In Progress</option>
                  <option value="Under Official Verification">Under Official Verification</option>
                </select>
              </div>

              {/* Certificate Upload in Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">Document Image / Scan Photo</label>
                  <label className="cursor-pointer text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={uploadingDoc}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Paste URL or upload above"
                  value={editForm.document_url || ''}
                  onChange={e => setEditForm({ ...editForm, document_url: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Compliance Remarks</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Verified for child protection, fire safety, and annual social audit."
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
      {licence?.document_url && (
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          photos={[{
            image_url: licence.document_url,
            title: 'Official Certificate of Registration',
            description: licence.licence_no ? `Licence No: ${licence.licence_no}` : ''
          }]}
          currentIndex={0}
        />
      )}
    </div>
  );
}
