import React, { useState } from 'react';
import { 
  Save, UserCheck, Video, Upload, CheckCircle, 
  AlertCircle, Film, Layers
} from 'lucide-react';
import { api } from '../../services/api';
import VideoPlayer from '../../components/VideoPlayer';

// Standard Hostel Video Templates
const DEFAULT_VIDEO_TEMPLATES = [
  {
    id: 'documentary',
    name: 'Hostel Documentary & Campus Life',
    description: 'Main feature documentary showing children living, studying, and growing together at the hostel.',
    video_title: 'A Message & Documentary From Our Hostel',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    video_poster: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'routine',
    name: 'Children Daily Routine & Study Hours',
    description: 'Shows morning prayers, school preparation, evening tutoring, and quiet study times.',
    video_title: 'A Day in the Life of Our Children',
    video_url: '',
    video_poster: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cultural',
    name: 'Festivals & Cultural Celebrations',
    description: 'Festive celebrations, Independence Day, Christmas, and children singing & dancing.',
    video_title: 'Joy & Celebrations at Rise a Child',
    video_url: '',
    video_poster: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sports',
    name: 'Sports, Games & Physical Wellness',
    description: 'Outdoor athletic activities, football, yoga, and children playground moments.',
    video_title: 'Sports & Playtime Moments',
    video_url: '',
    video_poster: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'tour',
    name: 'Campus Tour & Facilities Walkthrough',
    description: 'Walkthrough of dormitories, study halls, kitchen, dining area, and safe surroundings.',
    video_title: 'Campus Tour & Resident Facilities',
    video_url: '',
    video_poster: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80'
  }
];

export default function AdminFounderVideoTab({ settings, onRefreshSettings, onShowToast }) {
  const [form, setForm] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  // Video Upload State
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Video Templates State
  let initialTemplates = DEFAULT_VIDEO_TEMPLATES;
  try {
    if (settings.video_templates) {
      initialTemplates = typeof settings.video_templates === 'string' 
        ? JSON.parse(settings.video_templates) 
        : settings.video_templates;
    }
  } catch {}

  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(form.active_video_template || 'documentary');

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Handle Direct Video Upload from Mobile/Desktop Gallery
  const handleVideoFileSelect = async (e, targetTemplateId = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess('');

    try {
      // 1. Validation
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_SIZE) {
        throw new Error(`Video exceeds 100MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a shorter or compressed video.`);
      }

      // 2. Upload with live progress callback
      const res = await api.uploadVideo(file, (percent) => {
        setUploadProgress(percent);
      });

      const videoUrl = res.url;
      setUploadSuccess(`Video "${file.name}" uploaded successfully! Playable immediately.`);

      // Update active video URL
      handleChange('video_url', videoUrl);

      // If associated with a template, also update that template
      if (targetTemplateId) {
        setTemplates(prev => prev.map(t => t.id === targetTemplateId ? { ...t, video_url: videoUrl } : t));
      } else {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, video_url: videoUrl } : t));
      }

      onShowToast?.({
        type: 'success',
        title: 'Video Uploaded from Gallery',
        message: 'Your video is now stored and ready for immediate playback.'
      });
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video from gallery.');
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setUploadingVideo(false);
    }
  };

  // Switch Active Video Template
  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setForm(prev => ({
      ...prev,
      active_video_template: tpl.id,
      video_title: tpl.video_title || tpl.name,
      video_url: tpl.video_url || prev.video_url,
      video_poster: tpl.video_poster || prev.video_poster
    }));
    onShowToast?.({
      type: 'info',
      title: 'Video Template Selected',
      message: `Active video template switched to "${tpl.name}". Click "Save Changes" to publish.`
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        video_templates: JSON.stringify(templates),
        active_video_template: selectedTemplateId
      };
      await api.updateSettings(payload);
      onShowToast?.({ 
        type: 'success', 
        title: 'Settings Saved',
        message: 'Founder, gallery video, and template configurations saved successfully!' 
      });
      onRefreshSettings?.();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const _currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-xs sm:text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Founder & Video Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage founder biography, gallery video uploads with live playback, and video templates.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || uploadingVideo}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow flex items-center space-x-2 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* 1. FOUNDER DETAILS SECTION */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <UserCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
          <span>Founder Section Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Founder Full Name</label>
            <input
              type="text"
              value={form.founder_name || ''}
              onChange={e => handleChange('founder_name', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Founder Role / Title</label>
            <input
              type="text"
              value={form.founder_role || ''}
              onChange={e => handleChange('founder_role', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Photograph URL</label>
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500 overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
              <img
                src={form.founder_photo || "/founder_square.jpg"}
                alt="Founder Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/founder_square.jpg"; }}
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={form.founder_photo || ''}
                onChange={e => handleChange('founder_photo', e.target.value)}
                placeholder="/founder_square.jpg"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: /founder_square.jpg (Official enhanced portrait of BRO.NELSON A)</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Biography & Background</label>
          <textarea
            rows="3"
            value={form.founder_bio || ''}
            onChange={e => handleChange('founder_bio', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Founder Vision Quote</label>
          <input
            type="text"
            value={form.founder_vision || ''}
            onChange={e => handleChange('founder_vision', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Message to Children, Parents & Supporters</label>
          <textarea
            rows="3"
            value={form.founder_message || ''}
            onChange={e => handleChange('founder_message', e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. DIRECT VIDEO UPLOAD FROM GALLERY SECTION (REQUIREMENT 4) */}
      <div className="space-y-5 pt-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Video className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Direct Video Upload from Gallery</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or record a video directly from your mobile gallery or computer to upload into hostel storage.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
            Max 100MB • MP4 / WebM / MOV / MKV
          </span>
        </div>

        {/* Gallery Video Upload Dropzone */}
        <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 text-center bg-emerald-50/30 hover:bg-emerald-50/50 transition">
          <Film className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Choose Video from Phone Gallery or Desktop Storage
          </h4>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Upload genuine campus footage, children activities, or founder messages. The uploaded video will be playable immediately.
          </p>

          <input
            type="file"
            accept="video/*"
            id="gallery-video-file-picker"
            onChange={(e) => handleVideoFileSelect(e)}
            disabled={uploadingVideo}
            className="hidden"
          />
          <label
            htmlFor="gallery-video-file-picker"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm cursor-pointer shadow-md transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploadingVideo ? 'Uploading from Gallery...' : 'Select Video from Gallery'}</span>
          </label>

          {/* Upload Progress Bar */}
          {uploadingVideo && (
            <div className="mt-5 max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-800">
                <span>Uploading video to server storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-200" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Status Alerts */}
          {uploadError && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2 max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2 max-w-lg mx-auto">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        {/* Video Fields & Live Playback Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Video Title</label>
              <input
                type="text"
                value={form.video_title || ''}
                onChange={e => handleChange('video_title', e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Active Video URL (Gallery Upload URL or YouTube Link)
              </label>
              <input
                type="text"
                value={form.video_url || ''}
                onChange={e => handleChange('video_url', e.target.value)}
                placeholder="e.g. /uploads/video-...mp4 or https://youtube.com/..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Automatically updated when you upload a video from your gallery.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Video Cover Poster Image URL</label>
              <input
                type="text"
                value={form.video_poster || ''}
                onChange={e => handleChange('video_poster', e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Immediate Live Playback Preview */}
          <div className="space-y-2">
            <span className="block font-semibold text-slate-700 text-xs">
              Live Playback Preview (Direct Player)
            </span>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-sm aspect-video">
              <VideoPlayer
                videoUrl={form.video_url}
                posterUrl={form.video_poster}
                title={form.video_title || "Hostel Video Preview"}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              This exact video player appears on the public website home page.
            </p>
          </div>
        </div>
      </div>

      {/* 3. VIDEO TEMPLATES SECTION (REQUIREMENT 5) */}
      <div className="space-y-5 pt-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Video Templates Management</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or assign gallery videos to curated video templates. You can switch the featured template anytime.
            </p>
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tpl => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between space-y-3 ${
                  isSelected 
                    ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      Template
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active Live
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-mono text-slate-600 truncate bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    {tpl.video_url ? (
                      <span className="text-emerald-700">✓ Video Attached</span>
                    ) : (
                      <span className="text-amber-600">No video attached</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition text-center ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Currently Selected' : 'Activate Template'}
                    </button>

                    {/* Direct Gallery Upload for this specific template */}
                    <label
                      htmlFor={`tpl-upload-${tpl.id}`}
                      className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-xl cursor-pointer transition flex items-center"
                      title="Upload video from gallery to this template"
                    >
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="video/*"
                        id={`tpl-upload-${tpl.id}`}
                        onChange={(e) => handleVideoFileSelect(e, tpl.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Footer */}
      <div className="pt-6 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={loading || uploadingVideo}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition disabled:opacity-50"
        >
          {loading ? 'Saving Changes...' : 'Save Founder & Video Settings'}
        </button>
      </div>
    </form>
  );
}
