'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '../../AuthProvider';
import toast from 'react-hot-toast';
import { getLoginError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert } from '@/components/auth';
import { Lock, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms and Conditions and Privacy Policy'})});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  success?: boolean;
  requiresEmailVerification?: boolean;
  requiresRegistration?: boolean;
  requiresPasswordChange?: boolean;
  userId?: string;
  message?: string;
  error?: string;
  sessionToken?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    apps: Record<string, any>;
  };
  remainingAttempts?: number;
  warning?: string;
  lockedUntil?: number;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const domain = params.domain as string;
  const { login: authLogin, addDomainAccess, setSessionToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    showResendButton?: boolean;
    warning?: string;
    lockedUntil?: number;
    remainingAttempts?: number;
  } | null>(null);

  // Domain access modal state
  const [showDomainAccessModal, setShowDomainAccessModal] = useState(false);
  const [domainAccessEmail, setDomainAccessEmail] = useState('');
  const [domainAccessPassword, setDomainAccessPassword] = useState('');
  const [isProcessingDomainAccess, setIsProcessingDomainAccess] = useState(false);

  // Password change modal state
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [passwordChangeEmail, setPasswordChangeEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues} = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)});

  // Check for success message from password change redirect
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password-changed') {
      toast.success('Password changed successfully! Please log in with your new password.');
      // Clean up the URL without refreshing the page
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
    if (message === 'verify-email') {
      toast.success('Registration successful! Please verify your email and then login.');
      // Clean up the URL without refreshing the page
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Use API route directly for rate limiting support
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, domain }),
      });

      const result: LoginResponse = await response.json();

      // Handle rate limiting (429 status)
      if (response.status === 429) {
        const minutesLeft = result.lockedUntil 
          ? Math.ceil((result.lockedUntil - Date.now()) / 60000)
          : 15;
        
        setSubmitMessage({
          type: 'error',
          message: result.error || 'Too many failed attempts. Please try again later.',
          lockedUntil: result.lockedUntil
        });
        
        toast.error(`Account locked. Try again in ${minutesLeft} minutes.`);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.sessionToken) {
        // Set session via AuthProvider
        setSessionToken(result.sessionToken);
        localStorage.setItem('sessionToken', result.sessionToken);
        document.cookie = `sessionToken=${result.sessionToken}; path=/; max-age=604800`;

        toast.success('Login successful! Redirecting...');
        setSubmitMessage({
          type: 'success',
          message: 'Login successful! Redirecting...'});

        const checkoutRedirect = localStorage.getItem('checkoutRedirect') || searchParams.get('redirect');
        
        setTimeout(() => {
          if (checkoutRedirect) {
            localStorage.removeItem('checkoutRedirect');
            const url = new URL(window.location.href);
            url.searchParams.delete('redirect');
            url.searchParams.delete('message');
            window.history.replaceState({}, '', url.toString());
            router.push(checkoutRedirect);
          } else {
            router.push('/dashboard');
          }
        }, 1000);
      } else if (result.requiresEmailVerification) {
        toast.error('Please verify your email before logging in.');
        setSubmitMessage({
          type: 'warning',
          message: result.message || 'Please verify your email before logging in.',
          showResendButton: true});
      } else if (result.requiresPasswordChange) {
        setPasswordChangeUserId(result.userId || null);
        setPasswordChangeEmail(data.email);
        setShowPasswordChangeModal(true);
      } else if (result.requiresRegistration) {
        setDomainAccessEmail(data.email);
        setShowDomainAccessModal(true);
      } else {
        // Check for rate limit warning
        if (result.warning) {
          setSubmitMessage({
            type: 'error',
            message: result.message || 'Login failed. Please check your credentials.',
            warning: result.warning,
            remainingAttempts: result.remainingAttempts
          });
          toast.error(result.warning);
        } else if (result.remainingAttempts !== undefined && result.remainingAttempts <= 2) {
          setSubmitMessage({
            type: 'error',
            message: result.message || 'Login failed. Please check your credentials.',
            warning: `${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining before account lockout.`
          });
          toast.error(`${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining!`);
        } else {
          toast.error(result.message || 'Login failed. Please check your credentials.');
          setSubmitMessage({
            type: 'error',
            message: result.message || 'Login failed. Please try again.'
          });
        }
      }
    } catch (error) {
      const errorMessage = getLoginError(error);
      toast.error(errorMessage);
      setSubmitMessage({
        type: 'error',
        message: errorMessage});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDomainAccessSubmit = async () => {
    if (!domainAccessPassword.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setIsProcessingDomainAccess(true);
    try {
      const result = await addDomainAccess(domainAccessEmail, domainAccessPassword);

      if (result.success) {
        toast.success('Domain access granted! You can now log in.');
        setShowDomainAccessModal(false);
        setDomainAccessPassword('');

        // Check if email verification is required
        if (result.requiresEmailVerification) {
          setSubmitMessage({
            type: 'warning',
            message: result.message || 'Domain access granted! Please verify your email address to complete the login process.',
            showResendButton: true,
          });
        } else {
          // Auto-login with the same credentials via API
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: domainAccessEmail, password: domainAccessPassword, domain }),
          });
          const loginResult = await loginResponse.json();
          
          if (loginResult.success && loginResult.sessionToken) {
            setSessionToken(loginResult.sessionToken);
            localStorage.setItem('sessionToken', loginResult.sessionToken);
            document.cookie = `sessionToken=${loginResult.sessionToken}; path=/; max-age=604800`;
            
            toast.success('Login successful! Redirecting...');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          }
        }
      } else {
        toast.error(result.message || 'Failed to grant domain access. Please check your password.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to grant domain access');
    } finally {
      setIsProcessingDomainAccess(false);
    }
  };

  const handleResendVerification = () => {
    const email = getValues('email');
    if (email) {
      router.push(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/auth/resend-verification');
    }
  };

  return (
    <AuthLayoutWrapper
      title="Sign In"
      subtitle="Enter your credentials to access your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          error={errors.email?.message}
        />

        <AuthInput
          {...register('password')}
          type="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
        />

        <div className="flex items-start gap-3">
          <input
            {...register('agreeToTerms')}
            type="checkbox"
            className="mt-1 h-4 w-4 text-slate-800 focus:ring-slate-600 border-gray-300 rounded"
          />
          <label className="text-sm text-slate-600">
            I agree to the{' '}
            <Link href="/terms" className="text-slate-800 hover:text-slate-900 font-medium underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-slate-800 hover:text-slate-900 font-medium underline">
              Privacy Policy
            </Link>
            *
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.agreeToTerms.message}
          </p>
        )}

        {submitMessage && (
          <AuthAlert type={submitMessage.type} message={submitMessage.message}>
            {submitMessage.warning && (
              <p className="mt-2 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                {submitMessage.warning}
              </p>
            )}
            {submitMessage.remainingAttempts !== undefined && submitMessage.remainingAttempts <= 2 && !submitMessage.warning && (
              <p className="mt-2 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                {submitMessage.remainingAttempts} attempt{submitMessage.remainingAttempts === 1 ? '' : 's'} remaining before account lockout.
              </p>
            )}
            {submitMessage.lockedUntil && (
              <p className="mt-2 text-sm font-medium text-red-700 bg-red-50 px-2 py-1 rounded">
                Account locked. Try again in {Math.ceil((submitMessage.lockedUntil - Date.now()) / 60000)} minutes.
              </p>
            )}
            {submitMessage.showResendButton && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-3 text-slate-800 hover:text-slate-900 font-semibold text-sm underline"
              >
                Resend verification email
              </button>
            )}
          </AuthAlert>
        )}

        <AuthButton type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </AuthButton>

        <div className="pt-4 space-y-4 border-t border-slate-100">
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm hover:opacity-80 font-medium transition-colors"
              style={{ color: 'var(--auth-primary, #10304f)' }}
            >
              Forgot your password?
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold hover:opacity-80" style={{ color: 'var(--auth-primary, #10304f)' }}>
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </form>

      {/* Domain Access Modal */}
      {showDomainAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDomainAccessModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1a303d] to-[#1a303d] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Domain Access Required</h3>
                    <p className="text-sm text-white/70">Verify your identity</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDomainAccessModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-700 mb-6">
                You do not have access to this domain. Please enter your password for <strong>{domainAccessEmail}</strong> in order to gain access.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleDomainAccessSubmit(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={domainAccessEmail}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={domainAccessPassword}
                    onChange={(e) => setDomainAccessPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all text-sm"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDomainAccessModal(false);
                      setDomainAccessPassword('');
                    }}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!domainAccessPassword.trim() || isProcessingDomainAccess}
                    className="flex-1 px-4 py-3 bg-gradient-to-r to-[#1a303d] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingDomainAccess ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Granting Access...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Grant Access</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal for forced password change */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {}}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1a303d] to-[#1a303d] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Change Your Password</h3>
                    <p className="text-sm text-white/70">You must change your password to continue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-700 mb-6">
                Please enter your current password and choose a new password to continue.
              </p>

              <PasswordChangeForm 
                userId={passwordChangeUserId}
                email={passwordChangeEmail}
                onSuccess={() => {
                  setShowPasswordChangeModal(false);
                  toast.success('Password changed successfully! Please log in with your new password.');
                }}
                onCancel={() => {
                  setShowPasswordChangeModal(false);
                  setPasswordChangeUserId(null);
                  setPasswordChangeEmail('');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AuthLayoutWrapper>
  );
}

// Password change form component
function PasswordChangeForm({ 
  userId, 
  email, 
  onSuccess, 
  onCancel 
}: { 
  userId: string | null; 
  email: string; 
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const forcePasswordChange = useAction(api.authActions.forcePasswordChangeAction);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

  type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('newPassword', '');

  useEffect(() => {
    // Simple validation check
    const password = watch('newPassword', '');
    const confirm = watch('confirmPassword', '');
    const current = watch('currentPassword', '');
    setIsValid(
      current.length > 0 && 
      password.length >= 8 && 
      password === confirm &&
      /[A-Z]/.test(password) && 
      /[a-z]/.test(password) && 
      /[0-9]/.test(password)
    );
  }, [watch]);

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (!userId) {
      toast.error('User not found');
      return;
    }

    setIsSubmitting(true);

    try {
      await forcePasswordChange({
        userId: userId as any,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Password changed successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMsg = error?.message || 'Failed to change password. Please check your current password.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMinLength = watchedPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(watchedPassword);
  const hasLowerCase = /[a-z]/.test(watchedPassword);
  const hasNumber = /[0-9]/.test(watchedPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Current Password */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Current Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            {...register('currentPassword')}
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Enter current password"
            className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            {...register('newPassword')}
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>
        )}
        
        {/* Password requirements */}
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-slate-600 mb-1">Password requirements:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className={`flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
              <span className={hasMinLength ? 'font-bold' : ''}>✓</span> At least 8 characters
            </div>
            <div className={`flex items-center gap-1 ${hasUpperCase ? 'text-green-600' : 'text-slate-400'}`}>
              <span className={hasUpperCase ? 'font-bold' : ''}>✓</span> Uppercase letter
            </div>
            <div className={`flex items-center gap-1 ${hasLowerCase ? 'text-green-600' : 'text-slate-400'}`}>
              <span className={hasLowerCase ? 'font-bold' : ''}>✓</span> Lowercase letter
            </div>
            <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
              <span className={hasNumber ? 'font-bold' : ''}>✓</span> Number
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 px-4 py-3 bg-gradient-to-r to-[#1a303d] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Changing...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Change Password</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
