'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getPasswordResetError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert, PasswordValidator } from '@/components/auth';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const resetPasswordAction = useAction(api.authActions.resetPasswordAction);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const watchedPassword = watch('password', '');

  useEffect(() => {
    if (!token) {
      setSubmitMessage({
        type: 'error',
        message: 'This password reset link is invalid or has expired. Please request a new password reset.'
      });
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('This password reset link is invalid or has expired. Please request a new password reset.');
      setSubmitMessage({
        type: 'error',
        message: 'This password reset link is invalid or has expired. Please request a new password reset.'
      });
      return;
    }

    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      setSubmitMessage({
        type: 'error',
        message: 'Please ensure your password meets all requirements'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await resetPasswordAction({
        token,
        newPassword: data.password
      });

      toast.success('Password reset successfully! You can now log in with your new password.');
      setSubmitMessage({
        type: 'success',
        message: 'Password reset successfully! You can now log in with your new password.'
      });

      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      const errorMessage = getPasswordResetError(error);
      toast.error(errorMessage);
      setSubmitMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDZtMjQgMGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDZNMCAwaDYwdjYwSDB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 via-transparent to-slate-800/10"></div>
        </div>

        <div className="absolute top-20 left-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Invalid Reset Link</h1>
            </div>

            <div className="px-8 py-10 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <p className="text-slate-700 text-lg mb-8">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-slate-700/30 transition-all duration-200 hover:shadow-slate-700/40 active:scale-[0.98]"
              >
                Request New Reset Link
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Protected by enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayoutWrapper
      title="Reset Password"
      subtitle="Enter your new password"
      showBackToLogin={true}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          {...register('password')}
          type="password"
          label="New Password"
          placeholder="Enter your new password"
          error={errors.password?.message}
        />
        <PasswordValidator
          password={watchedPassword}
          onValidationChange={setIsPasswordValid}
        />

        <AuthInput
          {...register('confirmPassword')}
          type="password"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          error={errors.confirmPassword?.message}
        />

        {submitMessage && (
          <AuthAlert
            type={submitMessage.type}
            message={submitMessage.message}
          />
        )}

        <AuthButton type="submit" isLoading={isSubmitting} disabled={!isPasswordValid}>
          {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
        </AuthButton>

        <div className="pt-4 text-center border-t border-slate-100">
          <Link
            href="/auth/login"
            className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--auth-primary, #10304f)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayoutWrapper>
  );
}
