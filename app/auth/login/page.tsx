'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { getLoginError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert } from '@/components/auth';
import { Eye, EyeOff } from 'lucide-react';
import { getPlatformDomain } from '@/lib/domain';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms and Conditions and Privacy Policy'
  })
});

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
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = getPlatformDomain();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    showResendButton?: boolean;
    warning?: string;
    lockedUntil?: number;
    remainingAttempts?: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password-changed') {
      toast.success('Password changed successfully! Please log in with your new password.');
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
    if (message === 'verify-email') {
      toast.success('Registration successful! Please verify your email and then login.');
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, domain }),
      });

      const result: LoginResponse = await response.json();

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
        localStorage.setItem('sessionToken', result.sessionToken);
        document.cookie = `sessionToken=${result.sessionToken}; path=/; max-age=604800`;

        toast.success('Login successful! Redirecting...');
        setSubmitMessage({
          type: 'success',
          message: 'Login successful! Redirecting...'
        });

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
          showResendButton: true
        });
      } else if (result.requiresPasswordChange) {
        toast.error('Please change your password to continue.');
        setSubmitMessage({
          type: 'warning',
          message: result.message || 'Please change your password to continue.'
        });
      } else if (result.requiresRegistration) {
        toast.error('No account found. Please register first.');
        setSubmitMessage({
          type: 'error',
          message: result.message || 'No account found. Please register first.'
        });
      } else {
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
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
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
    </AuthLayoutWrapper>
  );
}
