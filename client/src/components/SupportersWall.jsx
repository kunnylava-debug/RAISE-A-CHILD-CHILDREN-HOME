import React from 'react';
import { Heart, Plus, Edit3, Trash2 } from 'lucide-react';

export default function SupportersWall({ supporters, adminUser, onAddSupporter, onEditSupporter, onDeleteSupporter }) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Wall of Gratitude</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            People Who Supported Us
          </h2>
          <p className="text-slate-600 text-sm mt-1 max-w-xl">
            We extend our deepest appreciation to our generous patrons, medical benefactors, and educational sponsors.
          </p>
        </div>

        {adminUser && (
          <button
            onClick={onAddSupporter}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supporter Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {supporters.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between space-y-4 hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <img
                  src={sup.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                  alt={sup.name}
                  className="w-14 h-14 rounded-full object-cover shadow border-2 border-emerald-100 flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-slate-900 font-serif leading-tight">
                    {sup.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sup.occupation || 'Community Patron'}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border-l-2 border-emerald-600 p-2.5 rounded-r-lg">
                <span className="text-[11px] font-bold text-emerald-900 block uppercase tracking-wider">
                  Contribution:
                </span>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  {sup.support_type}
                </p>
              </div>

              {sup.message && (
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{sup.message}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{sup.date_supported || 'Valued Supporter'}</span>
              {adminUser && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditSupporter(sup)}
                    className="text-slate-500 hover:text-emerald-700 p-1"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteSupporter(sup.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
