import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LightboxModal({ isOpen, onClose, photos = [], currentIndex = 0, setCurrentIndex }) {
  if (!isOpen || photos.length === 0) return null;

  const current = photos[currentIndex] || photos[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  const handleNext = () => {
    if (setCurrentIndex) {
      setCurrentIndex((currentIndex + 1) % photos.length);
    }
  };

  const handlePrev = () => {
    if (setCurrentIndex) {
      setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition focus:outline-none"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition focus:outline-none"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition focus:outline-none"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div className="max-w-5xl max-h-[88vh] flex flex-col items-center justify-center">
        <img
          src={current.image_url || current.url}
          alt={current.title || 'Hostel photograph'}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
        />

        {/* Caption & Counter */}
        <div className="mt-4 text-center text-white px-4 max-w-2xl">
          <h4 className="text-lg font-bold">
            {current.title || 'Hostel View'}
          </h4>
          {current.description && (
            <p className="text-sm text-slate-300 mt-1">
              {current.description}
            </p>
          )}
          {photos.length > 1 && (
            <span className="inline-block mt-2 text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full">
              {currentIndex + 1} of {photos.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
