'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getForgotPasswordError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert } from '@/components/auth';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordResponse {
  message?: string;
  error?: string;
  cooldownUntil?: number;
}

export default function ForgotPasswordPage() {
  const params = useParams();
  const domain = params.domain as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
    cooldownUntil?: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }} = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)});

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Use API route directly for rate limiting support
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, domain }),
      });

      const result: ForgotPasswordResponse = await response.json();

      if (response.status === 429) {
        // Rate limited - show cooldown message
        const minutesLeft = result.cooldownUntil 
          ? Math.ceil((result.cooldownUntil - Date.now()) / 60000)
          : 60;
        
        toast.error(`Please wait ${minutesLeft} minutes before requesting another reset.`);
        setSubmitMessage({
          type: 'error',
          message: `Too many requests. Please wait ${minutesLeft} minutes before trying again.`,
          cooldownUntil: result.cooldownUntil
        });
        setIsSubmitting(false);
        return;
      }

      if (result.error) {
        const errorMessage = getForgotPasswordError(result.error);
        toast.error(errorMessage);
        setSubmitMessage({
          type: 'error',
          message: errorMessage});
      } else {
        toast.success('If an account with that email exists, a password reset link has been sent.');
        setSubmitMessage({
          type: 'success',
          message: 'If an account with that email exists, a password reset link has been sent.'});
      }
    } catch (error) {
      const errorMessage = getForgotPasswordError(error);
      toast.error(errorMessage);
      setSubmitMessage({
        type: 'error',
        message: errorMessage});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayoutWrapper
      title="Forgot Password"
      subtitle="Enter your email to reset your password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center mb-6">
          <p className="text-slate-600 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <AuthInput
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          error={errors.email?.message}
        />

        {submitMessage && (
          <AuthAlert
            type={submitMessage.type}
            message={submitMessage.message}
          >
            {submitMessage.cooldownUntil && (
              <p className="mt-2 text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                Please wait {Math.ceil((submitMessage.cooldownUntil - Date.now()) / 60000)} minutes before requesting another reset.
              </p>
            )}
          </AuthAlert>
        )}

        <AuthButton type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
