'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code, Loader2, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteAISectionFromR2 } from '@/lib/cloudflare-r2';

interface CustomCodeEditorProps {
  content: any;
  onChange: (content: any) => void;
  onSaveAndClose?: () => void;
}

export function CustomCodeEditor({ content, onChange, onSaveAndClose }: CustomCodeEditorProps) {
  const [code, setCode] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const r2Url = content?.r2Url;
  const codeFileId = content?.codeFileId;
  const currentSectionName = content?.sectionName || 'Custom Code';

  console.log('[CustomCodeEditor] Render, content:', content, 'r2Url:', r2Url);

  useEffect(() => {
    if (!r2Url) {
      setIsLoading(false);
      return;
    }

    const fetchCode = async () => {
      try {
        const response = await fetch(r2Url);
        if (!response.ok) {
          throw new Error('Failed to load code');
        }
        const html = await response.text();
        setCode(html);
        setSectionName(currentSectionName);
      } catch (err) {
        console.error('Error fetching custom code:', err);
        setError('Failed to load code content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCode();
  }, [r2Url, currentSectionName]);

  const handleSave = async () => {
    console.log('[CustomCodeEditor] handleSave called');
    alert('Button clicked! Code: ' + code.substring(0, 50));
    
    if (!code.trim()) {
      setError('Please enter some code');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('[CustomCodeEditor] Saving code, sectionName:', sectionName.trim() || 'Custom Code');
      
      const response = await fetch('/api/custom-code/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          sectionName: sectionName.trim() || 'Custom Code',
        }),
      });

      console.log('[CustomCodeEditor] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CustomCodeEditor] Error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('[CustomCodeEditor] Response text:', text);
      
      const data = JSON.parse(text);
      console.log('[CustomCodeEditor] Response data:', data);

      const newContent = {
        ...content,
        codeFileId: data.codeFileId,
        r2Url: data.r2Url,
        sectionName: sectionName.trim() || 'Custom Code',
        code: code.trim(),
        updatedAt: Date.now(),
      };

      console.log('[CustomCodeEditor] New content:', newContent);
      
      onChange(newContent);
      
      setSuccess(true);
      
      if (onSaveAndClose) {
        setTimeout(() => {
          onSaveAndClose();
        }, 500);
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[CustomCodeEditor] Error saving custom code:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-5 border border-emerald-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{currentSectionName}</h4>
            <p className="text-xs text-slate-500">Custom HTML/CSS Section</p>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Add your own custom HTML, CSS, and JavaScript code. The code is stored securely and rendered on your website.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3"
        >
          <CheckCircle className="w-4 h-4" />
          Changes saved successfully!
        </motion.div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Section Name
        </label>
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="Enter a name for this section"
          className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          disabled={isSaving}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Custom Code (HTML/CSS/JS)
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="<section>&#10;  <div class='my-section'>&#10;    <h2>Welcome to My Website</h2>&#10;    <p>This is custom HTML code.</p>&#10;  </div>&#10;</section>&#10;&#10;Or paste your Tailwind classes..."
          className={cn(
            'w-full h-64 px-4 py-3 text-sm rounded-xl border-2 font-mono resize-none transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            error
              ? 'border-red-300 bg-red-50'
              : 'border-slate-200 bg-white focus:border-emerald-500'
          )}
          disabled={isSaving}
        />
        <p className="text-xs text-slate-500">
          Supports HTML, CSS (in &lt;style&gt; tags), and JavaScript (in &lt;script&gt; tags)
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={!code.trim() || isSaving}
        className={cn(
          'w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
          !code.trim() || isSaving
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Tips:</span>
        </p>
        <ul className="mt-2 text-xs text-slate-500 space-y-1">
          <li>• Use Tailwind CSS classes for styling</li>
          <li>• Add &lt;style&gt; tags for custom CSS</li>
          <li>• Add &lt;script&gt; tags for JavaScript functionality</li>
          <li>• Ensure your code is complete and self-contained</li>
        </ul>
      </div>
    </div>
  );
}
// Force rebuild
