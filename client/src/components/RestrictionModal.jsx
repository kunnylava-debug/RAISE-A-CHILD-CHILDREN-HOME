import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function RestrictionModal({ onAccept, onCancel, isOpen, settings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center space-x-3 text-amber-600 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">
              Hostel Code of Conduct & Child Safety Protocol
            </h3>
            <p className="text-xs text-slate-500">
              Statutory JJ Act & Campus Safety Regulation
            </p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 my-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
          <p className="font-semibold text-amber-900">
            Please read and accept the hostel instructions before continuing:
          </p>
          <p>
            {settings?.important_restriction_text || 
              "All visitors, applicants, and community members must respect child privacy, maintain disciplinary decorum, and abide by campus safety protocols. Sensitive student details and visitor logs are governed under state child welfare norms."}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs pt-1">
            <li>Strict adherence to hostel visitation hours and visitor registration.</li>
            <li>Zero tolerance against any form of child misconduct, bullying, or harassment.</li>
            <li>No unauthorized photography or public posting of children's records.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-6">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
