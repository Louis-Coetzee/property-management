'use client';

import { X, Check } from 'lucide-react';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  preview: React.ReactNode;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  templates: TemplateOption[];
}

export function TemplateSelectionModal({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  templates
}: TemplateSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Select Template</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
                className={`relative p-4 border-2 rounded-xl transition-all ${
                  selectedTemplate === template.id
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="aspect-[3/4] rounded-lg mb-3 overflow-hidden">
                  {template.preview}
                </div>
                <p className="font-medium text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500">{template.description}</p>
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClassicTemplatePreview({ className }: { className?: string }) {
  return (
    <div className={`bg-white p-3 ${className}`}>
      <div className="h-6 w-20 bg-slate-200 rounded mb-2"></div>
      <div className="h-3 w-14 bg-slate-100 rounded mb-1"></div>
      <div className="h-2 w-24 bg-slate-100 rounded mb-3"></div>
      <div className="h-2 w-full bg-slate-50 rounded mb-0.5"></div>
      <div className="h-2 w-full bg-slate-50 rounded mb-0.5"></div>
      <div className="h-2 w-2/3 bg-slate-50 rounded mb-3"></div>
      <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
    </div>
  );
}

export function ModernTemplatePreview({ className }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-slate-700 to-slate-800 p-3 ${className}`}>
      <div className="h-5 w-16 bg-white/20 rounded mb-2"></div>
      <div className="h-2 w-12 bg-white/10 rounded mb-1"></div>
      <div className="h-1.5 w-20 bg-white/10 rounded mb-3"></div>
      <div className="h-1.5 w-full bg-white/5 rounded mb-0.5"></div>
      <div className="h-1.5 w-full bg-white/5 rounded mb-0.5"></div>
      <div className="h-1.5 w-2/3 bg-white/5 rounded mb-3"></div>
      <div className="h-4 w-14 bg-white/20 rounded ml-auto"></div>
    </div>
  );
}