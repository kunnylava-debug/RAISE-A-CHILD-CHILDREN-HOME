import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, Trash2, Plus, RotateCcw, Image as ImageIcon, 
  CheckCircle, ZoomIn, Upload, X, Shield, Filter, AlertTriangle
} from 'lucide-react';
import { api, broadcastLocalSyncEvent, subscribeToRealtimeSync } from '../../services/api';
import { BASE_BOYS_FACILITIES, BASE_GIRLS_FACILITIES } from '../Views';
import LightboxModal from '../../components/LightboxModal';

export default function AdminCampusPhotosTab({ onShowToast }) {
  const [selectedWing, setSelectedWing] = useState('all'); // 'all' | 'boys' | 'girls'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customPhotos, setCustomPhotos] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Photo Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetWing, setTargetWing] = useState('boys');
  const [targetCategory, setTargetCategory] = useState('rooms');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Lightbox Preview
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load campus data from localStorage & Cloud
  const loadCampusData = useCallback(() => {
    try {
      setLoading(true);
      const savedPhotos = localStorage.getItem('rac_campus_custom_photos');
      if (savedPhotos) {
        try { setCustomPhotos(JSON.parse(savedPhotos)); } catch {}
      }
      const savedCats = localStorage.getItem('rac_campus_custom_cats');
      if (savedCats) {
        try { setCustomCategories(JSON.parse(savedCats)); } catch {}
      }
      const savedDeleted = localStorage.getItem('rac_campus_deleted_photo_ids');
      if (savedDeleted) {
        try { setDeletedPhotoIds(JSON.parse(savedDeleted)); } catch {}
      }

      // Fetch cloud deleted photos
      api.getSettings().then(st => {
        if (st && Array.isArray(st.campus_deleted_photo_ids)) {
          setDeletedPhotoIds(prev => {
            const combined = Array.from(new Set([...prev, ...st.campus_deleted_photo_ids]));
            localStorage.setItem('rac_campus_deleted_photo_ids', JSON.stringify(combined));
            return combined;
          });
        }
      }).catch(() => {});

      // Sync with server views if available
      api.getViews().then(serverData => {
        if (Array.isArray(serverData) && serverData.length > 0) {
          const extraPhotos = [];
          serverData.forEach(c => {
            (c.photos || []).forEach(p => {
              if (p.image_url) {
                extraPhotos.push({
                  id: p.id,
                  wing: p.wing || 'both',
                  facility_type: p.facility_type || c.slug || 'rooms',
                  title: p.title || c.name,
                  description: p.description || '',
                  image_url: p.image_url
                });
              }
            });
          });
          if (extraPhotos.length > 0) {
            setCustomPhotos(prev => {
              const ids = new Set(prev.map(p => p.id));
              const combined = [...prev, ...extraPhotos.filter(p => !ids.has(p.id))];
              localStorage.setItem('rac_campus_custom_photos', JSON.stringify(combined));
              return combined;
            });
          }
        }
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampusData();
    const unsubscribe = subscribeToRealtimeSync?.((event) => {
      if (event?.type === 'CAMPUS_UPDATED') {
        const savedDeleted = localStorage.getItem('rac_campus_deleted_photo_ids');
        if (savedDeleted) {
          try { setDeletedPhotoIds(JSON.parse(savedDeleted)); } catch {}
        }
        const savedPhotos = localStorage.getItem('rac_campus_custom_photos');
        if (savedPhotos) {
          try { setCustomPhotos(JSON.parse(savedPhotos)); } catch {}
        }
      }
    });
    return () => unsubscribe?.();
  }, [loadCampusData]);

  // Combined facilities
  const boysFacilities = [
    ...(BASE_BOYS_FACILITIES || []),
    ...customCategories.filter(c => c.wing === 'boys' || c.wing === 'both')
  ];

  const girlsFacilities = [
    ...(BASE_GIRLS_FACILITIES || []),
    ...customCategories.filter(c => c.wing === 'girls' || c.wing === 'both')
  ];

  // Get active photos for a given facility
  const getFacilityPhotos = (facility) => {
    const matchedCustom = customPhotos.filter(p => {
      const matchWing = p.wing === 'both' || p.wing === facility.wing;
      const matchType = p.facility_type === facility.category_slug || p.facility_type === facility.id;
      return matchWing && matchType;
    });
    const combined = [...(facility.defaultPhotos || []), ...matchedCustom];
    return combined.filter(p => {
      if (!p) return false;
      const pid = String(p.id || '');
      const pUrl = String(p.image_url || '');
      return !deletedPhotoIds.includes(pid) && !deletedPhotoIds.includes(pUrl);
    });
  };

  // Delete a photograph (works for both predefined photos like dormitory/kitchen and custom uploads)
  const handleDeletePhoto = async (photo, facilityName = '') => {
    const title = photo.title || 'this photograph';
    const confirmMsg = `Are you sure you want to delete "${title}"${facilityName ? ` from ${facilityName}` : ''}?\n\nThis will remove the photo from public view and admin gallery across all devices.`;
    if (!window.confirm(confirmMsg)) return;

    const pid = String(photo.id || '');
    const pUrl = String(photo.image_url || '');

    // 1. Mark as deleted
    const updatedDeleted = Array.from(new Set([...deletedPhotoIds, pid, pUrl].filter(Boolean)));
    setDeletedPhotoIds(updatedDeleted);
    localStorage.setItem('rac_campus_deleted_photo_ids', JSON.stringify(updatedDeleted));

    // 2. Remove from custom photos if applicable
    if (customPhotos.some(p => String(p.id) === pid || String(p.image_url) === pUrl)) {
      const updatedCustom = customPhotos.filter(p => String(p.id) !== pid && String(p.image_url) !== pUrl);
      setCustomPhotos(updatedCustom);
      localStorage.setItem('rac_campus_custom_photos', JSON.stringify(updatedCustom));
      try {
        if (photo.id && String(photo.id).startsWith('photo_')) {
          await api.deletePhoto(photo.id).catch(() => {});
        }
      } catch {}
    }

    // 3. Persist to cloud settings
    try {
      await api.updateSettings({ campus_deleted_photo_ids: updatedDeleted }).catch(() => {});
    } catch {}

    // 4. Broadcast realtime sync
    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'DELETE_PHOTO', id: pid });
    } catch {}

    onShowToast?.({
      type: 'success',
      message: `Deleted "${title}" successfully from campus facilities!`
    });
  };

  // Restore all deleted photos
  const handleRestoreAllDeleted = async () => {
    if (!window.confirm('Restore all hidden/deleted predefined campus photographs (dormitories, kitchens, grounds, dining, etc.)?')) return;
    setDeletedPhotoIds([]);
    localStorage.removeItem('rac_campus_deleted_photo_ids');
    try {
      await api.updateSettings({ campus_deleted_photo_ids: [] }).catch(() => {});
    } catch {}
    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'RESTORE_ALL' });
    } catch {}
    onShowToast?.({ type: 'success', message: 'All predefined campus photographs restored successfully!' });
  };

  // Upload photo from device
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFile(true);
      const res = await api.uploadFile(file);
      setPhotoUrl(res.url);
      onShowToast?.({ type: 'success', message: 'Photo uploaded from device successfully!' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'File upload failed' });
    } finally {
      setUploadingFile(false);
    }
  };

  // Save new photo
  const handleSaveNewPhoto = async (e) => {
    e.preventDefault();
    if (!photoUrl) {
      onShowToast?.({ type: 'error', message: 'Please upload an image or provide a valid image URL' });
      return;
    }
    const newPhoto = {
      id: 'photo_' + Date.now(),
      wing: targetWing,
      facility_type: targetCategory,
      title: photoTitle.trim() || 'Campus Facility Photo',
      description: photoDesc.trim(),
      image_url: photoUrl.trim()
    };
    const updated = [newPhoto, ...customPhotos];
    setCustomPhotos(updated);
    localStorage.setItem('rac_campus_custom_photos', JSON.stringify(updated));

    try {
      await api.addPhoto({
        category_id: 1,
        title: newPhoto.title,
        description: newPhoto.description,
        image_url: newPhoto.image_url,
        wing: targetWing,
        facility_type: targetCategory
      }).catch(() => {});
    } catch {}

    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'ADD_PHOTO', data: newPhoto });
    } catch {}

    onShowToast?.({ type: 'success', message: 'Facility photo added successfully!' });
    setPhotoTitle('');
    setPhotoDesc('');
    setPhotoUrl('');
    setUploadModalOpen(false);
  };

  // Filter facilities based on active wing
  const displayFacilities = [];
  if (selectedWing === 'all' || selectedWing === 'boys') {
    displayFacilities.push(...boysFacilities);
  }
  if (selectedWing === 'all' || selectedWing === 'girls') {
    displayFacilities.push(...girlsFacilities);
  }

  // Filter facilities by category if set
  const filteredFacilities = selectedCategory === 'all'
    ? displayFacilities
    : displayFacilities.filter(f => f.category_slug === selectedCategory);

  const totalVisiblePhotos = filteredFacilities.reduce((sum, f) => sum + getFacilityPhotos(f).length, 0);

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Camera className="w-3.5 h-3.5" />
            <span>Campus Photography Control Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
            Facility Photographs & Delete Center
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
            Manage, upload, and permanently delete photographs for Dormitories, Kitchens, Sports Grounds, Dining Halls, Study Labs, Prayer Halls, and Washrooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {deletedPhotoIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreAllDeleted}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
              title="Restore all deleted photographs"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>Restore Deleted ({deletedPhotoIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Photograph</span>
          </button>
        </div>
      </div>

      {/* Deleted Photos Info Banner */}
      {deletedPhotoIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">
                {deletedPhotoIds.length} photograph{deletedPhotoIds.length > 1 ? 's are' : ' is'} currently deleted & hidden.
              </span>
              <p className="text-amber-700 mt-0.5">
                Deleted photos (such as predefined Dormitory or Kitchen shots) are hidden from the public website and your gallery across all devices.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreAllDeleted}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All</span>
          </button>
        </div>
      )}

      {/* Filter and Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Wing Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedWing('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              selectedWing === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>All Facilities</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedWing('boys')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              selectedWing === 'boys'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>👦 Boys Campus</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedWing('girls')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              selectedWing === 'girls'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span>👧 Girls Campus</span>
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Facility Types</option>
            <option value="rooms">🛏️ Dormitory / Living Quarters</option>
            <option value="kitchen">🍳 Kitchen & Food Prep</option>
            <option value="ground">⚽ Sports Ground & Play Arena</option>
            <option value="dining">🍽️ Dining Hall</option>
            <option value="study">📚 Study Lab & Library</option>
            <option value="hall">🙏 Assembly & Prayer Hall</option>
            <option value="washrooms">🚿 Washrooms & Restrooms</option>
          </select>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
            {totalVisiblePhotos} Active Photos
          </span>
        </div>
      </div>

      {/* Facilities & Photographs Sections */}
      <div className="space-y-8">
        {filteredFacilities.map((facility) => {
          const photos = getFacilityPhotos(facility);
          const isBoys = facility.wing === 'boys';
          const wingBadgeClass = isBoys 
            ? 'bg-blue-50 text-blue-800 border-blue-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200';
          const wingLabel = isBoys ? '👦 Boys Wing' : '👧 Girls Wing';

          return (
            <div
              key={facility.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Facility Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                    {facility.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
                        {facility.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wingBadgeClass}`}>
                        {wingLabel}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {facility.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                      {facility.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-center">
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl">
                    {photos.length} {photos.length === 1 ? 'Photograph' : 'Photographs'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetWing(facility.wing || 'boys');
                      setTargetCategory(facility.category_slug || 'rooms');
                      setUploadModalOpen(true);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Photos Grid with Prominent Red Delete Buttons */}
              {photos.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">
                    No active photographs currently displayed for this facility.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    (Any previously deleted photos can be restored using the "Restore Deleted" button above)
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {photos.map((photo, pIdx) => {
                    const isCustom = photo.id && String(photo.id).startsWith('photo_');
                    return (
                      <div
                        key={photo.id || pIdx}
                        className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        {/* Photo Image with Lightbox Click */}
                        <div
                          onClick={() => {
                            setLightboxPhotos(photos);
                            setLightboxIndex(pIdx);
                            setLightboxOpen(true);
                          }}
                          className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.title || facility.name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/95 text-slate-900 text-xs font-bold px-3 py-1 rounded-xl flex items-center space-x-1 shadow">
                              <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                              <span>Enlarge Photo</span>
                            </span>
                          </div>

                          {/* Predefined or Custom Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-xs ${
                              isCustom 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-900/80 text-white backdrop-blur-xs'
                            }`}>
                              {isCustom ? 'Custom Upload' : 'Hostel Predefined'}
                            </span>
                          </div>
                        </div>

                        {/* Photo Info & Prominent Delete Button */}
                        <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                              {photo.title || facility.name}
                            </h4>
                            {photo.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {photo.description}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              ID: {photo.id || 'predefined'}
                            </span>
                          </div>

                          {/* PROMINENT RED DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo, facility.name)}
                            className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition hover:shadow-md cursor-pointer"
                            title={`Delete "${photo.title || 'photo'}" from ${facility.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Photograph</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload New Photo Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 font-serif">Add Facility Photograph</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setUploadModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPhoto} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Campus Wing *</label>
                <select
                  value={targetWing}
                  onChange={e => setTargetWing(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="boys">👦 Boys Campus Wing</option>
                  <option value="girls">👧 Girls Campus Wing</option>
                  <option value="both">🏢 Both Wings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Category *</label>
                <select
                  value={targetCategory}
                  onChange={e => setTargetCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                >
                  <option value="rooms">🛏️ Dormitory & Living Quarters</option>
                  <option value="kitchen">🍳 Kitchen & Cooking Center</option>
                  <option value="ground">⚽ Sports Ground & Play Arena</option>
                  <option value="dining">🍽️ Dining Hall</option>
                  <option value="study">📚 Study Lab & Library</option>
                  <option value="hall">🙏 Assembly & Prayer Hall</option>
                  <option value="washrooms">🚿 Washrooms & Restrooms</option>
                  {customCategories.map(c => (
                    <option key={c.id} value={c.category_slug}>🏢 {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photograph Title *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={e => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Clean Dormitory Bunk Beds"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload from Device (or Image URL) *
                </label>
                
                <div className="mb-2">
                  <label className="inline-flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer border border-emerald-200 transition">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{uploadingFile ? 'Uploading from device...' : 'Choose File from Computer/Phone'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  required
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://... or uploaded image path"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
                />

                {photoUrl && (
                  <div className="mt-2 relative h-28 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img 
                      src={photoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                      Image Ready
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={photoDesc}
                  onChange={e => setPhotoDesc(e.target.value)}
                  placeholder="e.g. Spacious modern beds with clean linens"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal with Delete Support */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
        currentIndex={lightboxIndex}
        setCurrentIndex={setLightboxIndex}
        onDeletePhoto={(photo) => {
          handleDeletePhoto(photo);
          setLightboxOpen(false);
        }}
      />
    </div>
  );
}
