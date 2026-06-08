'use client';

import { useState, useEffect } from 'react';

interface PasswordValidatorProps {
  password: string;
  onValidationChange: (isValid: boolean) => void;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
  icon: React.ReactNode;
}

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const validationRules: ValidationRule[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
  {
    label: 'Uppercase letter',
    test: (password) => /[A-Z]/.test(password),
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>,
  },
  {
    label: 'Lowercase letter',
    test: (password) => /[a-z]/.test(password),
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    label: 'Number',
    test: (password) => /\d/.test(password),
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>,
  },
  {
    label: 'Special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
];

export function PasswordValidator({ password, onValidationChange }: PasswordValidatorProps) {
  const [validations, setValidations] = useState<boolean[]>([]);

  useEffect(() => {
    const results = validationRules.map(rule => rule.test(password));
    setValidations(results);
    const isAllValid = results.every(Boolean);
    onValidationChange(isAllValid);
  }, [password, onValidationChange]);

  if (!password) return null;

  const validCount = validations.filter(Boolean).length;
  const progress = (validCount / validations.length) * 100;

  return (
    <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">Password Strength</span>
        <span className={`text-sm font-bold ${
          progress < 40 ? 'text-red-600' : progress < 80 ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {progress < 40 ? 'Weak' : progress < 80 ? 'Good' : 'Strong'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            progress < 40 ? 'bg-red-500' : progress < 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        {validationRules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
              validations[index]
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-slate-200 text-slate-400'
            }`}>
              {validations[index] ? <CheckIcon /> : rule.icon}
            </div>
            <span className={validations[index] ? 'text-slate-700 font-medium' : 'text-slate-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
