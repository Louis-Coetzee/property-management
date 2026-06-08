'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2, AlertCircle, CheckCircle, RotateCcw, Bot, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeAISectionCode } from '@/lib/page-builder/ai-sections';
import { deleteAISectionFromR2 } from '@/lib/cloudflare-r2';

interface AISectionEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export function AISectionEditor({ content, onChange }: AISectionEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewR2Url, setPreviewR2Url] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dots, setDots] = useState('');
  const [genStep, setGenStep] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const r2Url = content?.r2Url;
  const sectionFileId = content?.sectionFileId;
  const sectionName = content?.sectionName || 'AI Section';

  const genSteps = ['Analyzing', 'Designing', 'Styling', 'Finalizing'];

  useEffect(() => {
    if (isRegenerating) {
      const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
      let stepIdx = 0;
      setGenStep(genSteps[0]);
      const stepInterval = setInterval(() => {
        stepIdx = (stepIdx + 1) % genSteps.length;
        setGenStep(genSteps[stepIdx]);
      }, 1500);
      return () => { clearInterval(dotInterval); clearInterval(stepInterval); };
    } else { setDots(''); setGenStep(''); }
  }, [isRegenerating]);

  useEffect(() => {
    if (!r2Url) {
      setIsLoading(false);
      setError('No section URL found');
      return;
    }

    const fetchSection = async () => {
      try {
        const response = await fetch(r2Url);
        if (!response.ok) {
          throw new Error('Failed to load section');
        }
        const html = await response.text();
        setCurrentHtml(html);
        setError(null);
      } catch (err) {
        console.error('Error fetching AI section:', err);
        setError('Failed to load section content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSection();
  }, [r2Url]);

  const handleRegenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your changes');
      return;
    }

    setIsRegenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate section');
      }

      setPreviewHtml(data.htmlCode);
      setPreviewFileId(data.sectionFileId);
      setPreviewR2Url(data.r2Url);
    } catch (err) {
      console.error('AI regeneration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate section. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!previewHtml || !previewFileId || !previewR2Url) return;

    if (sectionFileId && sectionFileId !== previewFileId) {
      await deleteAISectionFromR2(sectionFileId);
    }

    onChange({
      ...content,
      sectionFileId: previewFileId,
      r2Url: previewR2Url,
      sectionName: sectionName,
      generatedAt: Date.now(),
      prompt: prompt,
    });

    setCurrentHtml(previewHtml);
    setPreviewHtml(null);
    setPreviewFileId(null);
    setPreviewR2Url(null);
    setPrompt('');
    setSuccess(true);
    setShowPreview(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDiscardChanges = async () => {
    if (previewFileId && previewFileId !== sectionFileId) {
      await deleteAISectionFromR2(previewFileId);
    }
    setPreviewHtml(null);
    setPreviewFileId(null);
    setPreviewR2Url(null);
    setPrompt('');
    setError(null);
  };

  const sanitizedHtml = currentHtml ? sanitizeAISectionCode(currentHtml) : '';

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!r2Url) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">No section URL found</p>
      </div>
    );
  }

  if (!currentHtml) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Section content not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-violet-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{sectionName}</h4>
            <p className="text-xs sm:text-sm text-slate-500">AI-Generated Section</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3"
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Changes applied successfully!</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Preview Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            showPreview
              ? 'bg-violet-100 text-violet-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          <span className="sm:hidden">{showPreview ? 'Hide' : 'Preview'}</span>
        </button>
        
        {previewHtml && (
          <span className="text-xs text-green-600 font-medium">New version ready</span>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <h4 className="text-sm font-semibold text-slate-900">
              {previewHtml ? 'New Preview' : 'Current Preview'}
            </h4>
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
            <div 
              className="min-h-[80px] max-h-[150px] sm:max-h-[200px] overflow-auto text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml ? sanitizeAISectionCode(previewHtml) : sanitizedHtml }}
            />
          </div>
        </motion.div>
      )}

      {/* New Version Actions */}
      {previewHtml && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">New version generated!</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleDiscardChanges}
              disabled={isRegenerating}
              className="flex-1 py-2 px-3 sm:px-4 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={handleApplyChanges}
              disabled={isRegenerating}
              className="flex-1 py-2 px-3 sm:px-4 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </motion.div>
      )}

      {/* Prompt Input */}
      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-violet-600" />
          <h4 className="text-sm font-semibold text-slate-900">Modify with AI</h4>
        </div>
        
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setError(null);
            }}
            placeholder="Describe what changes you want... (e.g., 'Make the heading larger, change background to gradient')"
            className={cn(
              'w-full h-20 sm:h-24 px-3 sm:px-4 py-2 sm:py-3 text-sm rounded-lg border-2 resize-none transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/20',
              error
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white hover:border-slate-300 focus:border-violet-500'
            )}
            disabled={isRegenerating}
          />
          
          {!isRegenerating ? (
            <button
              onClick={handleRegenerate}
              disabled={!prompt.trim() || isRegenerating}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
                !prompt.trim() || isRegenerating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Regenerate Section</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg border border-violet-100">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-25" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Generating{dots}</p>
                <p className="text-xs text-slate-600">{genStep}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Tips:</span> Be specific about colors, sizes, or layout. The AI regenerates the entire section.
        </p>
      </div>
    </div>
  );
}
