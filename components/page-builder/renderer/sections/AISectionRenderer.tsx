'use client';

import { useState, useEffect, useRef } from 'react';
import type { SectionSettings } from '@/types/page-builder';

interface AISectionRendererProps {
  content: any;
  settings?: SectionSettings;
  currentPageSlug?: string;
  websiteId?: string;
  templateId?: string;
  sectionId?: string;
  homePageSlug?: string;
}

export function AISectionRenderer({ content, sectionId }: AISectionRendererProps) {
  const [htmlCode, setHtmlCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(content?.minHeight || 600);

  let r2Url: string | null = null;
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      r2Url = parsed?.r2Url || null;
    } catch {
      r2Url = null;
    }
  } else if (content && typeof content === 'object') {
    r2Url = content.r2Url || null;
  }

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
        setHtmlCode(html);
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

  useEffect(() => {
    if (!htmlCode || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'resize' && event.data?.height) {
        setIframeHeight(event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlCode);
      doc.close();

      const resizeScript = doc.createElement('script');
      resizeScript.textContent = `
        (function() {
          function sendHeight() {
            var height = Math.max(
              document.body.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.scrollHeight,
              document.documentElement.offsetHeight,
              window.innerHeight
            );
            parent.postMessage({ type: 'resize', height: height }, '*');
          }
          sendHeight();
          window.addEventListener('resize', sendHeight);
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', sendHeight);
          }
          setTimeout(sendHeight, 100);
          setTimeout(sendHeight, 500);
          setTimeout(sendHeight, 2000);
        })();
      `;
      doc.body.appendChild(resizeScript);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlCode]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (error || !htmlCode) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">{error || 'No content to display'}</p>
      </div>
    );
  }

  return (
    <div
      id={sectionId ? `ai-section-${sectionId}` : undefined}
      className="relative w-full"
      style={{ minHeight: content?.minHeight || '400px' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full border-0"
        style={{ height: isLoading ? '400px' : `${iframeHeight}px`, minHeight: '100px' }}
        title="AI Generated Section"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export default AISectionRenderer;
