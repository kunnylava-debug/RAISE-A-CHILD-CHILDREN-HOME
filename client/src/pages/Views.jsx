import React, { useState, useEffect } from 'react';
import { 
  Image, Plus, Trash2, ZoomIn, FolderPlus, 
  Upload, X, Layers, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import LightboxModal from '../components/LightboxModal';

export default function Views({ onShowToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Admin modals
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newPhotoModalOpen, setNewPhotoModalOpen] = useState(false);
  const [photoCatId, setPhotoCatId] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const { adminUser } = useAdminAuth();

  const fetchViews = () => {
    setLoading(true);
    api.getViews()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchViews();
  }, []);

  const openCategoryLightbox = (photos, index) => {
    setLightboxPhotos(photos);
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.createCategory({ name: newCatName, description: newCatDesc });
      onShowToast?.({ type: 'success', message: 'Facility category added successfully' });
      setNewCatName('');
      setNewCatDesc('');
      setNewCatModalOpen(false);
      fetchViews();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    try {
      await api.addPhoto({
        category_id: photoCatId,
        title: photoTitle,
        description: photoDesc,
        image_url: photoUrl
      });
      onShowToast?.({ type: 'success', message: 'Photo uploaded to category' });
      setPhotoTitle('');
      setPhotoDesc('');
      setPhotoUrl('');
      setNewPhotoModalOpen(false);
      fetchViews();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this photograph?')) return;
    try {
      await api.deletePhoto(id);
      onShowToast?.({ type: 'success', message: 'Photo deleted' });
      fetchViews();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete entire category "${name}" and all its photos?`)) return;
    try {
      await api.deleteCategory(id);
      onShowToast?.({ type: 'success', message: 'Category deleted' });
      fetchViews();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  const filteredCategories = activeCategorySlug === 'all'
    ? categories
    : categories.filter(c => c.slug === activeCategorySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Image className="w-3.5 h-3.5" />
            <span>Campus Infrastructure & Facilities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Hostel Views & Infrastructure
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
            Take a visual tour of our clean dormitories, hygienic dining halls, sports fields, modern kitchen, and learning centers.
          </p>
        </div>

        {adminUser && (
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              onClick={() => setNewCatModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>Add Category</span>
            </button>
            <button
              onClick={() => {
                if (categories.length > 0) {
                  setPhotoCatId(categories[0].id);
                }
                setNewPhotoModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setActiveCategorySlug('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeCategorySlug === 'all'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Facilities ({(Array.isArray(categories) ? categories : []).reduce((acc, c) => acc + (c.photos?.length || 0), 0)} Photos)
        </button>
        {(Array.isArray(categories) ? categories : []).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategorySlug(cat.slug)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 ${
              activeCategorySlug === cat.slug
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{cat.name}</span>
            <span className="text-[11px] opacity-75">({cat.photos?.length || 0})</span>
          </button>
        ))}
      </div>

      {/* Categorized Photo Sections */}
      {loading ? (
        <div className="space-y-12 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {(Array.isArray(filteredCategories) ? filteredCategories : []).map((category) => (
            <section key={category.id} className="space-y-5">
              {/* Category Title & Controls */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 flex items-center">
                    <span>{category.name}</span>
                    <span className="ml-3 text-xs bg-emerald-100 text-emerald-800 font-sans font-bold px-2.5 py-0.5 rounded-full">
                      {category.photos?.length || 0} Photos
                    </span>
                  </h2>
                  {category.description && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
                      {category.description}
                    </p>
                  )}
                </div>

                {adminUser && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPhotoCatId(category.id);
                        setNewPhotoModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg"
                    >
                      + Add Photo
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="text-xs text-rose-600 hover:text-rose-800 p-1"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Photos Grid */}
              {category.photos?.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-xs text-slate-500">
                  No photos uploaded for this facility yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(Array.isArray(category.photos) ? category.photos : []).map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    >
                      <div
                        onClick={() => openCategoryLightbox(category.photos, index)}
                        className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={photo.image_url}
                          alt={photo.title || category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Click to Zoom</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {photo.title || category.name}
                          </h4>
                          {photo.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {photo.description}
                            </p>
                          )}
                        </div>

                        {adminUser && (
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Admin Add Category Modal */}
      {newCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Add Facility Category</h3>
              <button onClick={() => setNewCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Science Lab & Innovation Center"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of the facility..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewCatModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Upload Photo Modal */}
      {newPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-serif">Upload Facility Photograph</h3>
              <button onClick={() => setNewPhotoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPhoto} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Facility Category *</label>
                <select
                  value={photoCatId}
                  onChange={e => setPhotoCatId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  placeholder="e.g. Spacious Dining Seating"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photograph Image URL *</label>
                <input
                  type="text"
                  required
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={photoDesc}
                  onChange={e => setPhotoDesc(e.target.value)}
                  placeholder="e.g. Capacity to seat 140 students simultaneously"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setNewPhotoModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700"
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

      {/* Lightbox Viewer */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={lightboxPhotos}
        currentIndex={selectedPhotoIndex}
        setCurrentIndex={setSelectedPhotoIndex}
      />
    </div>
  );
}
