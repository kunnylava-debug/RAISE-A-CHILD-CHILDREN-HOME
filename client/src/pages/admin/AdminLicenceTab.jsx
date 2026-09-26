import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Award, Calendar, Building2, CheckCircle2, 
  Upload, Save, Trash2, ExternalLink, ZoomIn, AlertCircle, FileText, X
} from 'lucide-react';
import { api } from '../../services/api';
import LightboxModal from '../../components/LightboxModal';

export default function AdminLicenceTab({ onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [form, setForm] = useState({
    licence_no: '',
    licence_type: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    status: 'Active & Fully Verified',
    document_url: '',
    remarks: ''
  });

  const fetchLicence = async () => {
    setLoading(true);
    try {
      const data = await api.getLicence();
      if (data && data.licence_no) {
        setForm({
          licence_no: data.licence_no || '',
          licence_type: data.licence_type || '',
          issuing_authority: data.issuing_authority || '',
          issue_date: data.issue_date || '',
          expiry_date: data.expiry_date || '',
          status: data.status || 'Active & Fully Verified',
          document_url: data.document_url || '',
          remarks: data.remarks || ''
        });
      } else {
        // Empty state - waiting for user's own licence input
        setForm({
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
    } catch (err) {
      console.error('Error fetching licence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicence();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      onShowToast?.({ type: 'error', message: 'File is too large. Maximum allowed size is 10MB.' });
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await api.uploadFile(file);
      handleChange('document_url', res.url);
      onShowToast?.({ 
        type: 'success', 
        title: 'Certificate Uploaded', 
        message: 'Official certificate image uploaded successfully.' 
      });
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Failed to upload certificate: ' + err.message });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!form.licence_no.trim()) {
      onShowToast?.({ type: 'error', message: 'Please provide the Licence / Registration Number.' });
      return;
    }

    setSaving(true);
    try {
      await api.updateLicence(form);
      onShowToast?.({ 
        type: 'success', 
        title: 'Licence Details Saved', 
        message: 'Official government licence records updated and published.' 
      });
      fetchLicence();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to save licence details' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear the licence information? This will reset all licence fields.'
    );
    if (!confirmClear) return;

    setSaving(true);
    try {
      if (api.deleteLicence) {
        await api.deleteLicence();
      } else {
        await api.updateLicence({
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
      setForm({
        licence_no: '',
        licence_type: '',
        issuing_authority: '',
        issue_date: '',
        expiry_date: '',
        status: 'Active & Fully Verified',
        document_url: '',
        remarks: ''
      });
      onShowToast?.({ 
        type: 'success', 
        title: 'Licence Cleared', 
        message: 'Licence records have been cleared.' 
      });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Failed to clear licence' });
    } finally {
      setSaving(false);
    }
  };

  const hasConfiguredLicence = Boolean(form.licence_no && form.licence_no.trim());

  return (
    <div className="space-y-8">
      {/* Tab Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Government & Legal Compliance
                </span>
                {hasConfiguredLicence ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />
                    <span>Configured</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Not Configured Yet
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-1">
                Official Licence & Certificate Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your official government registration number, department details, issue/expiry dates, and certificate photo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {hasConfiguredLicence && (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="px-3.5 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Licence</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Licence Details'}</span>
            </button>
          </div>
        </div>

        {/* Current State Info Banner */}
        <div className="mt-5">
          {hasConfiguredLicence ? (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-emerald-950">
                  Official Licence Configured & Active
                </span>
                <p className="text-emerald-800 text-xs mt-0.5">
                  Registration Number: <strong className="font-mono text-emerald-950">{form.licence_no}</strong> | 
                  Authority: <span className="font-semibold">{form.issuing_authority || 'Govt. Dept'}</span> | 
                  Status: <span className="font-semibold">{form.status}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-amber-950">
                  No Official Licence Configured Yet
                </span>
                <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                  All predefined dummy licence data has been removed. Fill in your official hostel registration details below and click <strong>"Save Licence Details"</strong> to publish your government certification to the public website.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Licence Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-xs sm:text-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 mr-2 text-emerald-600" />
          <span>Statutory Registration Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Licence / Registration Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Licence / Registration Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. JJ-ACT-2015-CERT-AP-2024-889 or 4190/CW/2024"
              value={form.licence_no}
              onChange={e => handleChange('licence_no', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Official registration code or certification number issued by the department.
            </span>
          </div>

          {/* Institutional Classification / Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Institutional Classification / Category
            </label>
            <input
              type="text"
              placeholder="e.g. Statutory Child Care Institution & Residential Children Home under JJ Act"
              value={form.licence_type}
              onChange={e => handleChange('licence_type', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Classification of institution according to social welfare rules.
            </span>
          </div>

          {/* Issuing Government Authority */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1.5">
              Issuing Government Authority / Department
            </label>
            <input
              type="text"
              placeholder="e.g. Department of Women Development & Child Welfare, Government of Andhra Pradesh"
              value={form.issuing_authority}
              onChange={e => handleChange('issuing_authority', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              The government department, ministry, or regulatory body that granted the licence.
            </span>
          </div>

          {/* Date of Issue */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Date of Issue</span>
            </label>
            <input
              type="date"
              value={form.issue_date}
              onChange={e => handleChange('issue_date', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Valid Until / Expiry Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Valid Until / Expiry Date</span>
            </label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={e => handleChange('expiry_date', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Current Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Licence Verification Status
            </label>
            <select
              value={form.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="Active & Fully Verified">Active & Fully Verified</option>
              <option value="Statutory Registration Active">Statutory Registration Active</option>
              <option value="Renewal In Progress">Renewal In Progress</option>
              <option value="Under Official Verification">Under Official Verification</option>
              <option value="Pending Annual Inspection">Pending Annual Inspection</option>
            </select>
          </div>

          {/* Remarks / Legal Compliance Notes */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1.5">
              Statutory Compliance Remarks & Inspection Notes
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Premises inspected for child safety, sanitation, building security, fire compliance, and annual audit certification."
              value={form.remarks}
              onChange={e => handleChange('remarks', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Optional notes regarding inspection clearance, safety norms, or audit compliance.
            </span>
          </div>
        </div>

        {/* Certificate Scan / Document Photo Upload */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Award className="w-4 h-4 mr-2 text-emerald-600" />
                <span>Certificate Document / Scan Photo</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a photo or scanned copy of your official registration certificate.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingDoc ? 'Uploading...' : 'Upload Certificate Photo / File'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={uploadingDoc}
                  onChange={handleFileUpload}
                />
              </label>
              {form.document_url && (
                <button
                  type="button"
                  onClick={() => handleChange('document_url', '')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Certificate Document URL / Path
            </label>
            <input
              type="text"
              placeholder="Paste image URL or upload above"
              value={form.document_url}
              onChange={e => handleChange('document_url', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Certificate Image Preview */}
          {form.document_url ? (
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Uploaded Document Preview
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>View Full Size</span>
                </button>
              </div>

              <div 
                onClick={() => setLightboxOpen(true)}
                className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white max-h-72 cursor-pointer shadow-sm flex items-center justify-center"
              >
                <img
                  src={form.document_url}
                  alt="Official Certificate Preview"
                  className="max-h-72 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/95 text-slate-900 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Click to Enlarge</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 bg-slate-50/50">
              <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">No certificate document uploaded yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Upload Certificate Photo / File" above to attach an image scan of your official document.</p>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Saving here immediately updates the public <strong>Licence & Certification</strong> page.
          </p>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {hasConfiguredLicence && (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                Clear Licence
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Licence Details'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Lightbox for Document */}
      {form.document_url && (
        <LightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          photos={[{
            image_url: form.document_url,
            title: 'Official Registration Certificate',
            description: form.licence_no ? `Licence No: ${form.licence_no}` : ''
          }]}
          currentIndex={0}
        />
      )}
    </div>
  );
}
