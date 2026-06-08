'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageRenderer } from '@/components/page-builder/renderer/PageRenderer';
import { getPageTemplateById, type PageTemplate } from '@/lib/page-builder/templates/page-templates';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TemplatePreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<PageTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get template from sessionStorage first (for custom previews)
    const storedTemplate = sessionStorage.getItem('previewTemplate');
    if (storedTemplate) {
      try {
        const parsed = JSON.parse(storedTemplate);
        setTemplate(parsed);
        sessionStorage.removeItem('previewTemplate');
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse stored template:', e);
      }
    }

    // Fall back to getting template by ID
    const foundTemplate = getPageTemplateById(templateId);
    if (foundTemplate) {
      setTemplate(foundTemplate);
    }
    setLoading(false);
  }, [templateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Template Not Found</h1>
          <p className="text-slate-600 mb-6">The template you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Preview Mode</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-sm">{template.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              This is a preview of how your page will look
            </span>
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content with top padding for banner */}
      <div className="pt-12">
        <PageRenderer sections={template.sections} />
      </div>
    </div>
  );
}
