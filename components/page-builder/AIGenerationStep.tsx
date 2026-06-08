'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2, AlertCircle, CheckCircle, ArrowLeft, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIGenerationStepProps {
  onBack: () => void;
  onGenerated: (sectionFileId: string, sectionName: string, previewHtml: string, r2Url: string) => Promise<void>;
  isAdding?: boolean;
}

const EXAMPLE_PROMPTS = [
  'A modern hero section with gradient background and animated text',
  'A team members grid with hover effects and social links',
  'A testimonials carousel with star ratings',
  'A features section with icons and animated cards',
  'A pricing table with highlighted popular plan',
  'A call-to-action banner with gradient and pulse animation',
];

export function AIGenerationStep({ onBack, onGenerated, isAdding }: AIGenerationStepProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sectionFileId, setSectionFileId] = useState<string | null>(null);
  const [r2Url, setR2Url] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [generationStep, setGenerationStep] = useState('');

  // Animated dots for loading text
  const [dots, setDots] = useState('');
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setDots(d => d.length >= 3 ? '' : d + '.');
      }, 400);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isGenerating]);

  // Generation step messages
  useEffect(() => {
    if (isGenerating) {
      const steps = [
        'Analyzing your request',
        'Designing the layout',
        'Applying styles',
        'Adding animations',
        'Finalizing the section',
      ];
      let stepIndex = 0;
      setGenerationStep(steps[0]);
      
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setGenerationStep(steps[stepIndex]);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    } else {
      setGenerationStep('');
    }
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your section');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreviewHtml(null);
    setSectionFileId(null);
    setR2Url(null);

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
        console.error('AI API error response:', data);
        const errorMsg = data.error || 'Failed to generate section';
        const details = data.details ? `\nDetails: ${data.details}` : '';
        const endpoint = data.endpoint ? `\nEndpoint: ${data.endpoint}` : '';
        throw new Error(`${errorMsg}${details}${endpoint}`);
      }

      const name = data.sectionName || extractSectionName(prompt);

      setSectionFileId(data.sectionFileId);
      setR2Url(data.r2Url);
      setSectionName(name);
      setPreviewHtml(data.htmlCode);
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate section. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSection = async () => {
    if (!sectionFileId || !previewHtml || !r2Url) return;

    try {
      await onGenerated(sectionFileId, sectionName, previewHtml, r2Url);
    } catch (err) {
      console.error('Error adding section:', err);
      setError('Failed to add section. Please try again.');
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setError(null);
    setPreviewHtml(null);
    setSectionFileId(null);
    setR2Url(null);
  };

  const extractSectionName = (text: string): string => {
    const words = text.split(' ').slice(0, 4).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Generate with AI</h3>
        </div>
        <p className="text-sm text-slate-600">
          Describe the section you want to create and our AI will generate it for you
        </p>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Section Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setError(null);
            setPreviewHtml(null);
          }}
          placeholder="Describe the section you want to create... (e.g., 'A modern hero section with a gradient background, large heading, and two CTA buttons')"
          className={cn(
            'w-full h-32 px-4 py-3 text-sm rounded-xl border-2 resize-none transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/20',
            error
              ? 'border-red-300 bg-red-50'
              : 'border-slate-200 bg-white hover:border-slate-300 focus:border-violet-500'
          )}
          disabled={isGenerating || isAdding}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </div>

      {/* Example Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium">Quick examples:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={isGenerating || isAdding}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      {!isGenerating ? (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating || isAdding}
          className={cn(
            'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
            !prompt.trim() || isGenerating || isAdding
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 hover:shadow-xl'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating{dots}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Section</span>
            </>
          )}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 px-6 bg-gradient-to-br from-violet-50 via-indigo-50 to-white rounded-2xl border border-violet-100 shadow-lg"
        >
          {/* Animated icon */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-300">
                <Bot className="w-10 h-10 text-white" />
              </div>
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-30" />
              <div className="absolute -inset-2 rounded-full bg-indigo-400 animate-pulse opacity-20" />
            </div>

            {/* Status text */}
            <h4 className="text-lg font-semibold text-slate-900 mb-2">
              Generating Your Section{dots}
            </h4>
            <p className="text-sm text-slate-600 mb-6">
              {generationStep}
            </p>

            {/* Progress indicator */}
            <div className="w-full max-w-xs">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 8,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </div>

            {/* Tips while waiting */}
            <div className="mt-6 text-xs text-slate-500 text-center">
              <p>This may take a few seconds</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      {previewHtml && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Section generated successfully!</span>
          </div>

          {/* Section Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Section Name
            </label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 bg-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter a name for this section"
              disabled={isAdding}
            />
          </div>

          {/* Preview Frame */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Preview
            </label>
            <div className="relative rounded-xl border-2 border-slate-200 overflow-hidden bg-white">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md">
                  Preview
                </span>
              </div>
              <div
                className="min-h-[200px] max-h-[400px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddSection}
            disabled={isAdding}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
              isAdding
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
            )}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Adding Section...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Section to Page</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Tips */}
      <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
        <p className="text-xs text-violet-700">
          <span className="font-semibold">Tips for better results:</span>
        </p>
        <ul className="mt-2 text-xs text-violet-600 space-y-1">
          <li>• Be specific about layout, colors, and content</li>
          <li>• Mention responsive design requirements</li>
          <li>• Describe any animations or interactions you want</li>
          <li>• Include the type of content (text, images, buttons)</li>
        </ul>
      </div>
    </div>
  );
}
