'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getVerificationError } from '@/utils/errorHandler';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { AuthLayoutWrapper } from '@/components/auth';

const REFRESH_TECH_PRIMARY = '#10304f';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verificationStatus, setVerificationStatus] = useState<{
    type: 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'loading', message: 'Verifying your email...' });

  const verifyEmailMutation = useMutation(api.auth.verifyEmail);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus({
          type: 'error',
          message: 'Invalid verification link. No token provided.'
        });
        return;
      }

      try {
        await verifyEmailMutation({ token });
        toast.success('Email verified successfully! You can now log in.');
        setVerificationStatus({
          type: 'success',
          message: 'Your email has been verified successfully! You can now log in.'
        });
      } catch (error: unknown) {
        console.log('🔍 Email verification error:', error);
        const userFriendlyMessage = getVerificationError(error);
        toast.error(userFriendlyMessage);
        setVerificationStatus({
          type: 'error',
          message: userFriendlyMessage
        });
      }
    };

    verifyEmail();
  }, [token, verifyEmailMutation]);

  const pageTitle = verificationStatus.type === 'loading' ? 'Verifying Email' : 
                    verificationStatus.type === 'success' ? 'Email Verified' : 'Verification Failed';

  return (
    <AuthLayoutWrapper title={pageTitle}>
      <div className="text-center">
        {verificationStatus.type === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 mx-auto mb-6" style={{ borderTopColor: REFRESH_TECH_PRIMARY }}></div>
            <p className="text-slate-600 text-lg">{verificationStatus.message}</p>
          </div>
        )}

        {verificationStatus.type === 'success' && (
          <div>
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${REFRESH_TECH_PRIMARY}20` }}>
              <CheckCircle className="w-10 h-10" style={{ color: REFRESH_TECH_PRIMARY }} />
            </div>
            <p className="text-slate-700 text-lg mb-8">{verificationStatus.message}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: REFRESH_TECH_PRIMARY }}
            >
              Go to Login
            </Link>
          </div>
        )}

        {verificationStatus.type === 'error' && (
          <div>
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-slate-700 text-lg mb-8">{verificationStatus.message}</p>
            <div className="space-y-3">
              <Link
                href="/auth/resend-verification"
                className="flex items-center justify-center gap-2 w-full text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: REFRESH_TECH_PRIMARY }}
              >
                <Mail className="w-5 h-5" />
                Resend Verification Email
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-slate-50 border border-gray-200 hover:border-slate-300 text-gray-600 hover:text-slate-800 font-semibold py-4 px-8 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                Back to Registration
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayoutWrapper>
  );
}
