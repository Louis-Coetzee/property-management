'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getRegisterError } from '@/utils/errorHandler';
import { AuthLayoutWrapper, AuthInput, AuthButton, AuthAlert, PasswordValidator } from '@/components/auth';
import { CheckCircle, XCircle } from 'lucide-react';
import { getPlatformDomain } from '@/lib/domain';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms and Conditions and Privacy Policy'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const domain = getPlatformDomain();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState('');
  const [existingUserPassword, setExistingUserPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          contactNumber: data.contactNumber,
          password: data.password,
          domain,
          termsAccepted: true,
        }),
      });

      const result = await response.json();

      if (response.status === 409 && result.error === 'EXISTING_USER') {
        setExistingUserEmail(data.email);
        setShowPasswordPrompt(true);
        toast.success('We found an existing account with this email. Please enter your password to add access to this platform.');
        setIsSubmitting(false);
        return;
      }

      if (response.ok && !result.error) {
        toast.success('Registration successful! Please check your email to verify your account.');
        setTimeout(() => {
          router.push('/auth/login?message=verify-email');
        }, 3000);
      } else {
        const errorMessage = result.error || 'Registration failed';
        toast.error(errorMessage);
        setSubmitMessage({
          type: 'error',
          message: errorMessage
        });
      }
    } catch (error: unknown) {
      const errorMessage = getRegisterError(error);
      toast.error(errorMessage);
      setSubmitMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExistingUserPassword = async () => {
    if (!existingUserPassword || !existingUserEmail) {
      toast.error('Please enter your password to continue.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: '',
          lastName: '',
          email: existingUserEmail,
          contactNumber: '',
          password: existingUserPassword,
          domain,
          termsAccepted: true,
          isConsultantCreation: true,
        }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        toast.success('Success - you now have access to this platform.');
        setShowPasswordPrompt(false);
        setExistingUserPassword('');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        let userFriendlyMessage = result.error || 'Failed to add platform access';
        
        if (userFriendlyMessage.includes('Incorrect password')) {
          userFriendlyMessage = 'Incorrect password. Please try again.';
        } else if (userFriendlyMessage.includes('User not found')) {
          userFriendlyMessage = 'Account not found. Please register a new account.';
        } else if (userFriendlyMessage.includes('already have access')) {
          userFriendlyMessage = 'You already have access to this platform. Please login instead.';
        }

        toast.error(userFriendlyMessage);
        setSubmitMessage({
          type: 'error',
          message: userFriendlyMessage
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to add platform access';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }

      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Incorrect password')) {
        userFriendlyMessage = 'Incorrect password. Please try again.';
      } else if (errorMessage.includes('User not found')) {
        userFriendlyMessage = 'Account not found. Please register a new account.';
      } else if (errorMessage.includes('already have access')) {
        userFriendlyMessage = 'You already have access to this platform. Please login instead.';
      } else {
        const simpleErrorMatch = errorMessage.match(/Uncaught Error: (.+?)(?:\n|$|at handler)/);
        if (simpleErrorMatch) {
          userFriendlyMessage = simpleErrorMatch[1].trim();
        }
      }

      toast.error(userFriendlyMessage);
      setSubmitMessage({
        type: 'error',
        message: userFriendlyMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayoutWrapper
      title="Create Account"
      subtitle="Register to access the platform"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            {...register('firstName')}
            type="text"
            label="First Name"
            placeholder="John"
            error={errors.firstName?.message}
          />

          <AuthInput
            {...register('lastName')}
            type="text"
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
          />
        </div>

        <AuthInput
          {...register('email')}
          type="email"
          label="Email Address"
          placeholder="john@example.com"
          error={errors.email?.message}
        />

        <AuthInput
          {...register('contactNumber')}
          type="tel"
          label="Contact Number"
          placeholder="+1 234 567 890"
          error={errors.contactNumber?.message}
        />

        <AuthInput
          {...register('password')}
          type="password"
          label="Password"
          placeholder="Create a password"
          error={errors.password?.message}
        />
        <PasswordValidator
          password={watchedPassword}
          onValidationChange={setIsPasswordValid}
        />

        <AuthInput
          {...register('confirmPassword')}
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
        />

        <div className="flex items-start gap-3">
          <input
            {...register('agreeToTerms')}
            type="checkbox"
            className="mt-1 h-4 w-4 text-slate-800 focus:ring-slate-600 border-gray-300 rounded"
          />
          <label className="text-sm text-slate-600">
            I agree to the{' '}
            <Link href="/terms" className="hover:opacity-80 font-medium underline" style={{ color: 'var(--auth-primary, #10304f)' }}>
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="hover:opacity-80 font-medium underline" style={{ color: 'var(--auth-primary, #10304f)' }}>
              Privacy Policy
            </Link>
            *
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            {errors.agreeToTerms.message}
          </p>
        )}

        {submitMessage && (
          <AuthAlert
            type={submitMessage.type}
            message={submitMessage.message}
          />
        )}

        <AuthButton type="submit" isLoading={isSubmitting} disabled={!isPasswordValid}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </AuthButton>

        <div className="pt-4 text-center border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold hover:opacity-80" style={{ color: 'var(--auth-primary, #10304f)' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </form>

      {/* Existing User Password Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Existing Account Found</h3>
              <p className="text-slate-600">
                We found an existing account with the email <strong>{existingUserEmail}</strong>.
                Please enter your password to add access to this platform.
              </p>
            </div>

            <div className="space-y-4">
              <AuthInput
                type="password"
                label="Your Password"
                value={existingUserPassword}
                onChange={(e) => {
                  setExistingUserPassword(e.target.value);
                  if (submitMessage && submitMessage.type === 'error') {
                    setSubmitMessage(null);
                  }
                }}
                placeholder="Enter your existing password"
              />

              {submitMessage && (
                <AuthAlert
                  type={submitMessage.type}
                  message={submitMessage.message}
                />
              )}

              <div className="flex gap-4 pt-2">
                <AuthButton
                  onClick={handleExistingUserPassword}
                  isLoading={isSubmitting}
                  disabled={!existingUserPassword}
                >
                  {isSubmitting ? 'Adding Access...' : 'Add Platform Access'}
                </AuthButton>
                <button
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setExistingUserPassword('');
                    setExistingUserEmail('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-slate-600">
                  Don&apos;t remember your password?{' '}
                  <Link href="/auth/forgot-password" className="text-slate-800 hover:text-slate-900 font-medium underline">
                    Reset it here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayoutWrapper>
  );
}
