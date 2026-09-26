import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, Award, Clock, User, Upload, Plus, 
  Edit3, Trash2, X, Check, Shield, GraduationCap 
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Staff({ onShowToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { adminUser } = useAdminAuth();

  const fetchStaff = () => {
    setLoading(true);
    api.getStaff()
      .then(setStaffList)
      .catch(err => {
        console.error(err);
        onShowToast?.({ type: 'error', message: 'Failed to load staff list' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      if (currentEdit.id) {
        await api.updateStaff(currentEdit.id, currentEdit);
        onShowToast?.({ type: 'success', message: 'Staff member updated successfully' });
      } else {
        await api.createStaff(currentEdit);
        onShowToast?.({ type: 'success', message: 'New staff member added successfully' });
      }
      setEditModalOpen(false);
      setCurrentEdit(null);
      fetchStaff();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Operation failed' });
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the staff directory?`)) return;
    try {
      await api.deleteStaff(id);
      onShowToast?.({ type: 'success', message: 'Staff member removed' });
      if (selectedStaff?.id === id) setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Dedicated Resident Guardians</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Hostel Staff & Mentors
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
            Meet our qualified wardens, educators, counselors, cooks, and healthcare professionals devoted to our children's wellbeing and growth 24 hours a day.
          </p>
        </div>

        {adminUser && (
          <button
            onClick={() => {
              setCurrentEdit({
                name: '',
                role: '',
                mobile: '',
                email: '',
                qualification: '',
                experience: '',
                description: '',
                photo: '',
                order_num: staffList.length + 1
              });
              setEditModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 self-start transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-slate-100 rounded-2xl h-80" />
          ))}
        </div>
      ) : !Array.isArray(staffList) || staffList.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs max-w-xl mx-auto space-y-3">
          <Shield className="w-12 h-12 text-emerald-500/70 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 font-serif">Staff Directory Ready</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No staff profiles have been added yet. Sign in to the Admin Dashboard to add wardens, tutors, counselors, and support staff.
          </p>
          {adminUser && (
            <button
              onClick={() => {
                setCurrentEdit({
                  name: '',
                  role: '',
                  mobile: '',
                  email: '',
                  qualification: '',
                  experience: '',
                  description: '',
                  photo: ''
                });
                setEditModalOpen(true);
              }}
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Staff Member</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staffList.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              {/* Photo & Badge */}
              <div 
                onClick={() => setSelectedStaff(member)}
                className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer"
              >
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : null}
                <div 
                  style={{ display: member.photo ? 'none' : 'flex' }}
                  className="w-full h-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 text-slate-400 select-none"
                >
                  <User className="w-16 h-16 stroke-[1.25] text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">No Photo</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />
                
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {member.experience ? `${member.experience}` : 'Verified Staff'}
                </span>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-bold font-serif leading-tight group-hover:text-emerald-300 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    {member.role}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600">
                  {member.qualification && (
                    <div className="flex items-center space-x-2 text-slate-700">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate font-medium">{member.qualification}</span>
                    </div>
                  )}
                  {member.description && (
                    <p className="line-clamp-2 text-slate-500 pt-1 leading-relaxed">
                      {member.description}
                    </p>
                  )}
                </div>

                {/* Contact Actions (Direct Dialer & Email) */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <a
                      href={`tel:${member.mobile}`}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1 transition"
                      title="Direct phone call dialer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call</span>
                    </a>

                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs transition"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedStaff(member)}
                    className="text-xs text-emerald-700 font-bold hover:underline px-1 py-2"
                  >
                    View Bio
                  </button>
                </div>

                {/* Admin Quick Actions */}
                {adminUser && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setCurrentEdit(member);
                        setEditModalOpen(true);
                      }}
                      className="text-xs text-slate-600 hover:text-emerald-700 p-1 flex items-center"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="text-xs text-rose-600 hover:text-rose-700 p-1 flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Detailed Profile View Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
              {selectedStaff.photo ? (
                <img
                  src={selectedStaff.photo}
                  alt={selectedStaff.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-2 border-emerald-100"
                />
              ) : null}
              <div 
                style={{ display: selectedStaff.photo ? 'none' : 'flex' }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 flex-col items-center justify-center text-slate-400 border-2 border-slate-200 shadow-sm flex-shrink-0"
              >
                <User className="w-10 h-10 stroke-[1.25] text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400 mt-1">No Photo</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                  {selectedStaff.role}
                </span>
                <h3 className="text-2xl font-bold font-serif text-slate-900 mt-2">
                  {selectedStaff.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Experience: {selectedStaff.experience || 'Experienced Educator'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Qualification:</span>
                  <span>{selectedStaff.qualification || 'Certified Residential Caregiver'}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Contact Number:</span>
                  <a href={`tel:${selectedStaff.mobile}`} className="text-emerald-700 font-bold hover:underline">
                    {selectedStaff.mobile}
                  </a>
                </div>
                {selectedStaff.email && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-900">Official Email:</span>
                    <a href={`mailto:${selectedStaff.email}`} className="text-emerald-700 hover:underline">
                      {selectedStaff.email}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Responsibilities & Bio
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedStaff.description || "Dedicated staff member providing daily mentoring, student welfare, discipline, and emotional encouragement for our children."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`tel:${selectedStaff.mobile}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </a>

              {selectedStaff.email && (
                <a
                  href={`mailto:${selectedStaff.email}`}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Staff Modal */}
      {editModalOpen && currentEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {currentEdit.id ? 'Edit Staff Profile' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={currentEdit.name}
                  onChange={e => setCurrentEdit({ ...currentEdit, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Pradeep Mukherjee"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={currentEdit.role}
                  onChange={e => setCurrentEdit({ ...currentEdit, role: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Hostel Superintendent & Warden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={currentEdit.mobile}
                    onChange={e => setCurrentEdit({ ...currentEdit, mobile: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+91 98302 11223"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={currentEdit.email}
                    onChange={e => setCurrentEdit({ ...currentEdit, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="warden@shantiniketanhostel.org"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={currentEdit.qualification}
                    onChange={e => setCurrentEdit({ ...currentEdit, qualification: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. M.A. Sociology, B.Ed."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience</label>
                  <input
                    type="text"
                    value={currentEdit.experience}
                    onChange={e => setCurrentEdit({ ...currentEdit, experience: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 15 Years in Residential Care"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs sm:text-sm">
                  <span>Photograph (Optional)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Leave blank for clean avatar</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentEdit.photo}
                    onChange={e => setCurrentEdit({ ...currentEdit, photo: e.target.value })}
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs sm:text-sm"
                    placeholder="Direct Image URL or click Upload"
                  />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingPhoto(true);
                        try {
                          const res = await api.uploadFile(file);
                          setCurrentEdit({ ...currentEdit, photo: res.url });
                          onShowToast?.({ type: 'success', message: 'Staff photo uploaded successfully!' });
                        } catch (err) {
                          onShowToast?.({ type: 'error', message: 'Failed to upload photo: ' + err.message });
                        } finally {
                          setUploadingPhoto(false);
                        }
                      }}
                    />
                  </label>
                  {currentEdit.photo && (
                    <button
                      type="button"
                      onClick={() => setCurrentEdit({ ...currentEdit, photo: '' })}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                      title="Clear photo to keep blank"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  If left blank, the staff card displays a clean placeholder avatar. No random or predefined stock photos are ever displayed.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Responsibilities</label>
                <textarea
                  rows="3"
                  value={currentEdit.description}
                  onChange={e => setCurrentEdit({ ...currentEdit, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Brief description of duties..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  Save Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
