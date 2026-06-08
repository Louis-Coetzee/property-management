'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageDesignCanvas } from '@/components/page-builder/builder/PageDesignCanvas';
import { parsePageContent } from '@/lib/page-builder/hooks/usePageContent';
import { useAuthGuard } from '@/app/[domain]/AuthProvider';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function PageCanvasPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const companyId = params.companyId as string;
  const websiteId = params.websiteId as string;

  const [isSaving, setIsSaving] = useState(false);

  // Query page data - only fetch when user is available
  const page = useQuery(
    api.pages.getPageById,
    user ? { userId: user.id as any, pageId: pageId as any } : "skip"
  );
  const updatePage = useMutation(api.pages.updatePage);

  // Parse page content
  const pageContent = page?.content ? parsePageContent(page.content) : null;
  const sections = pageContent?.sections ?? [];

  const handleSave = async (contentJson: string) => {
    setIsSaving(true);

    try {
      console.log('[CanvasPage] handleSave - contentJson length:', contentJson.length);
      console.log('[CanvasPage] handleSave - checking for ctaText in saved content:', contentJson.includes('ctaText'));
      
      await updatePage({
        userId: user?.id as any,
        pageId: pageId as any,
        content: contentJson,
        contentType: 'pageBuilder'});

      toast.success('Page saved successfully!');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/companies/${companyId}/websites/${websiteId}/pages`);
  };

  // Get preview URL
  const getPreviewUrl = () => {
    if (!page) return undefined;
    // Use the first domain of the website
    return `https://example.com/${page.slug}`; // Placeholder - should use actual domain
  };

  if (isLoading || (!page && page !== undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }

    // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
          <p className="text-slate-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Verify ownership
  if (page.createdBy !== user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to edit this page.</p>
        </div>
      </div>
    );
  }

  return (
    <PageDesignCanvas
      pageId={pageId}
      initialSections={sections}
      onSave={handleSave}
      isSaving={isSaving}
      onCancel={handleCancel}
      previewUrl={getPreviewUrl()}
      websiteId={websiteId}
      companyId={companyId}
      userId={user?.id}
    />
  );
}
