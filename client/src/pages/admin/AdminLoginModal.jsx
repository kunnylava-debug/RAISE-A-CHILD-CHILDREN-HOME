import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Key, X, AlertCircle, ShieldCheck, 
  Mail, ArrowLeft, CheckCircle2, Clock, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api, getNotificationRecipientEmail } from '../../services/api';

export default function AdminLoginModal({ onShowToast, onLoginSuccess }) {
  const { loginModalOpen, setLoginModalOpen, login } = useAdminAuth();
  const [username, setUsername] = useState('Tuny777');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const notificationEmail = getNotificationRecipientEmail();

  // Forgot Password / OTP Flow States
  // mode: 'login' | 'forgot'
  const [mode, setMode] = useState('login');
  // step: 'request' | 'verify' | 'reset' | 'success'
  const [recoveryStep, setRecoveryStep] = useState('request');
  const [recoveryIdentity, setRecoveryIdentity] = useState('admin');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Timer & Resend Cooldown
  const [countdown, setCountdown] = useState(600); // 10 minutes (600s)
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer = null;
    if (mode === 'forgot' && recoveryStep === 'verify' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [mode, recoveryStep, countdown]);

  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [resendCooldown]);

  if (!loginModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      onShowToast?.({
        type: 'success',
        title: 'Authentication Successful',
        message: 'Welcome back to the Administrative Portal.'
      });
      setLoginModalOpen(false);
      onLoginSuccess?.();
    } catch (err) {
      let msg = err.message || 'Invalid username or password.';
      if (/json|fetch|network|failed/i.test(msg) && !err.isAuthRejection) {
        msg = 'Unable to connect to server. Please check your network connection.';
      }
      setError(msg);
      // Dispatch security email notification for failed login attempt
      api.dispatchSecurityAlert(username).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to active notification email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!recoveryIdentity.trim()) {
      setError('Please provide your admin username or email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.forgotPassword(recoveryIdentity.trim());
      onShowToast?.({
        type: 'success',
        title: 'Recovery OTP Dispatched',
        message: res.message || `A 6-digit OTP code has been dispatched to ${notificationEmail}.`
      });
      setRecoveryStep('verify');
      setCountdown(600); // 10 minutes
      setResendCooldown(60); // 60 seconds before resend allowed
    } catch (err) {
      setError(err.message || 'Failed to dispatch recovery OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(recoveryIdentity.trim());
      onShowToast?.({
        type: 'info',
        title: 'Fresh OTP Sent',
        message: res.message || `A new 6-digit OTP has been sent to ${notificationEmail}.`
      });
      setCountdown(600);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.verifyOtp(recoveryIdentity.trim(), cleanOtp);
      onShowToast?.({
        type: 'success',
        title: 'OTP Verified',
        message: 'Security verification succeeded! Please set your new password.'
      });
      setResetToken(res.reset_token || '');
      setRecoveryStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError('New password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.resetPassword({
        reset_token: resetToken,
        username_or_email: recoveryIdentity.trim(),
        otp: otpCode.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      onShowToast?.({
        type: 'success',
        title: 'Password Reset Complete',
        message: res.message || 'Admin password updated successfully!'
      });
      setPassword(newPassword);
      setRecoveryStep('success');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetAllAndBackToLogin = () => {
    setMode('login');
    setRecoveryStep('request');
    setError('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
        <button
          onClick={() => {
            setLoginModalOpen(false);
            resetAllAndBackToLogin();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* MODE: LOGIN                                              */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <>
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900">
                Hostel Staff & Admin Portal
              </h3>
              <p className="text-xs text-slate-500">
                Authorized administrative access for RISE A CHILD CHILDREN HOME
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setRecoveryStep('request');
                      setError('');
                    }}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Sign in with your configured administrator username and password.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <span>Verifying...</span> : <span>Sign In to Admin Dashboard</span>}
              </button>
            </form>
          </>
        )}

        {/* ======================================================== */}
        {/* MODE: FORGOT PASSWORD / OTP FLOW                         */}
        {/* ======================================================== */}
        {mode === 'forgot' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <button
                type="button"
                onClick={resetAllAndBackToLogin}
                className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
                title="Back to Login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  Admin Password Recovery
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  Secure 6-digit OTP verification via {notificationEmail}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {recoveryStep === 'request' && (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs sm:text-sm">
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-1 text-slate-700">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Official Email Recovery</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    A one-time verification password (OTP) will be dispatched directly to the official administrator inbox at <strong className="text-emerald-900 font-mono">{notificationEmail}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Administrator Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={recoveryIdentity}
                      onChange={e => setRecoveryIdentity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder={`admin or ${notificationEmail}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <span>Dispatching OTP...</span> : <span>Send 6-Digit OTP Code</span>}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={resetAllAndBackToLogin}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Remember your password? Return to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {recoveryStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs sm:text-sm">
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-1.5 text-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-emerald-800 font-bold truncate max-w-[200px]">
                      <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">OTP Sent to {notificationEmail}</span>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                      {formatTimer(countdown)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Please check your email and enter the 6-digit security code below. The code is valid for 10 minutes.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Enter 6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3 text-center tracking-[0.4em] font-mono font-bold text-2xl border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:outline-none bg-emerald-50/20 text-slate-900"
                    placeholder="••••••"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6 || countdown <= 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <span>Verifying OTP...</span> : <span>Verify OTP & Proceed</span>}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep('request')}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Change Identifier
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-emerald-700 font-bold hover:underline disabled:opacity-40 disabled:no-underline flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP Code'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {recoveryStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs sm:text-sm">
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs space-y-1 text-slate-700">
                  <div className="flex items-center space-x-1.5 text-teal-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>OTP Verified — Set New Password</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Enter your new administrator password. Must be at least 6 characters.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      placeholder="Repeat new password"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <span className="text-[11px] text-rose-600 mt-1 block">Passwords do not match</span>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <span className="text-[11px] text-emerald-600 mt-1 block font-semibold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Passwords match
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? <span>Updating Password...</span> : <span>Confirm & Update Password</span>}
                </button>
              </form>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {recoveryStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 font-serif">
                    Password Reset Successfully!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Your administrator password has been updated securely. You can now log in to the administrative portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRecoveryStep('request');
                    setError('');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
