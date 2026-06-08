'use client';

import { useState } from 'react';
import { useAuthGuard } from '../AuthProvider';
import MediaLibraryModal from '@/components/media-library-modal';

export default function MediaLibraryPage() {
  const { isAuthenticated, user } = useAuthGuard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Spacer */}
      <div className="h-16"></div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Media Library</h1>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Manage your media files, images, and assets all in one place. Upload, organize, and access your files from anywhere.
          </p>

          {/* Open Media Library Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 text-lg font-semibold text-white bg-blue-900 rounded-xl transition-colors shadow-lg hover:bg-blue-950"
          >
            Open Media Library
          </button>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        userId={user?.id || ''}
        onSelectImage={() => {}}
        open={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
      />
    </div>
  );
}
