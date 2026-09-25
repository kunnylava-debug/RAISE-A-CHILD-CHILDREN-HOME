import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, ShieldCheck, Lock, Unlock, Search, 
  Filter, Plus, Edit3, Trash2, X, ChevronLeft, ChevronRight, 
  Eye, EyeOff, LayoutGrid, Table as TableIcon, Sparkles,
  FileSpreadsheet, ExternalLink, Download, RefreshCw, Copy, 
  CheckCircle, Check, Settings, AlertCircle, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Children({ onShowToast }) {
  const [childrenData, setChildrenData] = useState({
    total_children: 0,
    boys_count: 0,
    girls_count: 0,
    filtered_count: 0,
    children: [],
    page: 1,
    total_pages: 1,
    is_authorized: false
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedChild, setSelectedChild] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editChild, setEditChild] = useState(null);
  const [staffPasskeyModalOpen, setStaffPasskeyModalOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  
  // Google Sheet & Excel Integration State
  const [sheetInfo, setSheetInfo] = useState(null);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [webhookInput, setWebhookInput] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);

  const { adminUser, setLoginModalOpen } = useAdminAuth();

  const fetchChildren = (currentPage = page) => {
    setLoading(true);
    api.getChildren({
      page: currentPage,
      limit: 12,
      search,
      class: classFilter,
      gender: genderFilter
    })
      .then(setChildrenData)
      .catch(err => {
        console.error(err);
        onShowToast?.({ type: 'error', message: 'Failed to load children records' });
      })
      .finally(() => setLoading(false));
  };

  const loadSheetInfo = () => {
    api.getChildrenSheetInfo()
      .then(info => {
        setSheetInfo(info);
        if (info.webhook_url) setWebhookInput(info.webhook_url);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchChildren(1);
    setPage(1);
    loadSheetInfo();
  }, [search, classFilter, genderFilter, adminUser]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > childrenData.total_pages) return;
    setPage(newPage);
    fetchChildren(newPage);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleSyncGoogleSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await api.syncChildrenGoogleSheet();
      onShowToast?.({
        type: 'success',
        message: res.message || `Successfully synced with Google Sheet (${res.added_count || 0} imported)`
      });
      fetchChildren(page);
      loadSheetInfo();
    } catch (err) {
      onShowToast?.({ type: 'error', message: 'Sync failed: ' + err.message });
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    try {
      setSavingWebhook(true);
      await api.setupChildrenGoogleSheetWebhook({ webhook_url: webhookInput });
      onShowToast?.({ type: 'success', message: 'Google Sheet Webhook saved!' });
      loadSheetInfo();
      setSheetModalOpen(false);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    const scriptCode = `// Google Apps Script for RAISE A CHILD HOME Children Records
// 1. In Google Sheet, click Extensions > Apps Script
// 2. Paste this code and click Deploy > New deployment > Web app
// 3. Set 'Who has access' to 'Anyone'
// 4. Copy the Web app URL and paste it in the website settings

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Serial ID', 'Full Name', 'Age', 'Gender', 'Class / Grade', 
        'Admission Date', 'Guardian / Parent Name', 'Guardian Phone', 
        'Address / Native Place', 'Medical Notes', 'Hobbies & Talents', 'Logged At'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#E6F4EA');
    }
    
    sheet.appendRow([
      data.serial_no || '',
      data.name || '',
      data.age || '',
      data.gender || '',
      data.class || '',
      data.admission_date || '',
      data.guardian_name || '',
      data.guardian_phone || '',
      data.guardian_address || '',
      data.medical_notes || '',
      data.hobbies || '',
      new Date().toLocaleString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Row appended' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
    onShowToast?.({ type: 'success', message: 'Apps Script code copied to clipboard!' });
  };

  const handleSaveChild = async (e) => {
    e.preventDefault();
    try {
      if (editChild.id) {
        await api.updateChild(editChild.id, editChild);
        onShowToast?.({ type: 'success', message: 'Child record updated & synchronized to Excel form' });
      } else {
        await api.createChild(editChild);
        onShowToast?.({ type: 'success', message: 'New child record added & stored in Excel form!' });
      }
      setAddModalOpen(false);
      setEditChild(null);
      fetchChildren(page);
      loadSheetInfo();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Operation failed' });
    }
  };

  const handleDeleteChild = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove child record for ${name}?`)) return;
    try {
      await api.deleteChild(id);
      onShowToast?.({ type: 'success', message: 'Child record removed' });
      if (selectedChild?.id === id) setSelectedChild(null);
      fetchChildren(page);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* 1. TOP STATS: PROMINENT TOTAL CHILDREN COUNTER (Mobile & Desktop) */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Users className="w-3.5 h-3.5" />
              <span>Hostel Resident Census</span>
            </div>
            <div className="pt-1">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight text-white">
                Total Children: <span className="text-emerald-300">{childrenData.total_children || 120}</span>
              </h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Every child is provided with full residential accommodation, school tuition, nutritious daily meals, medical checkups, and loving guidance.
            </p>
          </div>

          {/* Aggregate Badges - Mobile Optimized */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 text-center flex-shrink-0">
            <div className="p-2 sm:px-3 bg-white/5 sm:bg-transparent rounded-xl">
              <span className="block text-xl sm:text-3xl font-extrabold text-emerald-400">{childrenData.boys_count || 60}</span>
              <span className="text-[10px] sm:text-xs text-slate-200 font-semibold uppercase tracking-wider mt-0.5 block">👦 Boys Wing</span>
            </div>
            <div className="p-2 sm:px-3 bg-white/5 sm:bg-transparent rounded-xl sm:border-x sm:border-white/20">
              <span className="block text-xl sm:text-3xl font-extrabold text-teal-300">{childrenData.girls_count || 60}</span>
              <span className="text-[10px] sm:text-xs text-slate-200 font-semibold uppercase tracking-wider mt-0.5 block">👧 Girls Wing</span>
            </div>
            <div className="p-2 sm:px-3 bg-white/5 sm:bg-transparent rounded-xl">
              <span className="block text-xl sm:text-3xl font-extrabold text-amber-300">100%</span>
              <span className="text-[10px] sm:text-xs text-slate-200 font-semibold uppercase tracking-wider mt-0.5 block">🎓 In School</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GOOGLE SHEET & EXCEL LIVE FORM INTEGRATION */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Excel & Google Sheet Synchronized</span>
            </span>
            {sheetInfo?.is_webhook_active ? (
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                <CheckCircle className="w-3 h-3 mr-1 text-emerald-400" />
                Live Cloud Sync Active
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                Excel File Updated Automatically
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-serif text-white flex items-center space-x-2">
            <span>RAISE A CHILD Children Records Excel Form</span>
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Adding or updating children details automatically stores the record in your up-to-date Excel spreadsheet (.xlsx / .csv) and pushes directly to your connected Google Sheet.
          </p>

          <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-2 pt-0.5">
            <span>Connected Sheet ID: 1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ</span>
            <span>•</span>
            <span>{sheetInfo?.total_records || childrenData.total_children || 0} Records Formatted</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto">
          {/* Open Google Sheet Link */}
          <a
            href={sheetInfo?.google_sheet_url || 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-emerald-50 text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-sm border border-white"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Open Google Sheet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Download Excel */}
          <a
            href={api.getChildrenExportExcelUrl()}
            download="RAISE_A_CHILD_Children_Records.xlsx"
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-900/40"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </a>

          {/* Download CSV */}
          <a
            href={api.getChildrenExportCsvUrl()}
            download="RAISE_A_CHILD_Children_Records.csv"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1 border border-slate-700"
            title="Download CSV Format"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>

          {/* Admin Sync from Google Sheet */}
          {adminUser && (
            <>
              <button
                onClick={handleSyncGoogleSheet}
                disabled={syncingSheet}
                className="px-3.5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                title="Sync from Google Sheet to Website"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingSheet ? 'animate-spin' : ''}`} />
                <span>{syncingSheet ? 'Syncing...' : 'Sync from Sheet'}</span>
              </button>

              <button
                onClick={() => setSheetModalOpen(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
                title="Google Sheet Integration & Webhook Setup"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. RESPONSIBLE PRIVACY PROTECTION BANNER */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center">
              <span>Child Privacy & Data Protection Shield</span>
              <span className="ml-2 text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                Protected
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              In accordance with child welfare regulations, sensitive personal records (guardian contact, address, medical notes) are masked for public visitors.
            </p>
          </div>
        </div>

        <div>
          {adminUser ? (
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
              <Unlock className="w-4 h-4" />
              <span>Staff Mode Unlocked (Full Dossiers Accessible)</span>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Staff Login for Full Access</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CONTROLS: SEARCH, FILTERS, VIEW TOGGLE, ADMIN ADD */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="text-xs sm:text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none"
          >
            <option value="all">All Classes / Grades</option>
            <optgroup label="Primary (Classes 1 - 5)">
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
            </optgroup>
            <optgroup label="Secondary (Classes 6 - 10)">
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </optgroup>
            <optgroup label="Higher Secondary & Beyond">
              <option value="Class 11">Class 11 (Plus One)</option>
              <option value="Class 12">Class 12 (Plus Two)</option>
              <option value="College / Degree">College / Degree</option>
              <option value="Vocational / ITI">Vocational / ITI</option>
            </optgroup>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="text-xs sm:text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none"
          >
            <option value="all">All Genders</option>
            <option value="Male">Boys</option>
            <option value="Female">Girls</option>
          </select>
        </div>

        {/* Right Action controls */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {adminUser && (
            <button
              onClick={() => {
                setEditChild({
                  serial_no: '',
                  name: '',
                  age: 10,
                  class: 'Class 5',
                  gender: 'Male',
                  admission_date: new Date().toISOString().split('T')[0],
                  photo: '',
                  guardian_name: '',
                  guardian_phone: '',
                  guardian_address: '',
                  medical_notes: 'Normal routine health checkup.',
                  hobbies: 'Sports, Reading'
                });
                setAddModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Child</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. CHILDREN LIST (GRID / TABLE) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-slate-100 rounded-2xl h-72" />
          ))}
        </div>
      ) : !Array.isArray(childrenData?.children) || childrenData.children.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 text-sm">No child records found matching your query.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Array.isArray(childrenData?.children) ? childrenData.children : []).map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div 
                onClick={() => setSelectedChild(child)}
                className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
              >
                <img
                  src={child.photo}
                  alt={child.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* S.No Badge */}
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded-md">
                  {child.serial_no}
                </span>

                <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                  child.gender === 'Female' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  {child.class}
                </span>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-bold font-serif leading-tight">
                    {child.name}
                  </h3>
                  <span className="text-xs text-slate-300">
                    Age: {child.age} yrs • {child.gender}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Enrolled:</span>
                    <span className="font-semibold text-slate-700">{child.admission_date}</span>
                  </div>
                  {child.hobbies && (
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Interests</span>
                      <span className="text-slate-700 truncate block">{child.hobbies}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedChild(child)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  {adminUser && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditChild(child);
                          setAddModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-700"
                        title="Edit Child"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child.id, child.name)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Delete Child"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW (RESPONSIVE) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Mobile swipe helper */}
          <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200">
            <span>Resident Records</span>
            <span className="font-semibold text-emerald-700">← Swipe table sideways →</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] sm:text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">S.No</th>
                  <th className="py-3 px-3 sm:px-4">Photo</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[130px]">Child Name</th>
                  <th className="py-3 px-3 sm:px-4">Age</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Class</th>
                  <th className="py-3 px-3 sm:px-4">Gender</th>
                  <th className="py-3 px-3 sm:px-4 whitespace-nowrap hidden sm:table-cell">Admission Date</th>
                  <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(childrenData?.children) ? childrenData.children : []).map((child) => (
                  <tr key={child.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 sm:px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{child.serial_no}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <img
                        src={child.photo}
                        alt={child.name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = child.gender === 'Female' 
                            ? 'https://images.unsplash.com/photo-1595454223600-91fbdd77e58b?auto=format&fit=crop&w=300&q=80'
                            : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80';
                        }}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shadow-sm border border-slate-200"
                      />
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-bold text-slate-800 whitespace-nowrap">{child.name}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap">{child.age} yrs</td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-700 whitespace-nowrap">{child.class}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap">{child.gender}</td>
                    <td className="py-3 px-3 sm:px-4 text-slate-500 font-mono text-xs whitespace-nowrap hidden sm:table-cell">{child.admission_date}</td>
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedChild(child)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition mr-1.5"
                      >
                        Dossier
                      </button>
                      {adminUser && (
                        <button
                          onClick={() => handleDeleteChild(child.id, child.name)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PAGINATION CONTROLS */}
      {childrenData.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
          <span className="text-slate-500">
            Showing Page <span className="font-bold text-slate-900">{childrenData.page}</span> of{' '}
            <span className="font-bold text-slate-900">{childrenData.total_pages}</span> (
            {childrenData.filtered_count} children matched)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-2">{page}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= childrenData.total_pages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Child Detailed Profile Modal */}
      {selectedChild && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedChild(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
              <img
                src={selectedChild.photo}
                alt={selectedChild.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-2 border-emerald-100"
              />
              <div className="text-center sm:text-left">
                <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md">
                  {selectedChild.serial_no}
                </span>
                <h3 className="text-2xl font-bold font-serif text-slate-900 mt-2">
                  {selectedChild.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedChild.class} • {selectedChild.age} Years Old • {selectedChild.gender}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Date of Admission:</span>
                  <span className="font-mono text-slate-900">{selectedChild.admission_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Hobbies & Activities:</span>
                  <span className="text-slate-900">{selectedChild.hobbies || 'Sports, Art, Reading'}</span>
                </div>
              </div>

              {/* Sensitive Guardian / Medical Info (Masked if not authorized) */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                  <span className="flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Guardian & Medical Records
                  </span>
                  {selectedChild.is_private_protected && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Privacy Masked
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block">Guardian / Contact:</span>
                    <span className="font-medium text-slate-800">
                      {selectedChild.guardian_name || 'Protected (Authorized Staff Only)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Residential Origin:</span>
                    <span className="font-medium text-slate-800">
                      {selectedChild.guardian_address || 'Protected for Child Privacy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Medical & Pediatric Notes:</span>
                    <span className="font-medium text-slate-800">
                      {selectedChild.medical_notes || 'Normal routine checks.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedChild(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Child Modal */}
      {addModalOpen && editChild && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {editChild.id ? 'Edit Child Record' : 'Enroll New Child Record'}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Excel & Sheet Auto-Store Notice */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 mb-5 flex items-start space-x-2.5 text-xs text-emerald-900">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Excel Form & Google Sheet Auto-Save Active</span>
                <span className="text-emerald-700 text-[11px]">
                  Saving this child will automatically store the details in the Excel form (.xlsx) and push to your connected Google Sheet.
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number (Auto)</label>
                  <input
                    type="text"
                    value={editChild.serial_no}
                    onChange={e => setEditChild({ ...editChild, serial_no: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. SN-CH-121"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Child Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editChild.name}
                    onChange={e => setEditChild({ ...editChild, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    min="4"
                    max="35"
                    required
                    value={editChild.age}
                    onChange={e => setEditChild({ ...editChild, age: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Stage *</label>
                  <select
                    value={editChild.class}
                    onChange={e => setEditChild({ ...editChild, class: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="College / Degree">College / Degree</option>
                    <option value="Vocational / ITI">Vocational / ITI</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={editChild.gender}
                    onChange={e => setEditChild({ ...editChild, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={editChild.photo}
                  onChange={e => setEditChild({ ...editChild, photo: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={editChild.guardian_name}
                    onChange={e => setEditChild({ ...editChild, guardian_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={editChild.guardian_phone}
                    onChange={e => setEditChild({ ...editChild, guardian_phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guardian Address</label>
                <input
                  type="text"
                  value={editChild.guardian_address}
                  onChange={e => setEditChild({ ...editChild, guardian_address: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical Notes</label>
                <textarea
                  rows="2"
                  value={editChild.medical_notes}
                  onChange={e => setEditChild({ ...editChild, medical_notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheet Integration Setup Modal */}
      {sheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-100 my-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
                  Google Sheet & Excel Synchronization
                </h3>
              </div>
              <button 
                onClick={() => setSheetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Sheet Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Google Sheet</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Live Linked</span>
              </div>
              <p className="text-xs font-mono text-slate-700 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                {sheetInfo?.google_sheet_url || 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={sheetInfo?.google_sheet_url || 'https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit?usp=sharing'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Sheet in Google Drive</span>
                </a>
                <a
                  href={api.getChildrenExportExcelUrl()}
                  download="RAISE_A_CHILD_Children_Records.xlsx"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xlsx File</span>
                </a>
              </div>
            </div>

            {/* Webhook Form */}
            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs sm:text-sm mb-1">
                  Google Apps Script Web App URL (Optional for Direct Live Cloud Push)
                </label>
                <input
                  type="url"
                  value={webhookInput}
                  onChange={e => setWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  When configured, every child added on the website automatically appends a new row to your Google Sheet in real time.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingWebhook}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  {savingWebhook ? 'Saving...' : 'Save Webhook URL'}
                </button>
              </div>
            </form>

            {/* Step-by-Step Instructions */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  How to Enable Direct Live Auto-Save to Google Sheet (1 Minute Setup)
                </h4>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center space-x-1 transition"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copy Apps Script Code</span>
                    </>
                  )}
                </button>
              </div>

              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <li>Open your sheet: <a href="https://docs.google.com/spreadsheets/d/1AiMYO2hMBAXqsWw4R0MZPB_On7-CHIvzxTiiidNrBcQ/edit" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">RAISE A CHILD HOME</a></li>
                <li>In Google Sheets menu, click <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Delete any code there, paste the copied script, and click <strong>Save (Ctrl+S)</strong>.</li>
                <li>Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>.</li>
                <li>Set <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>. Click <strong>Deploy</strong>.</li>
                <li>Copy the <strong>Web app URL</strong> provided by Google and paste it into the field above!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
