import React, { useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Heart, Share2, X, Trophy, PartyPopper } from 'lucide-react';

export default function CelebrationBlastModal({
  isOpen,
  onClose,
  itemName = 'Hostel Need',
  donorName = 'Generous Well-Wisher',
  quantityDonated = 1,
  totalNeeded = 1,
  receiptNo = ''
}) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);

  // Play a celebratory musical chime fanfare using Web Audio API
  const playCelebrationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.18 }, // C5
        { freq: 659.25, time: 0.15, dur: 0.18 }, // E5
        { freq: 783.99, time: 0.30, dur: 0.22 }, // G5
        { freq: 1046.50, time: 0.48, dur: 0.60 }  // C6 (Triumphant high note)
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gain.gain.setValueAtTime(0, ctx.currentTime + time);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur);
      });
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  // Canvas confetti & fireworks blast particle simulation
  useEffect(() => {
    if (!isOpen) return;

    playCelebrationChime();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Particle colors: Emerald, Gold, Indigo, Rose, Cyan, Amber
    const colors = [
      '#10B981', '#F59E0B', '#6366F1', '#EC4899', 
      '#06B6D4', '#EAB308', '#8B5CF6', '#EF4444'
    ];

    const particles = [];
    const particleCount = 140;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 8 + Math.random() * 16;
      particles.push({
        x: width / 2,
        y: height * 0.4,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.35,
        friction: 0.96,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    // Secondary burst left and right
    for (let i = 0; i < 40; i++) {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.8;
      particles.push({
        x: width * 0.15,
        y: height * 0.6,
        vx: Math.cos(angle) * (10 + Math.random() * 12),
        vy: Math.sin(angle) * (10 + Math.random() * 12),
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        gravity: 0.3,
        friction: 0.96,
        shape: 'rect'
      });
    }
    for (let i = 0; i < 40; i++) {
      const angle = (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.8;
      particles.push({
        x: width * 0.85,
        y: height * 0.6,
        vx: Math.cos(angle) * (10 + Math.random() * 12),
        vy: Math.sin(angle) * (10 + Math.random() * 12),
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        gravity: 0.3,
        friction: 0.96,
        shape: 'rect'
      });
    }

    let startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, p.alpha - 0.007);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (Date.now() - startTime < 4000) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Fullscreen Confetti Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Main Celebratory Modal Dialog */}
      <div className="relative z-20 bg-gradient-to-b from-white via-amber-50/30 to-emerald-50/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-emerald-400 text-center overflow-hidden">
        {/* Decorative Top Radial Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-emerald-400/30 via-amber-300/30 to-pink-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-white/80 p-2 rounded-full border border-slate-200 shadow-xs transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Trophy & Blast Badge */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping duration-1000" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-500 p-1 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl">
              🎉
            </div>
          </div>
        </div>

        {/* The Exact Requested Fulfillment Statement */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-black text-xs uppercase px-3.5 py-1 rounded-full shadow-xs tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Goal Achieved 100%</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 tracking-tight leading-tight">
            By your contribution, this need is fulfilled!
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Heartfelt gratitude to <strong className="text-emerald-800">{donorName}</strong>! Because of your kind and generous heart, this vital hostel requirement has been completely met for our children.
          </p>
        </div>

        {/* Fulfilled Need Card */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-emerald-200/90 shadow-md text-left space-y-3 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                100% Fulfilled Requirement
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {itemName}
              </h4>
            </div>
            <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fulfilled</span>
            </div>
          </div>

          {/* Progress Bar 100% */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Goal Progress:</span>
              <span className="text-emerald-700 font-bold">100% Complete</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-full rounded-full animate-pulse" />
            </div>
          </div>

          {receiptNo && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Official Reference No:</span>
              <span className="font-mono font-bold text-blue-600">{receiptNo}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/919059491777?text=${encodeURIComponent(
              `Hello Brother Nelson A! I am thrilled to share that by my contribution of "${itemName}", this need has been fulfilled for RISE A CHILD CHILDREN HOME! (Ref: ${receiptNo || 'RAC'}, Name: ${donorName}). Wishing all the children love and blessings!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Blessing on WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Done & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
