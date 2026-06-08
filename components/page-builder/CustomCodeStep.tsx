'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomCodeStepProps {
  onBack: () => void;
  onGenerated: (codeFileId: string, sectionName: string, code: string, r2Url: string) => Promise<void>;
  isAdding?: boolean;
}

export function CustomCodeStep({ onBack, onGenerated, isAdding }: CustomCodeStepProps) {
  const [code, setCode] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddSection = async () => {
    if (!code.trim()) {
      setError('Please enter some HTML/CSS code');
      return;
    }

    if (!sectionName.trim()) {
      setError('Please enter a section name');
      return;
    }

    try {
      const response = await fetch('/api/custom-code/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          sectionName: sectionName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload custom code');
      }

      await onGenerated(data.codeFileId, sectionName, code, data.r2Url);
    } catch (err) {
      console.error('Custom code upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload custom code. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
            <Code className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Custom Code</h3>
        </div>
        <p className="text-sm text-slate-600">
          Paste your own HTML, CSS, or JavaScript code to create a custom section
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Section Name
        </label>
        <input
          type="text"
          value={sectionName}
          onChange={(e) => {
            setSectionName(e.target.value);
            setError(null);
          }}
          className={cn(
            'w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            error ? 'border-red-300 bg-red-50' : ''
          )}
          placeholder="Enter a name for this section"
          disabled={isAdding}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Custom Code (HTML/CSS/JS)
        </label>
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder={`<!-- Example: Paste your HTML here -->
<section class="bg-gradient-to-r from-blue-500 to-purple-600 p-8">
  <h2 class="text-3xl font-bold text-white">Your Content</h2>
  <p class="text-white/80">Add your custom HTML, CSS, and JavaScript</p>
</section>`}
          className={cn(
            'w-full h-64 px-4 py-3 text-sm font-mono rounded-xl border-2 resize-none transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            'bg-slate-900 text-green-400',
            error ? 'border-red-300' : 'border-slate-700'
          )}
          disabled={isAdding}
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

      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
        <p className="text-xs text-emerald-700">
          <span className="font-semibold">Tips:</span>
        </p>
        <ul className="mt-2 text-xs text-emerald-600 space-y-1">
          <li>• Use Tailwind CSS classes for styling</li>
          <li>• Include inline styles or &lt;style&gt; tags for custom CSS</li>
          <li>• Add &lt;script&gt; tags for JavaScript functionality</li>
          <li>• Ensure your code is complete and self-contained</li>
        </ul>
      </div>

      <button
        onClick={handleAddSection}
        disabled={!code.trim() || !sectionName.trim() || isAdding}
        className={cn(
          'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
          !code.trim() || !sectionName.trim() || isAdding
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
            <span>Add Custom Section</span>
          </>
        )}
      </button>
    </div>
  );
}
