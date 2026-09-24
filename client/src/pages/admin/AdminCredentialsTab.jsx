import React, { useState } from 'react';
import { 
  KeyRound, User, Lock, CheckCircle2, AlertTriangle, 
  Eye, EyeOff, Save, ShieldCheck 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminCredentialsTab({ onShowToast }) {
  const { adminUser, logout, setLoginModalOpen } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(adminUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      onShowToast?.({ type: 'error', message: 'Current password is required to authorize changes' });
      return;
    }

    if (!newUsername.trim()) {
      onShowToast?.({ type: 'error', message: 'Admin username cannot be blank' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      onShowToast?.({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      onShowToast?.({ type: 'error', message: 'New password and confirmation do not match' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateAdminCredentials({
        current_password: currentPassword,
        new_username: newUsername.trim(),
        new_password: newPassword ? newPassword : undefined
      });

      onShowToast?.({
        type: 'success',
        title: 'Credentials Updated',
        message: res.message || 'Username & Password saved. Please log in with your new credentials.'
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto re-login prompt
      logout();
      setLoginModalOpen(true);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Info */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <KeyRound className="w-4 h-4" />
          <span>Account Security & Access Control</span>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Set Your Custom Admin Username & Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            When hosting the website publicly, never keep default credentials like <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">admin / admin123</code>. Use this form to assign your own personal username and a confidential password.
          </p>
        </div>

        {/* Security Warning Box */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Important for Public Hosting Deployment:</strong>
            <span>
              Once you update these credentials, all subsequent logins must use your newly defined username and password. Make sure to record them safely.
            </span>
          </div>
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Credential Update Form</h3>
            <p className="text-xs text-slate-500">Currently active account: <strong className="text-slate-800">{adminUser?.username}</strong></p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Hide characters' : 'Reveal characters'}</span>
          </button>
        </div>

        {/* Step 1: Current Password */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            1. Current Master Password * (Verification)
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              placeholder="Enter current password (default is admin123)"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-500 block">
            Required to confirm administrative authorization.
          </span>
        </div>

        {/* Step 2: New Custom Username */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-900">
            2. New Custom Admin Username *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. director_shanti or superintendent_roy"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
            />
            <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-500 block">
            Choose a unique username that you will use to log into the hostel admin console.
          </span>
        </div>

        {/* Step 3: New Password & Confirmation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              3. New Confidential Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Min 6 characters. Use letters & digits.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm"
              />
              <CheckCircle2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-blue-200 transition disabled:opacity-50 text-xs sm:text-sm flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Updating Credentials...' : 'Save New Username & Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
