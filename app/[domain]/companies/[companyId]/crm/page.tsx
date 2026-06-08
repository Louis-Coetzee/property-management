'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthGuard } from '../../../AuthProvider';

export default function CRMPage() {
  const { isAuthenticated, isLoading, user } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  useEffect(() => {
    // Redirect to manage page after auth check completes
    if (!isLoading && user) {
      const timer = setTimeout(() => {
        router.push(`/companies/${companyId}/manage`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, companyId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Redirecting to Management Dashboard...</p>
      </div>
    </div>
  );
}
