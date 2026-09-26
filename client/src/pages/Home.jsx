import React, { useState, useEffect } from 'react';
import { 
  Heart, Shield, BookOpen, Award, Users, User, ChevronRight, 
  Sparkles, Calendar, ArrowRight, Play, Quote, CheckCircle2,
  MapPin, Navigation, GraduationCap, Briefcase, ExternalLink, Phone, ShieldCheck,
  School, Compass, Camera
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import LightboxModal from '../components/LightboxModal';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Home({ setActiveTab, settings, onShowToast }) {
  const { adminUser } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [childrenStats, setChildrenStats] = useState({ total: 0, boys: 0, girls: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [heroLightboxOpen, setHeroLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    api.getEvents().then(data => setEvents(Array.isArray(data) ? data : [])).catch(() => setEvents([]));
    api.getAlumni().then(data => setAlumni(Array.isArray(data) ? data : [])).catch(() => setAlumni([]));
    api.getChildren({ limit: 1 }).then(data => {
      if (data && typeof data.total_children === 'number') {
        setChildrenStats({
          total: data.total_children ?? 0,
          boys: data.boys_count ?? 0,
          girls: data.girls_count ?? 0
        });
      }
    }).catch(() => {});
  }, []);

  const openLightbox = (index) => {
    setSelectedPhotoIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION (Clean, Prestigious Navy/Royal Blue/Amber palette with prominent Logo at top) */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[600px] sm:min-h-[660px] flex items-center">
        {/* Realistic Hostel Background Image - High clarity, all members visible, right side dulled as requested */}
        <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Ambient matching backdrop for seamless ultra-wide coverage */}
          <img
            src={settings?.hero_image || "/hero_group_hd.jpg"}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-105 pointer-events-none"
          />

          {/* Sharp High-Definition Group Photo containing ALL members without cropping */}
          <img
            src={settings?.hero_image || "/hero_group_hd.jpg"}
            alt="All Resident Children, Founder BRO.NELSON A, and Staff of RISE A CHILD CHILDREN HOME"
            className="w-full h-full object-contain sm:object-cover sm:object-[18%_35%] lg:object-contain object-center transition-all duration-700"
          />

          {/* DULL THE RIGHT SIDE as requested by user ("dull the right side as in the previous") */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />

          {/* Soft top & bottom edge vignettes to smoothly blend header & census card */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />
        </div>

        {/* Quick Admin Shortcut to change Background Photo & Inspect Photo */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setHeroLightboxOpen(true)}
            className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 backdrop-blur-md border border-white/20 transition shadow-lg cursor-pointer"
            title="Inspect full hostel family photo in Ultra HD"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inspect Family Photo (Ultra HD)</span>
            <span className="sm:hidden">Inspect Photo</span>
          </button>
          {adminUser && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="bg-slate-900/80 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 backdrop-blur-md border border-white/20 transition shadow-lg cursor-pointer"
              title="Open Admin Settings to edit hero photo or logo"
            >
              <span>Edit Background</span>
            </button>
          )}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6 sm:space-y-7">
            
            {/* Prominent Official Logo & Accreditation Badge at the very top of Hero */}
            <div className="inline-flex flex-wrap items-center gap-3 bg-slate-950/75 backdrop-blur-md border border-white/20 p-2 sm:pr-5 rounded-2xl sm:rounded-full shadow-2xl">
              {/* Prominent Emblem / Logo */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-full bg-white p-1 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-amber-400">
                <img
                  src={settings?.logo_url || "/logo.png"}
                  alt={settings?.hostel_name || "Official Hostel Logo"}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-bold tracking-wide text-white drop-shadow-sm">
                    {settings?.hostel_name || "RISE A CHILD CHILDREN HOME"}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    Official Portal
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Government Registered • Open for All Classes & Educational Stages</span>
                </div>
              </div>
            </div>

            {/* Welcoming Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-serif tracking-tight text-white leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]">
              {settings?.hostel_headline || "Welcome to RISE A CHILD CHILDREN HOME"}
            </h1>

            {/* Sub-headline: Explicitly for ALL students */}
            <div className="flex items-center space-x-2 text-amber-300 text-sm sm:text-base font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              <School className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Inclusive Residential Campus: Primary • Secondary • Higher Secondary (11-12) • College & Vocational</span>
            </div>

            {/* Introduction */}
            <p className="text-base sm:text-xl text-white leading-relaxed font-normal max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {settings?.hostel_intro || 
                "A safe, caring, and supportive residential home for students and youths of all ages to learn, grow, and build their future. Providing quality accommodation, wholesome nutrition, disciplined study coaching, and warmth for every educational stage."}
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('vision-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-900/50 hover:shadow-blue-800/70 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <span>Explore Our Hostel</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('admissions')}
                className="bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/30 font-semibold px-6 py-3.5 rounded-xl transition-all flex items-center space-x-2 shadow-md"
              >
                <span>Admissions 2026 (All Classes)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('needed')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-amber-950/30"
              >
                <Heart className="w-4 h-4 fill-slate-950" />
                <span>Support Us</span>
              </button>

              <button
                type="button"
                onClick={() => setHeroLightboxOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-400/30 font-semibold px-5 py-3.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer"
                title="View full group photo of all resident children and founder in Ultra HD"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>All Members View (Ultra HD)</span>
              </button>
            </div>

            {/* Quick Metrics Bar - Prominently Displaying Total, Boys, and Girls on Mobile & Desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/20">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-white/15 text-left shadow-lg">
                <span className="block text-2xl sm:text-3xl font-extrabold text-blue-300">{childrenStats.total}</span>
                <span className="text-[11px] sm:text-xs text-slate-200 font-medium">Total Resident Children</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-white/15 text-left shadow-lg">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-300">{childrenStats.boys}</span>
                <span className="text-[11px] sm:text-xs text-slate-200 font-medium">👦 Boys Wing</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-white/15 text-left shadow-lg">
                <span className="block text-2xl sm:text-3xl font-extrabold text-pink-300">{childrenStats.girls}</span>
                <span className="text-[11px] sm:text-xs text-slate-200 font-medium">👧 Girls Wing</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-white/15 text-left shadow-lg">
                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-300">100%</span>
                <span className="text-[11px] sm:text-xs text-slate-200 font-medium">🎓 School & College</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RESIDENTIAL STUDENT CENSUS BANNER (Mobile-first responsive card) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30 shadow-inner">
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">Hostel Population Census</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">Verified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-white mt-0.5">
                Total Children Enrolled: <span className="text-emerald-300">{childrenStats.total}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Full residential care, nutrition, schooling & character development for boys and girls.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-white/15 text-center flex-1 md:flex-initial">
              <div className="px-2 text-left">
                <span className="block text-xl sm:text-2xl font-extrabold text-blue-300">{childrenStats.boys}</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider">Boys Wing</span>
              </div>
              <div className="px-2 border-l border-white/20 text-left">
                <span className="block text-xl sm:text-2xl font-extrabold text-pink-300">{childrenStats.girls}</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider">Girls Wing</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('children')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-md flex-shrink-0"
            >
              <span>View Directory</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. VISION SECTION WITH GLASSY CARDS (Royal Navy & Blue theme) */}
      <section id="vision-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          {/* Subtle decorative glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Our Guiding Purpose</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold font-serif">
              Our Vision & Mission
            </h2>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/15">
              <Quote className="w-8 h-8 text-amber-400/70 mx-auto mb-3" />
              <p className="text-lg sm:text-2xl text-slate-100 font-serif leading-relaxed italic">
                "{settings?.vision_statement || 'Provide a safe, caring, disciplined and supportive environment where students of all ages and backgrounds can learn, grow and develop into responsible, self-reliant individuals.'}"
              </p>
            </div>

            {/* 4 Core Pillars with Glassy Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-left">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition shadow-sm">
                <Shield className="w-6 h-6 text-blue-300 mb-2" />
                <h3 className="font-bold text-sm text-white mb-1">Safety & Full Care</h3>
                <p className="text-xs text-slate-200">24/7 guardian security, qualified resident wardens, and a protected, peaceful atmosphere.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition shadow-sm">
                <BookOpen className="w-6 h-6 text-teal-300 mb-2" />
                <h3 className="font-bold text-sm text-white mb-1">All-Stage Education</h3>
                <p className="text-xs text-slate-200">From early schooling to Class 12, college graduation, and technical vocational skill coaching.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition shadow-sm">
                <Heart className="w-6 h-6 text-amber-300 mb-2" />
                <h3 className="font-bold text-sm text-white mb-1">Nutrition & Wellness</h3>
                <p className="text-xs text-slate-200">Nutritious wholesome meals, daily sports, yoga, and regular medical/dental checkups.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition shadow-sm">
                <Award className="w-6 h-6 text-emerald-300 mb-2" />
                <h3 className="font-bold text-sm text-white mb-1">Character & Leadership</h3>
                <p className="text-xs text-slate-200">Mutual respect, community service, civic awareness, and self-confidence for life.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUNDER & EVENTS SECTION (Refined Navy & Royal Blue styling) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Leadership & Campus Life
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Meet the driving vision behind our foundation and witness the joyful milestones of our students.
          </p>
        </div>

        {/* 2-Column Equal Height Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Founder Section */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                    About The Founder
                  </span>
                  <Award className="w-5 h-5 text-blue-600" />
                </div>

                {/* Founder Photo */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
                  <div className="relative group flex-shrink-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl">
                      <img
                        src={settings?.founder_photo || "/founder_square.jpg"}
                        alt={settings?.founder_name || "BRO.NELSON A - Founder"}
                        onError={(e) => {
                          e.currentTarget.src = "/founder_square.jpg";
                        }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-slate-900 font-serif">
                      {settings?.founder_name || "BRO.NELSON A"}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mt-0.5">
                      {settings?.founder_role || "Founder & Managing Trustee"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      "20+ years dedicated to child welfare, education, and youth empowerment."
                    </p>
                  </div>
                </div>

                {/* Biography */}
                <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    {settings?.founder_bio || 
                      "BRO.NELSON A dedicated over 20 years to child welfare, youth development, and educational reform. Having witnessed the struggles of disadvantaged students deprived of schooling and stable care, he established RISE A CHILD CHILDREN HOME with a heartfelt mission to ensure every child receives loving shelter, education, and moral guidance."}
                  </p>
                  
                  {/* Founder Vision */}
                  <div className="bg-blue-50/80 border-l-4 border-blue-600 p-3.5 rounded-r-xl">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Founder's Philosophy
                    </h4>
                    <p className="text-xs text-blue-800 italic">
                      "{settings?.founder_vision || "Every learner possesses boundless potential. When provided with a secure shelter, balanced food, books, and genuine affection, they flourish into confident leaders."}"
                    </p>
                  </div>

                  {/* Message */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 shadow-xs">
                    <span className="font-bold text-slate-900 block mb-1">
                      Message to Students, Parents & Supporters:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      "{settings?.founder_message || "To our students: this home is your family. Dream without fear. To our revered guardians: trust us with your hope. And to our generous supporters: your kindness is the light that illuminates their path."}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">RISE A CHILD CHILDREN HOME Trust</span>
                <button 
                  onClick={() => setActiveTab('staff')}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
                >
                  <span>Meet Our Complete Staff</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Events / Gallery Section */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full border border-slate-200 shadow-sm hover:shadow-xl transition-all">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                      Events & Gallery
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 font-serif">
                      Life & Celebrations at Hostel
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('views')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
                  >
                    <span>View All Facilities</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {(Array.isArray(events) ? events : []).slice(0, 6).map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => openLightbox(idx)}
                      className="group relative h-36 sm:h-40 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md border border-slate-200 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <span className="inline-block text-[10px] font-bold bg-blue-600/90 px-1.5 py-0.5 rounded text-white mb-0.5">
                          {item.category || 'Event'}
                        </span>
                        <h4 className="text-xs font-semibold leading-tight line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Event Highlights snippet */}
                <div className="mt-4 bg-blue-50/70 rounded-xl p-3.5 border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Recent: Annual Sports, Independence Day, Science Exhibition & Cultural Fest</span>
                  </div>
                  <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => openLightbox(0)}>
                    Click image to expand
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{events.length} Recorded Milestone Celebrations</span>
                <button
                  onClick={() => setActiveTab('views')}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold transition"
                >
                  Explore Campus Galleries
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VIDEO SECTION (REQUIREMENT 1: Positioned UPPER than the students who have left / Alumni) */}
      <section id="video-section" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl overflow-hidden text-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Play className="w-3.5 h-3.5 fill-blue-800" />
              <span>Campus Documentary & Video Tour</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              {settings?.video_title || "A Message & Documentary From Our Hostel"}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Experience our students' daily routine, study halls, wholesome dining, and warm community life in their own heartfelt words.
            </p>
          </div>

          {/* Embedded HTML5 Video Player */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
            <VideoPlayer
              videoUrl={settings?.video_url}
              posterUrl={settings?.video_poster}
              title={settings?.video_title || "A Message From Our Hostel"}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>High Definition 1080p Documentary</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Authentic Campus Daily Routine</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Student & Teacher Testimonials</span>
            </span>
          </div>
        </div>
      </section>

      {/* 5. WHERE ARE THEY NOW? — ALUMNI SUCCESS STORIES (Positioned immediately below Video) */}
      <section id="alumni-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Where Are They Now? • People Who Left From Home Until Now</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-slate-900">
            People Who Left From Home Until Now
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Witness how the care, discipline, and education received at our hostel empowered these individuals who left from our home until now to build inspiring, self-reliant careers across diverse professions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!Array.isArray(alumni) || alumni.length === 0 ? (
            <div className="col-span-full py-12 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 shadow-xs">
              <GraduationCap className="w-10 h-10 text-blue-500/70 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Alumni Records & Success Stories</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Profiles of youths and students who graduated or left our home will be displayed here once added via the Admin Dashboard.
              </p>
              <button
                onClick={() => setActiveTab('admin')}
                className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5"
              >
                <span>Go to Admin Panel</span>
              </button>
            </div>
          ) : (
            alumni.map((al) => (
              <div 
                key={al.id}
                className="glass-card rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden">
                      {al.photo_url ? (
                        <img 
                          src={al.photo_url}
                          alt={al.name}
                          className="w-full h-full object-cover rounded-[14px]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        style={{ display: al.photo_url ? 'none' : 'flex' }}
                        className="w-full h-full bg-slate-100 rounded-[14px] flex items-center justify-center text-slate-400"
                      >
                        <User className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {al.name}
                      </h3>
                      <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mt-0.5">
                        Hostel Stay: {al.stay_years}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-start space-x-2 text-xs font-bold text-slate-900">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{al.current_position}</span>
                    </div>
                    {al.location && (
                      <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{al.location}</span>
                      </div>
                    )}
                  </div>

                  {al.quote && (
                    <div className="text-xs text-slate-600 italic border-l-2 border-blue-400 pl-3 leading-relaxed">
                      "{al.quote}"
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Self-Reliant Professional</span>
                  </span>
                  <span className="text-blue-600 font-semibold text-[11px]">Left From Home • Independent</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Lightbox for Events */}
      <LightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={events}
        currentIndex={selectedPhotoIndex}
        setCurrentIndex={setSelectedPhotoIndex}
      />

      {/* Lightbox for Full Hostel Family Group Photo */}
      <LightboxModal
        isOpen={heroLightboxOpen}
        onClose={() => setHeroLightboxOpen(false)}
        photos={[{
          image_url: '/hero_group_panoramic.jpg',
          title: 'RISE A CHILD CHILDREN HOME — Official Hostel Family',
          description: 'Resident children, Founder BRO.NELSON A, and dedicated caregivers & staff in Mannar Polur, Sullurpeta.'
        }]}
        currentIndex={0}
      />
    </div>
  );
}
