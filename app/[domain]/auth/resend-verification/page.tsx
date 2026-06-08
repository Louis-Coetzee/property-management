'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getResendVerificationError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert } from '@/components/auth';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const resendSchema = z.object({
  email: z.string().email('Invalid email address')});

type ResendFormData = z.infer<typeof resendSchema>;

interface ResendVerificationResponse {
  message?: string;
  error?: string;
  cooldownUntil?: number;
}

export default function ResendVerificationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domain = params.domain as string;
  const emailFromUrl = searchParams.get('email');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
    cooldownUntil?: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }} = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema)});

  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl);
    }
  }, [emailFromUrl, setValue]);

  const onSubmit = async (data: ResendFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, domain }),
      });

      const result: ResendVerificationResponse = await response.json();

      if (response.status === 429) {
        const minutesLeft = result.cooldownUntil 
          ? Math.ceil((result.cooldownUntil - Date.now()) / 60000)
          : 60;
        
        toast.error(`Please wait ${minutesLeft} minutes before requesting another verification email.`);
        setSubmitMessage({
          type: 'error',
          message: `Too many requests. Please wait ${minutesLeft} minutes before trying again.`,
          cooldownUntil: result.cooldownUntil
        });
        setIsSubmitting(false);
        return;
      }

      toast.success('If your account exists and is not verified, a verification email has been sent.');
      setSubmitMessage({
        type: 'success',
        message: 'If your account exists and is not verified, a verification email has been sent.'});
    } catch (error) {
      const errorMessage = getResendVerificationError(error);
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
      title="Resend Verification"
      subtitle="Enter your email to receive a new verification link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="text-center mb-6">
          <p className="text-slate-600 text-sm">
            Didn&apos;t receive the verification email? Enter your email address and we&apos;ll send you another one.
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
                Please wait {Math.ceil((submitMessage.cooldownUntil - Date.now()) / 60000)} minutes before requesting another verification email.
              </p>
            )}
          </AuthAlert>
        )}

        <AuthButton type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Verification Email'}
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
