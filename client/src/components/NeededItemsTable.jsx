import React from 'react';
import { Gift, Plus, Edit3, Trash2, CheckCircle2, Heart, Handshake } from 'lucide-react';

export default function NeededItemsTable({ 
  neededItems, 
  adminUser, 
  onPledge, 
  onDirectDonate, 
  onMakePledge, 
  onAddNeed, 
  onEditNeed, 
  onDeleteNeed 
}) {
  const handleDonate = (item) => {
    if (onDirectDonate) {
      onDirectDonate(item);
    } else if (onPledge) {
      onPledge(item, 'donate');
    }
  };

  const handlePledge = (item) => {
    if (onMakePledge) {
      onMakePledge(item);
    } else if (onPledge) {
      onPledge(item, 'pledge');
    }
  };

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
            Choose to <strong>Donate Directly</strong> (counts immediately towards fulfilled units) or <strong>Make a Pledge</strong> (promise to sponsor; confirmed by admin upon verification).
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

      {(!Array.isArray(neededItems) || neededItems.length === 0) ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <Gift className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-slate-900">
              Basic Hostel Needs Are Currently Met
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              All essential learning and living supplies for our resident children are currently supported by management and patrons. You can still support our children through direct general donations above.
            </p>
          </div>
          {adminUser && (
            <div className="pt-2">
              <button
                onClick={onAddNeed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center space-x-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Needed Item</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Clean Responsive Cards (Fits 100% of mobile width) */}
          <div className="md:hidden space-y-3.5">
            {(Array.isArray(neededItems) ? neededItems : []).map((item, index) => {
              const isFulfilled = (Number(item.quantity_received) || 0) >= Number(item.quantity_needed) || item.is_fulfilled;
              const remainingNeeded = Math.max(0, Number(item.quantity_needed) - (Number(item.quantity_received) || 0));
              const percentFulfilled = Math.min(100, Math.round(((Number(item.quantity_received) || 0) / (Number(item.quantity_needed) || 1)) * 100));

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
                          item.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {item.urgency || 'Needed'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requirement details */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Requirement</span>
                      {isFulfilled ? (
                        <span className="font-bold text-emerald-700 text-xs flex items-center mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          0 Remaining (Fulfilled)
                        </span>
                      ) : (
                        <div className="mt-0.5">
                          <span className="font-extrabold text-amber-700 text-sm block">
                            {remainingNeeded} still needed
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            ({item.quantity_received || 0} of {item.quantity_needed} received)
                          </span>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentFulfilled}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Estimated Cost</span>
                      <span className="font-extrabold text-emerald-800 font-mono text-sm block">
                        ₹{item.estimated_price?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ≈ ₹{Math.max(1, Math.round((item.estimated_price || 1000) / (item.quantity_needed || 1)))}/unit
                      </span>
                    </div>
                  </div>

                  {/* Distinct Pledge vs Donate Buttons on Mobile */}
                  <div className="pt-1 space-y-2">
                    {isFulfilled ? (
                      <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                        <span className="flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          All units gathered. Thank you!
                        </span>
                        <button
                          onClick={() => handleDonate(item)}
                          className="text-[11px] underline text-emerald-800 hover:text-emerald-900 font-bold"
                        >
                          Sponsor Extra
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePledge(item)}
                          className="border border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition active:scale-95"
                          title="Promise to donate or sponsor. Admin will call to verify before counting as received."
                        >
                          <Handshake className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Make a Pledge</span>
                        </button>

                        <button
                          onClick={() => handleDonate(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-95"
                          title="Donate directly now via UPI/GPay. Counts immediately towards fulfilled units."
                        >
                          <Heart className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Donate Now</span>
                        </button>
                      </div>
                    )}

                    {adminUser && (
                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 mr-auto font-medium">Admin actions:</span>
                        <button
                          onClick={() => onEditNeed(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg text-xs flex items-center space-x-1"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteNeed(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs flex items-center space-x-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: Full Table with Distinct Action Buttons */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-4 px-5 w-14">S.No</th>
                    <th className="py-4 px-5">Needed Item</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Still Needed / Progress</th>
                    <th className="py-4 px-5">Estimated Price</th>
                    <th className="py-4 px-5">Urgency</th>
                    <th className="py-4 px-5 text-right">Choose Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(Array.isArray(neededItems) ? neededItems : []).map((item, index) => {
                    const isFulfilled = (Number(item.quantity_received) || 0) >= Number(item.quantity_needed) || item.is_fulfilled;
                    const remainingNeeded = Math.max(0, Number(item.quantity_needed) - (Number(item.quantity_received) || 0));
                    const percentFulfilled = Math.min(100, Math.round(((Number(item.quantity_received) || 0) / (Number(item.quantity_needed) || 1)) * 100));

                    return (
                      <tr 
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isFulfilled ? 'bg-emerald-50/20 opacity-80' : ''
                        }`}
                      >
                        <td className="py-4 px-5 font-bold text-slate-400">{index + 1}</td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-900 block text-sm">
                            {item.item_name}
                          </span>
                          {item.description && (
                            <span className="text-slate-500 text-xs block mt-0.5 max-w-xs">
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono">
                          {isFulfilled ? (
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-700 text-sm flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" />
                                0 Remaining
                              </span>
                              <span className="text-[11px] text-slate-500 font-sans block">
                                All {item.quantity_needed} received
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-baseline space-x-1.5">
                                <span className="font-extrabold text-amber-700 text-base">
                                  {remainingNeeded}
                                </span>
                                <span className="font-bold text-slate-700 text-xs font-sans">
                                  still needed
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                  <div 
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${percentFulfilled}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 font-sans">
                                  {item.quantity_received || 0}/{item.quantity_needed}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 font-bold text-emerald-800 font-mono text-sm whitespace-nowrap">
                          ₹{item.estimated_price?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-5">
                          {isFulfilled ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Fulfilled
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {item.urgency || 'Needed'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          {isFulfilled ? (
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Fulfilled
                            </span>
                          ) : (
                            <div className="inline-flex items-center space-x-2">
                              {/* Make a Pledge: Does NOT increment received until admin confirms */}
                              <button
                                onClick={() => handlePledge(item)}
                                className="border border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-xl text-xs transition inline-flex items-center space-x-1"
                                title="Promise to bring or sponsor this item. Admin will verify with you before counting as received."
                              >
                                <Handshake className="w-3.5 h-3.5 text-amber-700" />
                                <span>Make a Pledge</span>
                              </button>

                              {/* Donate Now: Directly increments received and decreases remaining */}
                              <button
                                onClick={() => handleDonate(item)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm inline-flex items-center space-x-1"
                                title="Donate immediately (UPI/GPay). Directly counts towards received requirement!"
                              >
                                <Heart className="w-3.5 h-3.5" />
                                <span>Donate Now</span>
                              </button>
                            </div>
                          )}

                          {adminUser && (
                            <span className="ml-2 inline-flex items-center space-x-1 border-l border-slate-200 pl-2">
                              <button
                                onClick={() => onEditNeed(item)}
                                className="p-1 text-slate-500 hover:text-emerald-700"
                                title="Edit Need"
                              >
                                <Edit3 className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => onDeleteNeed(item.id)}
                                className="p-1 text-rose-500 hover:text-rose-700"
                                title="Delete Need"
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
        </>
      )}
    </section>
  );
}
