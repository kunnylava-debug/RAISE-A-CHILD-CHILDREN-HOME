import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ArrowDown, Sparkles, Image, Plus, Trash2, 
  ZoomIn, FolderPlus, X, Camera, Utensils, BookOpen, Heart, 
  Shield, Activity, CheckCircle, ChevronRight, Layers, Flame, RotateCcw
} from 'lucide-react';
import { api, broadcastLocalSyncEvent, subscribeToRealtimeSync, getAuthToken } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import LightboxModal from '../components/LightboxModal';

// Built-in comprehensive campus facilities templates for Boys & Girls wings
export const BASE_BOYS_FACILITIES = [
  {
    id: 'boys-rooms',
    category_slug: 'rooms',
    wing: 'boys',
    name: 'Boys Dormitory & Living Quarters',
    badge: 'Residential Living',
    icon: '🛏️',
    description: 'Spacious, well-ventilated living quarters with individual beds, personal storage lockers, study desks, and 24/7 male resident warden supervision.',
    features: ['Comfortable single beds & clean linen', 'Personal storage wardrobes', 'High ventilation & natural sunlight', '24/7 Resident male warden care'],
    defaultPhotos: [
      {
        id: 'bp-rooms-1',
        title: 'Boys Dormitory Living Area',
        description: 'Clean, spacious dorm with neat bedding and individual locker facilities.',
        image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'bp-rooms-2',
        title: 'Personal Study & Locker Space',
        description: 'Organized study tables and secure personal storage lockers for each student.',
        image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-ground',
    category_slug: 'ground',
    wing: 'boys',
    name: 'Boys Sports Ground & Play Arena',
    badge: 'Outdoor Athletics',
    icon: '⚽',
    description: 'Expansive open ground for cricket pitches, football, running track, volleyball, and regular morning fitness drill routines.',
    features: ['Cricket practice pitch & nets', 'Football & volleyball area', 'Morning PT & athletics running track', 'Full sports equipment kit'],
    defaultPhotos: [
      {
        id: 'bp-ground-1',
        title: 'Outdoor Cricket & Sports Field',
        description: 'Open green play field for outdoor team sports and athletic exercise.',
        image_url: 'https://images.unsplash.com/photo-1529900244931-1e967a544dca?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'bp-ground-2',
        title: 'Evening Recreation & Fitness Area',
        description: 'Children practicing running drills and outdoor sports activities.',
        image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-kitchen',
    category_slug: 'kitchen',
    wing: 'boys',
    name: 'Boys Wing Kitchen & Food Preparation',
    badge: 'Hygienic Cooking',
    icon: '🍳',
    description: 'Hygienic dedicated cooking station equipped with commercial LPG ranges, steam rice cookers, stainless steel counters, and filtered water supply.',
    features: ['Commercial grade steam cookers', 'Stainless steel food prep surfaces', 'Fresh produce & dry cold storage', 'Strict daily hygiene audits'],
    defaultPhotos: [
      {
        id: 'bp-kitchen-1',
        title: 'Hygienic Food Cooking Station',
        description: 'Clean commercial kitchen preparing warm, wholesome meals three times a day.',
        image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-dining',
    category_slug: 'dining',
    wing: 'boys',
    name: 'Boys Dining Hall',
    badge: 'Nutrition & Dining',
    icon: '🍽️',
    description: 'Spacious, sanitized dining hall with stainless steel dining tables and benches, UV drinking water purifier, and fresh warm meal service.',
    features: ['Seating capacity for 120+ students', 'Stainless steel hygienic dining tables', 'Multi-stage RO/UV water purifier', 'Fresh, nutritious hot meals served 3x daily'],
    defaultPhotos: [
      {
        id: 'bp-dining-1',
        title: 'Boys Community Dining Hall',
        description: 'Students seated together enjoying wholesome nutritious lunches and dinners.',
        image_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-study',
    category_slug: 'study',
    wing: 'boys',
    name: 'Boys Study Lab & Reading Library',
    badge: 'Academic Coaching',
    icon: '📚',
    description: 'Quiet study hall with academic reference books, digital computer terminals, and daily supervised homework coaching.',
    features: ['2,500+ syllabus & reference books', 'Computer learning terminals', 'Daily evening tutor coaching', 'Peaceful, focus-oriented atmosphere'],
    defaultPhotos: [
      {
        id: 'bp-study-1',
        title: 'Study Hall & Computer Lab',
        description: 'Well-lit study workstations equipped with learning materials and desktop PCs.',
        image_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-hall',
    category_slug: 'hall',
    wing: 'boys',
    name: 'Boys Assembly & Prayer Hall',
    badge: 'Spiritual & Assembly',
    icon: '🙏',
    description: 'Peaceful community hall for morning assembly, daily prayers, meditation, moral guidance sessions, and holiday cultural events.',
    features: ['Daily morning devotional prayer', 'Moral value education sessions', 'Yoga & meditation gatherings', 'Festival celebrations stage'],
    defaultPhotos: [
      {
        id: 'bp-hall-1',
        title: 'Assembly & Devotional Prayer Hall',
        description: 'Serene hall where students gather for morning prayers and inspirational talks.',
        image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'boys-washrooms',
    category_slug: 'washrooms',
    wing: 'boys',
    name: 'Boys Sanitized Washrooms & Restrooms',
    badge: 'Hygiene & Sanitation',
    icon: '🚿',
    description: 'Clean, modern washrooms with private shower stalls, western & Indian toilets, solar warm water heating, and daily hygiene maintenance.',
    features: ['Enclosed private shower stalls', '24/7 Solar warm water heaters', 'Disinfected 3x daily with antiseptics', 'Hygienic handwash stations with soap'],
    defaultPhotos: [
      {
        id: 'bp-wash-1',
        title: 'Sanitized Restrooms & Shower Stalls',
        description: 'Hygienic, tiled washrooms with continuous running water and solar water heating.',
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

export const BASE_GIRLS_FACILITIES = [
  {
    id: 'girls-rooms',
    category_slug: 'rooms',
    wing: 'girls',
    name: 'Girls Dormitory & Living Quarters',
    badge: 'Secure Living Quarters',
    icon: '🛏️',
    description: 'Warm, sunlit, secure living quarters with individual beds, personal wardrobes, study corners, and 24/7 resident female matron care.',
    features: ['Comfortable individual beds & warm quilts', 'Secure personal wardrobes & shelves', 'Gated private residential perimeter', '24/7 Resident female matron & warden care'],
    defaultPhotos: [
      {
        id: 'gp-rooms-1',
        title: 'Girls Living Quarters & Dormitory',
        description: 'Cozy, clean, and bright dormitory with individual beds and personal space.',
        image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'gp-rooms-2',
        title: 'Sunlit Personal Study & Wardrobe Corner',
        description: 'Dedicated study tables and storage cupboards for each student.',
        image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-ground',
    category_slug: 'ground',
    wing: 'girls',
    name: 'Girls Sports Ground & Recreation Lawn',
    badge: 'Play & Wellness',
    icon: '🏸',
    description: 'Safe, enclosed recreation ground with badminton courts, throwball area, swing sets, yoga lawn, and evening leisure games.',
    features: ['Enclosed badminton & throwball courts', 'Lush green lawn for yoga & fitness', 'Recreational swings & play sets', 'Fully secured, private play perimeter'],
    defaultPhotos: [
      {
        id: 'gp-ground-1',
        title: 'Badminton & Outdoor Games Ground',
        description: 'Girls engaged in outdoor badminton, skipping, and recreational games.',
        image_url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'gp-ground-2',
        title: 'Morning Yoga & Fitness Lawn',
        description: 'Open green area used for daily stretching, yoga, and meditation.',
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-kitchen',
    category_slug: 'kitchen',
    wing: 'girls',
    name: 'Girls Wing Kitchen & Cooking Center',
    badge: 'Nutritious Kitchen',
    icon: '🍳',
    description: 'Dedicated clean culinary area with stainless steel gas burners, vegetable cutting counters, and nutritious balanced meal preparation.',
    features: ['Stainless steel commercial cooking zones', 'Clean dry pantry & spice storage', 'UV/RO purified cooking water', 'Nutritious snacks & milk preparation'],
    defaultPhotos: [
      {
        id: 'gp-kitchen-1',
        title: 'Clean Food Preparation & Cooking Section',
        description: 'Hygienic kitchen dedicated to preparing nutritious, balanced meals.',
        image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-dining',
    category_slug: 'dining',
    wing: 'girls',
    name: 'Girls Dining Hall',
    badge: 'Sanitized Dining',
    icon: '🍽️',
    description: 'Bright, sanitized community dining room with stainless steel seating, UV purified drinking water, and cheerful group dining.',
    features: ['Spacious seating for 120+ girls', 'Hygienic stainless steel tables', 'UV drinking water dispensers', 'Nutritious hot meals & fresh fruit service'],
    defaultPhotos: [
      {
        id: 'gp-dining-1',
        title: 'Sanitized Dining Hall',
        description: 'Clean dining tables with comfortable seating and fresh warm meals.',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-study',
    category_slug: 'study',
    wing: 'girls',
    name: 'Girls Study Lab & Resource Center',
    badge: 'Learning & Library',
    icon: '📚',
    description: 'Quiet, well-stocked library with storybooks, educational charts, computer workstations, and evening tutor assistance.',
    features: ['Curated reference library & storybooks', 'Desktop computer terminals with e-learning', 'Specialized evening tutor guidance', 'Art, crafts, and project workstations'],
    defaultPhotos: [
      {
        id: 'gp-study-1',
        title: 'Library & Computer Learning Center',
        description: 'Bright study space with computers, reference books, and learning aids.',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-hall',
    category_slug: 'hall',
    wing: 'girls',
    name: 'Girls Prayer & Multi-Purpose Hall',
    badge: 'Devotion & Assembly',
    icon: '🙏',
    description: 'Serene assembly and prayer hall for morning devotion, devotional songs, yoga, personality development, and festive celebrations.',
    features: ['Daily devotional singing & prayers', 'Morning yoga & meditation sessions', 'Cultural performances & dance stage', 'Moral value & leadership workshops'],
    defaultPhotos: [
      {
        id: 'gp-hall-1',
        title: 'Prayer, Devotion & Meditation Hall',
        description: 'Quiet devotional space for daily prayer, meditation, and cultural programs.',
        image_url: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'girls-washrooms',
    category_slug: 'washrooms',
    wing: 'girls',
    name: 'Girls Sanitized Restrooms & Washrooms',
    badge: 'Private & Sanitized',
    icon: '🚿',
    description: 'Private, hygienic washrooms with enclosed shower cubicles, sanitized toilets, solar hot water system, and sanitary disposal amenities.',
    features: ['Enclosed private shower stalls', '24/7 Solar hot water supply', 'Disinfected 3x daily with medical-grade cleaners', 'Private sanitary disposal and hygiene amenities'],
    defaultPhotos: [
      {
        id: 'gp-wash-1',
        title: 'Modern Sanitized Washrooms & Restrooms',
        description: 'Spotless tiled washrooms with continuous water and hot shower amenities.',
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

export default function Views({ onShowToast }) {
  const [activeWing, setActiveWing] = useState('all'); // 'all' | 'boys' | 'girls'
  const [customPhotos, setCustomPhotos] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState(() => {
    try {
      const stored = localStorage.getItem('rac_campus_deleted_photo_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Admin Modals
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatWing, setNewCatWing] = useState('boys');

  const [newPhotoModalOpen, setNewPhotoModalOpen] = useState(false);
  const [photoWing, setPhotoWing] = useState('boys');
  const [photoFacilityKey, setPhotoFacilityKey] = useState('rooms');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [managingFacility, setManagingFacility] = useState(null);

  const { adminUser, setLoginModalOpen } = useAdminAuth();
  const isStaffOrAdmin = Boolean(adminUser || getAuthToken() || localStorage.getItem('rac_admin_token') || localStorage.getItem('shanti_admin_token'));

  const handleOpenManageFacilityModal = (facility) => {
    setManagingFacility(facility);
    setManageModalOpen(true);
  };

  // Load custom photos, categories, and deleted predefined photo IDs
  const loadCampusData = () => {
    try {
      setLoading(true);
      const savedPhotos = localStorage.getItem('rac_campus_custom_photos');
      if (savedPhotos) {
        setCustomPhotos(JSON.parse(savedPhotos));
      }
      const savedCats = localStorage.getItem('rac_campus_custom_cats');
      if (savedCats) {
        setCustomCategories(JSON.parse(savedCats));
      }
      const savedDeleted = localStorage.getItem('rac_campus_deleted_photo_ids');
      if (savedDeleted) {
        setDeletedPhotoIds(JSON.parse(savedDeleted));
      }

      // Sync deleted photo IDs from cloud settings so all devices hide/delete unwanted photos
      api.getSettings().then(st => {
        if (st && Array.isArray(st.campus_deleted_photo_ids)) {
          setDeletedPhotoIds(prev => {
            const combined = Array.from(new Set([...prev, ...st.campus_deleted_photo_ids]));
            localStorage.setItem('rac_campus_deleted_photo_ids', JSON.stringify(combined));
            return combined;
          });
        }
      }).catch(() => {});

      // Also sync with server views endpoint if available
      api.getViews().then(serverData => {
        if (Array.isArray(serverData) && serverData.length > 0) {
          // Extract any user uploaded photos from server categories
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
  };

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
  }, []);

  // Jump to specific wing with smooth scroll
  const handleJumpToWing = (wing) => {
    setActiveWing('all');
    setTimeout(() => {
      const targetId = wing === 'boys' ? 'boys-campus-section' : 'girls-campus-section';
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Open Lightbox
  const openFacilityLightbox = (photos, index) => {
    setLightboxPhotos(photos);
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  // Merge default photos with any custom uploaded photos for a facility, excluding any deleted photos
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

  // Upload photo handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await api.uploadFile(file);
      setPhotoUrl(res.url);
      onShowToast?.({ type: 'success', message: 'Photo uploaded from device successfully!' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'File upload failed' });
    } finally {
      setUploading(false);
    }
  };

  // Save new photo
  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!photoUrl) {
      onShowToast?.({ type: 'error', message: 'Please select or enter a photo URL' });
      return;
    }
    const newPhoto = {
      id: 'photo_' + Date.now(),
      wing: photoWing,
      facility_type: photoFacilityKey,
      title: photoTitle.trim() || 'Campus Facility Photo',
      description: photoDesc.trim(),
      image_url: photoUrl.trim()
    };
    const updated = [newPhoto, ...customPhotos];
    setCustomPhotos(updated);
    localStorage.setItem('rac_campus_custom_photos', JSON.stringify(updated));

    // Also persist through api
    try {
      await api.addPhoto({
        category_id: 1,
        title: newPhoto.title,
        description: newPhoto.description,
        image_url: newPhoto.image_url,
        wing: photoWing,
        facility_type: photoFacilityKey
      });
    } catch {}

    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'ADD_PHOTO', data: newPhoto });
    } catch {}

    onShowToast?.({ type: 'success', message: 'Facility photo added successfully!' });
    setPhotoTitle('');
    setPhotoDesc('');
    setPhotoUrl('');
    setNewPhotoModalOpen(false);
  };

  // Delete photo (works for BOTH predefined photos like Dormitory & Kitchen and custom photos)
  const handleDeletePhoto = async (photo) => {
    if (!isStaffOrAdmin) {
      setLoginModalOpen(true);
      onShowToast?.({
        type: 'info',
        message: 'Admin authorization required. Please log in with admin credentials to delete campus photographs.'
      });
      return;
    }

    const photoTitle = photo.title || 'this photograph';
    if (!window.confirm(`Delete "${photoTitle}" from campus facilities?`)) return;

    const pid = String(photo.id || '');
    const pUrl = String(photo.image_url || '');

    // 1. Add to deleted IDs list
    const updatedDeleted = Array.from(new Set([...deletedPhotoIds, pid, pUrl].filter(Boolean)));
    setDeletedPhotoIds(updatedDeleted);
    localStorage.setItem('rac_campus_deleted_photo_ids', JSON.stringify(updatedDeleted));

    // 2. If it was a custom photo, remove from custom list
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

    // 3. Persist deleted photo IDs to cloud settings so all devices stay in sync
    try {
      await api.updateSettings({ campus_deleted_photo_ids: updatedDeleted }).catch(() => {});
    } catch {}

    // 4. Broadcast sync event across windows/tabs
    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'DELETE_PHOTO', id: pid });
    } catch {}

    onShowToast?.({ type: 'success', message: `Photograph "${photoTitle}" deleted from campus!` });
  };

  // Restore deleted/hidden predefined campus photos
  const handleRestoreDeletedPhotos = async () => {
    if (!window.confirm('Restore all hidden/deleted predefined campus photographs (dormitory, kitchen, sports, etc.)?')) return;
    setDeletedPhotoIds([]);
    localStorage.removeItem('rac_campus_deleted_photo_ids');
    try {
      await api.updateSettings({ campus_deleted_photo_ids: [] }).catch(() => {});
    } catch {}
    try {
      broadcastLocalSyncEvent?.({ type: 'CAMPUS_UPDATED', action: 'RESTORE_ALL' });
    } catch {}
    onShowToast?.({ type: 'success', message: 'All campus photographs restored successfully!' });
  };

  // Add custom facility category
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat = {
      id: 'cat_' + Date.now(),
      category_slug: newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      wing: newCatWing,
      name: newCatName.trim(),
      badge: 'Custom Facility',
      icon: '🏢',
      description: newCatDesc.trim() || 'Modern facility equipped for student care and activities.',
      features: ['Dedicated student utility', 'Supervised operation', 'Clean and maintained'],
      defaultPhotos: []
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    localStorage.setItem('rac_campus_custom_cats', JSON.stringify(updated));
    onShowToast?.({ type: 'success', message: 'New campus facility category added!' });
    setNewCatName('');
    setNewCatDesc('');
    setNewCatModalOpen(false);
  };

  // Compile full list for each wing
  const boysFacilities = [
    ...BASE_BOYS_FACILITIES,
    ...customCategories.filter(c => c.wing === 'boys' || c.wing === 'both')
  ];

  const girlsFacilities = [
    ...BASE_GIRLS_FACILITIES,
    ...customCategories.filter(c => c.wing === 'girls' || c.wing === 'both')
  ];

  // Total photo count across campus
  const totalBoysPhotos = boysFacilities.reduce((sum, f) => sum + getFacilityPhotos(f).length, 0);
  const totalGirlsPhotos = girlsFacilities.reduce((sum, f) => sum + getFacilityPhotos(f).length, 0);
  const totalPhotos = totalBoysPhotos + totalGirlsPhotos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5 shadow-sm">
            <Building2 className="w-3.5 h-3.5" />
            <span>Campus Infrastructure & Wings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-slate-900 tracking-tight">
            Campus Facilities & Living Quarters
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2.5 max-w-3xl leading-relaxed">
            Welcome to our campus. We provide completely separate, safe, and fully equipped residential facilities for both boys and girls — featuring modern dormitories, dedicated dining & kitchens, sports grounds, study centers, prayer halls, and sanitized washrooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => {
              setManagingFacility(boysFacilities[0] || girlsFacilities[0]);
              setManageModalOpen(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md hover:shadow-lg transition cursor-pointer"
            title="Delete photographs from Dormitory, Kitchen, and living quarters"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Campus Photos</span>
          </button>

          {deletedPhotoIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreDeletedPhotos}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-300 shadow-xs cursor-pointer"
              title="Restore all hidden/deleted predefined campus photographs"
            >
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Restore Deleted ({deletedPhotoIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isStaffOrAdmin) {
                setLoginModalOpen(true);
                return;
              }
              setNewPhotoModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Facility Photo</span>
          </button>

          {!isStaffOrAdmin && (
            <button 
              type="button" 
              onClick={() => setLoginModalOpen(true)} 
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* ENTRANCE QUICK JUMP CARDS (Direct Entrance Feature) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Quick Wing Jump Navigation
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-2">
            Explore Dedicated Campus Wings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Click to instantly jump to either the Boys Campus or Girls Campus section below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BOYS CAMPUS JUMP CARD */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-lg border border-indigo-800/40 flex flex-col justify-between hover:border-indigo-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center space-x-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  <span>👦 Boys Residential Wing</span>
                </span>
                <span className="text-xs text-blue-200/80 font-semibold bg-white/10 px-2.5 py-0.5 rounded-lg">
                  {totalBoysPhotos} Photos Available
                </span>
              </div>
              <h3 className="text-2xl font-extrabold font-serif text-white mb-2 group-hover:text-blue-300 transition-colors">
                Boys Campus Wing
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mb-5">
                Complete self-contained wing with independent dormitories, sports playground, modern kitchen, dining hall, study lab, assembly hall, and 24/7 male warden care.
              </p>

              {/* Facility Chips */}
              <div className="flex flex-wrap gap-1.5 mb-6 text-[11px] font-medium text-blue-200">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🛏️ Dormitories</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">⚽ Sports Ground</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🍳 Modern Kitchen</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🍽️ Dining Hall</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">📚 Study Lab</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🙏 Prayer Hall</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🚿 Sanitized Washrooms</span>
              </div>
            </div>

            <button
              onClick={() => handleJumpToWing('boys')}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Jump to Boys Campus</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>

          {/* GIRLS CAMPUS JUMP CARD */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-pink-950 text-white p-6 sm:p-8 shadow-lg border border-rose-800/40 flex flex-col justify-between hover:border-rose-500/60 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  <span>👧 Girls Residential Wing</span>
                </span>
                <span className="text-xs text-rose-200/80 font-semibold bg-white/10 px-2.5 py-0.5 rounded-lg">
                  {totalGirlsPhotos} Photos Available
                </span>
              </div>
              <h3 className="text-2xl font-extrabold font-serif text-white mb-2 group-hover:text-rose-300 transition-colors">
                Girls Campus Wing
              </h3>
              <p className="text-xs sm:text-sm text-rose-100/80 leading-relaxed mb-5">
                Safe, nurturing, highly secure wing featuring sunlit living quarters, recreation lawn, dedicated kitchen, dining hall, library lab, devotional prayer hall, and 24/7 female matron care.
              </p>

              {/* Facility Chips */}
              <div className="flex flex-wrap gap-1.5 mb-6 text-[11px] font-medium text-rose-200">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🛏️ Dormitories</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🏸 Sports & Lawn</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🍳 Cooking Center</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🍽️ Dining Hall</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">📚 Library Lab</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🙏 Prayer Hall</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">🚿 Private Restrooms</span>
              </div>
            </div>

            <button
              onClick={() => handleJumpToWing('girls')}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Jump to Girls Campus</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Wing Filter Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md py-3 border-y border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveWing('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
              activeWing === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Campus Wings ({totalPhotos} Photos)</span>
          </button>
          <button
            onClick={() => setActiveWing('boys')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
              activeWing === 'boys'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>👦 Boys Campus ({boysFacilities.length} Facilities)</span>
          </button>
          <button
            onClick={() => setActiveWing('girls')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
              activeWing === 'girls'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span>👧 Girls Campus ({girlsFacilities.length} Facilities)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Click any photo to view full-screen zoom
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. BOYS CAMPUS SECTION */}
      {/* ============================================================== */}
      {(activeWing === 'all' || activeWing === 'boys') && (
        <section id="boys-campus-section" className="scroll-mt-32 space-y-8">
          {/* Wing Title Bar */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-700/30">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <span>👦 Boys Residential Campus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
                Boys Campus Facilities
              </h2>
              <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
                Independent living quarters with sports arena, hygienic dining, kitchen, library, prayer hall, and sanitary washrooms.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 font-bold">
                {boysFacilities.length} Core Facilities
              </span>
              <span className="text-xs bg-blue-500/30 text-blue-200 px-3.5 py-1.5 rounded-xl border border-blue-400/30 font-bold">
                {totalBoysPhotos} Photos
              </span>
            </div>
          </div>

          {/* Boys Facilities Grid */}
          <div className="space-y-12">
            {boysFacilities.map((facility) => {
              const photos = getFacilityPhotos(facility);
              return (
                <div 
                  key={facility.id} 
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-6"
                >
                  {/* Facility Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                        {facility.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                            {facility.name}
                          </h3>
                          <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {facility.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                          {facility.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl">
                        {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                      {photos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenManageFacilityModal(facility)}
                          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 border border-rose-200 transition shadow-xs cursor-pointer"
                          title="Delete photos from this facility"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Photos ({photos.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isStaffOrAdmin) {
                            setLoginModalOpen(true);
                            return;
                          }
                          setPhotoWing('boys');
                          setPhotoFacilityKey(facility.category_slug || facility.id);
                          setNewPhotoModalOpen(true);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Feature Highlights Pills */}
                  {facility.features && facility.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {facility.features.map((feat, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center space-x-1.5 bg-slate-50 text-slate-700 border border-slate-200/80 px-3 py-1 rounded-xl font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Facility Photos Grid */}
                  {photos.length === 0 ? (
                    <div className="py-8 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">No photographs currently displayed for this facility.</p>
                      <button
                        onClick={() => {
                          if (!isStaffOrAdmin) {
                            setLoginModalOpen(true);
                            return;
                          }
                          setPhotoWing('boys');
                          setPhotoFacilityKey(facility.category_slug || facility.id);
                          setNewPhotoModalOpen(true);
                        }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Photograph</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {photos.map((photo, pIdx) => (
                        <div
                          key={photo.id || pIdx}
                          className="group relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                        >
                          {/* Direct Floating Delete Button on Photo */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo);
                            }}
                            className="absolute top-2.5 right-2.5 z-20 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-xl shadow-md transition flex items-center space-x-1 text-xs font-bold cursor-pointer"
                            title="Delete this photograph"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          <div
                            onClick={() => openFacilityLightbox(photos, pIdx)}
                            className="relative h-52 bg-slate-100 overflow-hidden cursor-pointer"
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
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/95 text-slate-900 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow">
                                <ZoomIn className="w-4 h-4 text-blue-600" />
                                <span>Click to Expand</span>
                              </span>
                            </div>
                            {/* Mobile Tap Zoom Hint */}
                            <div className="sm:hidden absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <ZoomIn className="w-3 h-3" />
                              <span>Tap zoom</span>
                            </div>
                          </div>

                          <div className="p-3.5 flex items-center justify-between">
                            <div className="pr-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                {photo.title || facility.name}
                              </h4>
                              {photo.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                  {photo.description}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex-shrink-0 cursor-pointer"
                              title="Delete photo from campus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 2. GIRLS CAMPUS SECTION */}
      {/* ============================================================== */}
      {(activeWing === 'all' || activeWing === 'girls') && (
        <section id="girls-campus-section" className="scroll-mt-32 space-y-8 pt-4">
          {/* Wing Title Bar */}
          <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-700/30">
            <div>
              <div className="inline-flex items-center space-x-2 bg-rose-500/20 text-rose-300 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <span>👧 Girls Residential Campus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
                Girls Campus Facilities
              </h2>
              <p className="text-rose-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
                Safe, private, and nurturing residential wing with dedicated lawn, kitchen, dining hall, library lab, prayer hall, and sanitized washrooms.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 font-bold">
                {girlsFacilities.length} Core Facilities
              </span>
              <span className="text-xs bg-rose-500/30 text-rose-200 px-3.5 py-1.5 rounded-xl border border-rose-400/30 font-bold">
                {totalGirlsPhotos} Photos
              </span>
            </div>
          </div>

          {/* Girls Facilities Grid */}
          <div className="space-y-12">
            {girlsFacilities.map((facility) => {
              const photos = getFacilityPhotos(facility);
              return (
                <div 
                  key={facility.id} 
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-6"
                >
                  {/* Facility Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                        {facility.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                            {facility.name}
                          </h3>
                          <span className="text-xs font-bold bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-100">
                            {facility.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                          {facility.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl">
                        {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                      </span>
                      {photos.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenManageFacilityModal(facility)}
                          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 border border-rose-200 transition shadow-xs cursor-pointer"
                          title="Delete photos from this facility"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Photos ({photos.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isStaffOrAdmin) {
                            setLoginModalOpen(true);
                            return;
                          }
                          setPhotoWing('girls');
                          setPhotoFacilityKey(facility.category_slug || facility.id);
                          setNewPhotoModalOpen(true);
                        }}
                        className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Feature Highlights Pills */}
                  {facility.features && facility.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {facility.features.map((feat, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center space-x-1.5 bg-slate-50 text-slate-700 border border-slate-200/80 px-3 py-1 rounded-xl font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Facility Photos Grid */}
                  {photos.length === 0 ? (
                    <div className="py-8 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">No photographs currently displayed for this facility.</p>
                      <button
                        onClick={() => {
                          if (!isStaffOrAdmin) {
                            setLoginModalOpen(true);
                            return;
                          }
                          setPhotoWing('girls');
                          setPhotoFacilityKey(facility.category_slug || facility.id);
                          setNewPhotoModalOpen(true);
                        }}
                        className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Photograph</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {photos.map((photo, pIdx) => (
                        <div
                          key={photo.id || pIdx}
                          className="group relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                        >
                          {/* Direct Floating Delete Button on Photo */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo);
                            }}
                            className="absolute top-2.5 right-2.5 z-20 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-xl shadow-md transition flex items-center space-x-1 text-xs font-bold cursor-pointer"
                            title="Delete this photograph"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          <div
                            onClick={() => openFacilityLightbox(photos, pIdx)}
                            className="relative h-52 bg-slate-100 overflow-hidden cursor-pointer"
                          >
                            <img
                              src={photo.image_url}
                              alt={photo.title || facility.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/95 text-slate-900 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow">
                                <ZoomIn className="w-4 h-4 text-rose-600" />
                                <span>Click to Expand</span>
                              </span>
                            </div>
                            {/* Mobile Tap Zoom Hint */}
                            <div className="sm:hidden absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <ZoomIn className="w-3 h-3" />
                              <span>Tap zoom</span>
                            </div>
                          </div>

                          <div className="p-3.5 flex items-center justify-between">
                            <div className="pr-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                {photo.title || facility.name}
                              </h4>
                              {photo.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                  {photo.description}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex-shrink-0 cursor-pointer"
                              title="Delete photo from campus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* ADMIN MODALS */}
      {/* ============================================================== */}

      {/* Add Custom Category Modal */}
      {newCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Add Campus Facility</h3>
              <button onClick={() => setNewCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Wing *</label>
                <select
                  value={newCatWing}
                  onChange={e => setNewCatWing(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="boys">👦 Boys Campus Wing</option>
                  <option value="girls">👧 Girls Campus Wing</option>
                  <option value="both">🏢 Both Wings</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Science Experiment Lab"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of the facility equipment and features..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewCatModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Facility Photo Modal */}
      {newPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Upload Facility Photograph</h3>
              <button onClick={() => setNewPhotoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePhoto} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Campus Wing *</label>
                <select
                  value={photoWing}
                  onChange={e => setPhotoWing(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="boys">👦 Boys Campus Wing</option>
                  <option value="girls">👧 Girls Campus Wing</option>
                  <option value="both">🏢 Both Wings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Category *</label>
                <select
                  value={photoFacilityKey}
                  onChange={e => setPhotoFacilityKey(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="rooms">🛏️ Dormitory & Living Quarters</option>
                  <option value="ground">⚽ Sports Ground & Play Arena</option>
                  <option value="kitchen">🍳 Kitchen & Food Prep</option>
                  <option value="dining">🍽️ Dining Hall</option>
                  <option value="study">📚 Study Lab & Library</option>
                  <option value="hall">🙏 Assembly & Prayer Hall</option>
                  <option value="washrooms">🚿 Washrooms & Sanitation</option>
                  {customCategories.map(c => (
                    <option key={c.id} value={c.category_slug}>🏢 {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={e => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Spacious Dining Tables"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Photo from Device (or Paste Image URL) *
                </label>
                
                {/* Mobile / Device File Picker */}
                <div className="mb-2">
                  <label className="inline-flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer border border-emerald-200 transition">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>{uploading ? 'Uploading from device...' : 'Choose from Gallery or Camera'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  required
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://... or uploaded file path"
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
                  placeholder="e.g. Daily seating arrangement for 120 students"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewPhotoModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Facility Photos Manager Modal */}
      {manageModalOpen && managingFacility && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Delete & Manage Photographs
                </span>
                <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
                  {managingFacility.name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setManageModalOpen(false);
                  setManagingFacility(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 text-xs text-slate-600 flex-shrink-0">
              <p>
                Delete any unwanted photographs below. Deleting removes the photograph from both public view and your administration list. You can restore default photographs anytime via the top banner button.
              </p>
            </div>

            {/* Quick Facility Switcher Dropdown */}
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex-shrink-0">
              <span className="text-xs font-bold text-slate-700">Choose Facility to Delete Photos From:</span>
              <select
                value={managingFacility.id}
                onChange={(e) => {
                  const target = [...boysFacilities, ...girlsFacilities].find(f => f.id === e.target.value);
                  if (target) setManagingFacility(target);
                }}
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 max-w-full sm:max-w-xs"
              >
                <optgroup label="👦 Boys Residential Campus">
                  {boysFacilities.map(f => (
                    <option key={f.id} value={f.id}>👦 {f.name} ({getFacilityPhotos(f).length} photos)</option>
                  ))}
                </optgroup>
                <optgroup label="👧 Girls Residential Campus">
                  {girlsFacilities.map(f => (
                    <option key={f.id} value={f.id}>👧 {f.name} ({getFacilityPhotos(f).length} photos)</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
              {getFacilityPhotos(managingFacility).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">No photographs currently present for this facility.</p>
                </div>
              ) : (
                getFacilityPhotos(managingFacility).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition gap-4"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {p.title || 'Photograph ' + (idx + 1)}
                        </h4>
                        {p.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {p.description}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          ID: {p.id || 'predefined'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition flex-shrink-0 cursor-pointer"
                      title="Delete this photograph"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Photo</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0 mt-3">
              <span className="text-xs text-slate-500">
                {getFacilityPhotos(managingFacility).length} photo(s) in this facility
              </span>
              <button
                type="button"
                onClick={() => {
                  setManageModalOpen(false);
                  setManagingFacility(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Viewer */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
        currentIndex={selectedPhotoIndex}
        setCurrentIndex={setSelectedPhotoIndex}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}
