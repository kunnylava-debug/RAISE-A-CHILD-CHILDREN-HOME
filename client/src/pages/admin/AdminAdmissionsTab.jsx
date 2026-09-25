import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, CheckCircle2, XCircle, Clock, Eye, 
  Trash2, X, Printer, User, MessageSquare, Mail, Send, 
  Phone, AlertCircle, Share2, Check, FileText, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAdmissionsTab({ onShowToast }) {
  const [admissions, setAdmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchAdmissions = () => {
    setLoading(true);
    api.getAdmissions({ status: statusFilter, search })
      .then(res => {
        setAdmissions(res.applications || []);
        setStats(res.stats || { total: 0, pending: 0, under_review: 0, accepted: 0, rejected: 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (id, status) => {
    try {
      setUpdating(true);
      const res = await api.updateAdmissionStatus(id, { status, admin_notes: statusNotes });
      
      const emailDispatched = res.notification_dispatch?.email_dispatched;
      const recipientEmail = res.notification_dispatch?.email;
      
      let message = `Application marked as ${status}.`;
      if (emailDispatched && recipientEmail) {
        message += ` Automated email letter sent to ${recipientEmail}!`;
      } else {
        message += ` Automated message generated. You can also send via WhatsApp below.`;
      }

      onShowToast?.({
        type: 'success',
        title: `Status: ${status}`,
        message
      });

      setSelectedApp(res);
      fetchAdmissions();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application record?')) return;
    try {
      await api.deleteAdmission(id);
      onShowToast?.({ type: 'success', message: 'Application deleted' });
      if (selectedApp?.id === id) setSelectedApp(null);
      fetchAdmissions();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  /**
   * Helper to format official WhatsApp message
   */
  const getWhatsAppMessage = (app, status, notes) => {
    const child = app?.child_name || 'Applicant';
    const guardian = app?.guardian_name || 'Guardian';
    const appNo = app?.app_no || '';
    const grade = app?.class_applying || '';

    if (status === 'Accepted') {
      return `*RAISE A CHILD CHILDREN HOME*
🎉 *OFFICIAL ADMISSION ACCEPTED & APPROVED*
Ref No: ${appNo}

Dear ${guardian},

We are delighted to inform you that the admission application for *${child}* (Class: ${grade}) has been *ACCEPTED & APPROVED* for residence and education at RAISE A CHILD CHILDREN HOME.

*Next Steps for Admission:*
1. Please visit our hostel campus with ${child}'s original Birth Certificate, Aadhar Card, and Transfer Certificate/Marks Sheet.
2. Contact our administration at +91 90594 91777 to confirm your arrival and bed allocation.
3. Campus Address: Mannar Polur, Sullurpeta Mandal, Tirupati District, AP - 524121.
${notes ? `\n*Official Remarks:* "${notes}"\n` : ''}
With blessings & warm regards,
*BRO .NELSON*
Founder & Managing Trustee
RAISE A CHILD CHILDREN HOME`;
    } else if (status === 'Rejected') {
      return `*RAISE A CHILD CHILDREN HOME*
📋 *ADMISSION APPLICATION UPDATE*
Ref No: ${appNo}

Dear ${guardian},

Thank you for your application to RAISE A CHILD CHILDREN HOME for *${child}* (Class: ${grade}). After careful review against our residential bed capacity and safety norms, we regret to inform you that we are unable to approve this admission application at this time.
${notes ? `\n*Official Remarks:* "${notes}"\n` : ''}
We pray for ${child}'s bright future and educational success.

Warm regards,
*BRO .NELSON*
Founder & Managing Trustee
RAISE A CHILD CHILDREN HOME
Phone: +91 90594 91777`;
    } else {
      return `*RAISE A CHILD CHILDREN HOME*
🔍 *ADMISSION UNDER REVIEW*
Ref No: ${appNo}

Dear ${guardian},

The admission application for *${child}* (${appNo}) is currently *UNDER ACTIVE REVIEW* by our Admissions Board.
${notes ? `\n*Remarks:* "${notes}"\n` : ''}
Our hostel representative may contact you on this number shortly for document verification.

Warm regards,
*BRO .NELSON*
Founder & Managing Trustee
RAISE A CHILD CHILDREN HOME`;
    }
  };

  /**
   * Helper to construct one-click WhatsApp dispatch URL
   */
  const getWhatsAppUrl = (app, status, notes) => {
    let cleanPhone = (app?.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const text = getWhatsAppMessage(app, status, notes);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  /**
   * Helper to construct one-click Mailto URL
   */
  const getMailtoUrl = (app, status, notes) => {
    if (!app?.email) return '';
    const subject = `Admission Decision: Application ${app.app_no} - ${status} | RAISE A CHILD CHILDREN HOME`;
    const body = getWhatsAppMessage(app, status, notes).replace(/\*/g, '');
    return `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  /**
   * Print Official Admission Letter
   */
  const handlePrintAdmissionLetter = (app) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const isAccepted = app.status === 'Accepted';
    const isRejected = app.status === 'Rejected';
    const statusColor = isAccepted ? '#059669' : isRejected ? '#e11d48' : '#2563eb';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Admission Letter - ${app.app_no}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
            .subtitle { font-size: 13px; color: #475569; margin-top: 4px; font-style: italic; }
            .address { font-size: 12px; color: #64748b; margin-top: 4px; }
            .ref-date { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 20px; font-weight: 600; }
            .badge-wrap { text-align: center; margin: 24px 0; }
            .status-badge { display: inline-block; padding: 8px 24px; font-weight: bold; border-radius: 6px; font-size: 16px; color: ${statusColor}; border: 2px solid ${statusColor}; text-transform: uppercase; letter-spacing: 1px; }
            .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            .meta-table td { padding: 8px 12px; border: 1px solid #cbd5e1; }
            .content { font-size: 14.5px; margin: 24px 0; line-height: 1.8; }
            .content ul { padding-left: 20px; }
            .signature-box { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .seal-box { width: 120px; height: 120px; border: 2px dashed #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; text-transform: uppercase; text-align: center; }
            .signature-line { width: 240px; border-top: 1px solid #0f172a; text-align: center; padding-top: 6px; font-size: 13px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">RAISE A CHILD CHILDREN HOME</h1>
            <div class="subtitle">A Registered Residential Home for Love, Learning & Leadership</div>
            <div class="address">Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121 | Phone: +91 90594 91777</div>
          </div>

          <div class="ref-date">
            <div>Application Ref: <span style="font-family: monospace;">${app.app_no}</span></div>
            <div>Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          <div class="badge-wrap">
            <div class="status-badge">
              ${isAccepted ? 'Official Admission Confirmation' : isRejected ? 'Admission Application Decision' : 'Application Under Review'}
            </div>
          </div>

          <table class="meta-table">
            <tr>
              <td style="width: 25%; font-weight: bold; background: #f8fafc;">Child Full Name:</td>
              <td style="width: 25%; font-weight: bold;">${app.child_name}</td>
              <td style="width: 25%; font-weight: bold; background: #f8fafc;">Application Ref:</td>
              <td style="width: 25%; font-family: monospace;">${app.app_no}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background: #f8fafc;">Class Applied:</td>
              <td>${app.class_applying}</td>
              <td style="font-weight: bold; background: #f8fafc;">Age & Gender:</td>
              <td>${app.age} Years | ${app.gender}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background: #f8fafc;">Guardian Name:</td>
              <td>${app.guardian_name}</td>
              <td style="font-weight: bold; background: #f8fafc;">Contact Mobile:</td>
              <td>${app.phone}</td>
            </tr>
          </table>

          <div class="content">
            <p>Dear ${app.guardian_name},</p>
            ${isAccepted ? `
              <p>We are pleased to inform you that following due assessment by our Admissions Board, <strong>${app.child_name}</strong> has been <strong>ACCEPTED & APPROVED</strong> for admission into Class <strong>${app.class_applying}</strong> at RAISE A CHILD CHILDREN HOME.</p>
              <p>Our residential sanctuary provides complete housing, wholesome nutrition, academic coaching, moral development, and medical care in a safe, loving environment.</p>
              <p><strong>Required Documents at Reporting:</strong></p>
              <ul>
                <li>Original and 2 photocopies of Child's Birth Certificate</li>
                <li>Aadhar Card copies of Child and Guardian</li>
                <li>Transfer Certificate (TC) or Marks Statement from previous school</li>
                <li>3 Passport-sized photographs of the child</li>
              </ul>
              ${app.admin_notes ? `<p><strong>Official Remarks:</strong> <em>"${app.admin_notes}"</em></p>` : ''}
              <p>Please report on the designated date to complete the hostel intake formalities.</p>
            ` : isRejected ? `
              <p>Thank you for submitting an admission application for <strong>${app.child_name}</strong> at RAISE A CHILD CHILDREN HOME.</p>
              <p>After careful evaluation of current residential capacity and hostel accommodation guidelines, we regret to inform you that we cannot offer admission for the requested academic session.</p>
              ${app.admin_notes ? `<p><strong>Reason / Remarks:</strong> <em>"${app.admin_notes}"</em></p>` : ''}
              <p>We extend our sincere prayers and best wishes for ${app.child_name}'s continued education and bright future.</p>
            ` : `
              <p>The admission application for <strong>${app.child_name}</strong> is currently <strong>Under Active Review</strong> by our admissions committee.</p>
              ${app.admin_notes ? `<p><strong>Official Remarks:</strong> <em>"${app.admin_notes}"</em></p>` : ''}
            `}
          </div>

          <div class="signature-box">
            <div class="seal-box">Official<br/>Hostel<br/>Seal</div>
            <div class="signature-line">
              <strong>BRO .NELSON</strong><br/>
              Founder & Managing Trustee<br/>
              RAISE A CHILD CHILDREN HOME
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Review</span>
          <span className="block text-2xl font-bold text-amber-600 mt-1">{stats.pending}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Under Review</span>
          <span className="block text-2xl font-bold text-blue-600 mt-1">{stats.under_review}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Accepted</span>
          <span className="block text-2xl font-bold text-emerald-600 mt-1">{stats.accepted}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Received</span>
          <span className="block text-2xl font-bold text-slate-900 mt-1">{stats.total}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, app ref, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Pending', 'Under Review', 'Accepted', 'Rejected'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      ) : admissions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No admission applications found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Mobile swipe helper */}
          <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
            <span>Admission Applications</span>
            <span className="font-semibold text-emerald-700">← Swipe table sideways →</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">App Ref</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[130px]">Child Name</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Class</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[140px]">Guardian & Phone</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Decision</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Notification</th>
                  <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{app.app_no}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{app.child_name}</td>
                  <td className="py-3 px-4">{app.class_applying}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="font-semibold text-slate-800">{app.guardian_name}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{app.phone}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      app.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {app.notification_status ? (
                      <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Check className="w-3 h-3 text-emerald-600 mr-1" />
                        <span>{app.notification_status}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Auto-notified on update</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setStatusNotes(app.admin_notes || '');
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg text-xs mr-2 transition"
                    >
                      Dossier
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Detailed Applicant Dossier Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedApp.app_no}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedApp.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                    selectedApp.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                    selectedApp.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
                  Applicant: {selectedApp.child_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedApp(null)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Class Applying:</span>
                <span className="font-bold text-slate-900">{selectedApp.class_applying}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Age & Gender:</span>
                <span className="font-bold text-slate-900">{selectedApp.age} yrs • {selectedApp.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Guardian Name:</span>
                <span className="font-bold text-slate-900">{selectedApp.guardian_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Contact Phone:</span>
                <a href={`tel:${selectedApp.phone}`} className="font-bold text-emerald-700 hover:underline">
                  {selectedApp.phone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Applicant Email:</span>
                <span className="font-medium text-slate-800">
                  {selectedApp.email || 'None provided (Use WhatsApp / SMS)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Application Date:</span>
                <span className="font-medium text-slate-800">{selectedApp.created_at?.split(' ')[0]}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-xs">Address:</span>
              <p className="font-medium text-slate-800 text-xs sm:text-sm mt-0.5">{selectedApp.address}</p>
            </div>

            <div>
              <span className="text-slate-400 block text-xs">Reason for Hostel Admission:</span>
              <p className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl text-slate-800 leading-relaxed text-xs sm:text-sm mt-1">
                {selectedApp.reason}
              </p>
            </div>

            {/* Notification & Communication Dispatch Center */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Direct Applicant Communication Center</h4>
                    <p className="text-[11px] text-slate-400">Automatic official letters customized with hostel seal and founder name</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePrintAdmissionLetter(selectedApp)}
                  className="bg-white/10 hover:bg-white/20 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter</span>
                </button>
              </div>

              {/* Status info banner */}
              <div className="text-xs space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Automated Email System:</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedApp.email ? `Active (Sends to ${selectedApp.email})` : 'No email provided (Use WhatsApp)'}
                  </span>
                </div>
                {selectedApp.notification_sent_at && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Last Dispatched:</span>
                    <span className="text-slate-300 font-mono">{selectedApp.notification_sent_at}</span>
                  </div>
                )}
              </div>

              {/* Quick Communication Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={getWhatsAppUrl(selectedApp, selectedApp.status, statusNotes || selectedApp.admin_notes)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp to Guardian</span>
                </a>

                {selectedApp.email ? (
                  <a
                    href={getMailtoUrl(selectedApp, selectedApp.status, statusNotes || selectedApp.admin_notes)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send via Email Client</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="bg-slate-700/50 text-slate-400 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4" />
                    <span>No Email Provided</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Update Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="block font-bold text-slate-900 text-xs sm:text-sm">
                Update Status & Remarks (Triggers Automatic Dispatch)
              </label>
              <textarea
                rows="2"
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                placeholder="Official remarks (e.g. Bring original transfer certificate, report by 10 AM on Monday...)"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedApp.id, 'Under Review')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mark Under Review</span>
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedApp.id, 'Accepted')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept & Approve</span>
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedApp.id, 'Rejected')}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
