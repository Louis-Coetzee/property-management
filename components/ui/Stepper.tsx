'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`w-full ${className}`}>
      <ol className="flex items-start w-full overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = idx === steps.length - 1;
          return (
            <li
              key={step.id}
              className={`flex items-start flex-shrink-0 ${isLast ? '' : 'flex-1 min-w-0'}`}
            >
              <div className="flex flex-col items-center mr-3 sm:mr-4">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all border-2 ${
                    isCompleted
                      ? 'bg-slate-900 text-white border-slate-900'
                      : isCurrent
                      ? 'bg-white text-slate-900 border-slate-900 ring-4 ring-slate-900/10'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
              </div>
              <div className="pt-1.5 sm:pt-2 min-w-0">
                <p
                  className={`text-xs sm:text-sm font-semibold leading-tight ${
                    isCurrent || isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mt-4 sm:mt-5 mx-3 sm:mx-4 rounded-full transition-colors ${
                    isCompleted ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
