'use client';

import { Sparkles, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionTemplate } from '@/types/page-builder';

interface TemplateStepProps {
  templates: SectionTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  onBack: () => void;
  sectionTypeName: string;
}

export function TemplateStep({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onBack,
  sectionTypeName,
}: TemplateStepProps) {
  const availableTemplates = templates.filter((t) => t.isAvailable);

  if (availableTemplates.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Templates Available</h3>
        <p className="text-slate-600 mb-4">Templates for this section type are coming soon.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to categories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Choose a {sectionTypeName} Template
          </h3>
          <p className="text-sm text-slate-600">
            Select a template design for your {sectionTypeName.toLowerCase()} section
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        {availableTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const Icon = template.icon;

          return (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(template.id)}
              className={cn(
                'relative w-full p-5 rounded-xl border-2 text-left transition-all duration-200 group',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-200'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Preview/Icon */}
                <div
                  className={cn(
                    'w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors',
                    isSelected ? 'bg-indigo-600' : 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-slate-200 group-hover:to-slate-300'
                  )}
                >
                  <Icon className={cn('h-10 w-10', isSelected ? 'text-white' : 'text-slate-600')} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-lg mb-1">
                    {template.name}
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-600">
          <span className="font-medium">Note:</span> You can customize the content after adding the section to your page.
        </p>
      </div>
    </div>
  );
}
