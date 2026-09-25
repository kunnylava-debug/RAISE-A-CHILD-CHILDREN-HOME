import React, { useState } from 'react';
import { Gift, Plus, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

export default function NeededItemsTable({ neededItems, adminUser, onPledge, onAddNeed, onEditNeed, onDeleteNeed }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Gift className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hostel Material & Resource Needs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900">
            Current Hostel Needs & Requirements
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
            Support our resident children by sponsoring specific educational supplies, dormitory beds, or medical equipment.
          </p>
        </div>

        {adminUser && (
          <button
            onClick={onAddNeed}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Needed Item</span>
          </button>
        )}
      </div>

      {/* MOBILE VIEW: Clean Responsive Cards (Fits 100% of mobile width) */}
      <div className="md:hidden space-y-3.5">
        {(Array.isArray(neededItems) ? neededItems : []).map((item, index) => {
          const isFulfilled = item.quantity_received >= item.quantity_needed || item.is_fulfilled;
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border p-4 shadow-sm space-y-3 transition ${
                isFulfilled ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    #{index + 1} • {item.category}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.item_name}</h4>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  )}
                </div>

                <div>
                  {isFulfilled ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px] flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Fulfilled
                    </span>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.urgency || 'Needed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Quantity</span>
                  <span className="font-bold text-slate-800">{item.quantity_needed} needed</span>
                  <span className="text-[11px] text-slate-500 block">({item.quantity_received} received)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Estimated Cost</span>
                  <span className="font-extrabold text-emerald-800 font-mono text-sm block">
                    ₹{item.estimated_price?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {adminUser && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditNeed(item)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg text-xs"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNeed(item.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => onPledge(item)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm ml-auto"
                >
                  Pledge / Donate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Full Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-6 w-16">S.No</th>
                <th className="py-4 px-6">Needed Item</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Quantity</th>
                <th className="py-4 px-6">Estimated Price</th>
                <th className="py-4 px-6">Urgency</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Array.isArray(neededItems) ? neededItems : []).map((item, index) => {
                const isFulfilled = item.quantity_received >= item.quantity_needed || item.is_fulfilled;
                return (
                  <tr 
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isFulfilled ? 'bg-emerald-50/20 opacity-75' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block text-sm">
                        {item.item_name}
                      </span>
                      {item.description && (
                        <span className="text-slate-500 text-xs block mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-800">
                      <span className="font-bold">{item.quantity_needed}</span>{' '}
                      <span className="text-xs text-slate-500">
                        ({item.quantity_received} received)
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-800 font-mono text-sm">
                      ₹{item.estimated_price?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      {isFulfilled ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Fulfilled
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.urgency || 'Needed'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => onPledge(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-sm"
                      >
                        Pledge / Donate
                      </button>

                      {adminUser && (
                        <span className="ml-2">
                          <button
                            onClick={() => onEditNeed(item)}
                            className="p-1 text-slate-500 hover:text-emerald-700"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => onDeleteNeed(item.id)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
