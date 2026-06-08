'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Save, Loader2, ArrowLeft, Eye, AlertCircle, X, Trash2, MessageSquare, Copy, Check, RefreshCcw, Layers, MousePointer, Download } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { AddSectionModal } from '../AddSectionModal';
import { EditSectionPanel } from './EditSectionPanel';
import { PointerSettingsModal, DEFAULT_SETTINGS, type PointerSettings } from './PointerSettingsModal';
import {
  createSection,
  reorderSections,
  updateSectionContent,
  deleteSection,
  getNextOrderValue,
  stringifyPageContent,
} from '@/lib/page-builder/hooks/usePageContent';
import { getTemplateById } from '@/lib/page-builder/templates';
import type { PageSection, PageContent } from '@/types/page-builder';
import { cn } from '@/lib/utils';

interface PageDesignCanvasProps {
  pageId: string;
  initialSections: PageSection[];
  onSave: (content: string) => Promise<void>;
  isSaving?: boolean;
  onCancel?: () => void;
  previewUrl?: string;
  websiteId?: string;
  companyId?: string;
  userId?: string;
}

export function PageDesignCanvas({
  pageId,
  initialSections,
  onSave,
  isSaving = false,
  onCancel,
  previewUrl,
  websiteId,
  companyId,
  userId,
}: PageDesignCanvasProps) {
  const router = useRouter();
  const [sections, setSections] = useState<PageSection[]>(initialSections);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<PageSection | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showClearCanvasModal, setShowClearCanvasModal] = useState(false);
  const [showPointersModal, setShowPointersModal] = useState(false);
  const [pointerSettings, setPointerSettings] = useState<PointerSettings | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index,
      }));

      setSections(reordered);
      setHasChanges(true);
    }
  };

  const handleAddSection = async (templateId: string) => {
    setIsAdding(true);

    try {
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const newSection = createSection(
        template.type,
        template.id,
        template.defaultContent,
        getNextOrderValue(sections)
      );

      const updated = [...sections, newSection];
      setSections(updated);
      setHasChanges(true);
    } catch (error) {
      console.error('Error adding section:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddAISection = async (section: PageSection) => {
    setIsAdding(true);

    try {
      const updated = [...sections, section];
      setSections(updated);
      setHasChanges(true);
    } catch (error) {
      console.error('Error adding AI section:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    // Show confirmation modal instead of directly deleting
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionToDelete(section);
    }
  };

  const handleClearCanvas = () => {
    if (sections.length === 0) return;
    setShowClearCanvasModal(true);
  };

  const confirmClearCanvas = async () => {
    setSections([]);
    setPointerSettings(null);
    setShowClearCanvasModal(false);

    // Auto-save the empty canvas
    const pageContent: PageContent = {
      sections: [],
      version: '1.0',
      lastModified: Date.now(),
    };

    try {
      await onSave(stringifyPageContent(pageContent));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving cleared canvas:', error);
      setHasChanges(true);
    }
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    if (sectionToDelete.type === 'ai-generated' && sectionToDelete.content?.sectionFileId) {
      try {
        await fetch(`/api/ai-sections/${sectionToDelete.content.sectionFileId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error deleting AI section file:', err);
      }
    }

    const updated = deleteSection(sections, sectionToDelete.id);
    setSections(updated);
    setHasChanges(true);
    setSectionToDelete(null);
  };

  const handleCopySection = (section: PageSection) => {
    // Create a copy of the section with a new ID and updated order
    const newSection: PageSection = {
      ...section,
      id: `${section.type}-${Date.now()}`,
      order: getNextOrderValue(sections),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...sections, newSection];
    setSections(updated);
    setHasChanges(true);
  };

  const handleUpdateSection = (sectionId: string, content: Record<string, any>, settings?: Record<string, any>) => {
    console.log('[PageDesignCanvas] handleUpdateSection - sectionId:', sectionId);
    console.log('[PageDesignCanvas] handleUpdateSection - content.ctaText:', content.ctaText);
    const updated = updateSectionContent(sections, sectionId, content, settings);
    setSections(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const pageContent: PageContent = {
      sections,
      version: '1.0',
      lastModified: Date.now(),
      pointerSettings: pointerSettings || undefined,
    };

    await onSave(stringifyPageContent(pageContent));
    setHasChanges(false);
  };

  const handleExportHTML = async () => {
    if (sections.length === 0) {
      return;
    }

    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    
    const sectionHtmlParts: string[] = [];
    
    for (const section of sortedSections) {
      if (section.type === 'ai-generated' || section.type === 'custom-code') {
        const r2Url = section.content?.r2Url;
        if (r2Url) {
          try {
            const response = await fetch(r2Url);
            if (response.ok) {
              const html = await response.text();
              sectionHtmlParts.push(html);
            }
          } catch (err) {
            console.error('Error fetching section:', err);
          }
        }
      } else {
        const template = getTemplateById(section.templateId);
        if (template?.defaultContent) {
          const defaultHtml = Object.values(template.defaultContent).join('\n');
          sectionHtmlParts.push(`<!-- ${template.name} Section -->\n${defaultHtml}`);
        }
      }
    }

    const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>
${sectionHtmlParts.join('\n\n')}
</body>
</html>`;

    const blob = new Blob([completeHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-export-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAndLeave = async () => {
    await handleSave();
    setShowUnsavedChangesModal(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleDiscardAndLeave = () => {
    setShowUnsavedChangesModal(false);
    setHasChanges(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowUnsavedChangesModal(true);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleFormsClick = () => {
    if (hasChanges) {
      // Store the navigation action and show the unsaved changes modal
      pendingNavigationRef.current = () => {
        router.push(`/companies/${companyId}/websites/${websiteId}/forms`);
      };
      setShowUnsavedChangesModal(true);
    } else {
      // No unsaved changes, navigate directly
      router.push(`/companies/${companyId}/websites/${websiteId}/forms`);
    }
  };

  // Warn before browser unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  onClick={handleCancelClick}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">Page Design</h1>
                <p className="text-sm text-slate-600">
                  {sections.length} {sections.length === 1 ? 'section' : 'sections'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
              </button>

              {companyId && websiteId && (
                <button
                  onClick={handleFormsClick}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Forms</span>
                </button>
              )}

              {companyId && websiteId && (
                <button
                  onClick={() => setShowPointersModal(true)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  <MousePointer className="h-4 w-4" />
                  <span className="hidden sm:inline">Pointers</span>
                </button>
              )}

              {sections.length > 0 && (
                <button
                  onClick={() => setShowClearCanvasModal(true)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm"
                >
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear Canvas</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                  'inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm',
                  hasChanges && !isSaving
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportHTML}
                disabled={sections.length === 0}
                className={cn(
                  'inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm',
                  sections.length > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasChanges && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Empty State */}
          {sections.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Start Building Your Page</h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Add sections to your page by clicking the button below. You can rearrange them however you like.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                <Plus className="h-5 w-5" />
                Add Your First Section
              </button>
            </div>
          ) : (
            <>
              {/* Sections List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-8 mb-8">
                    {sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <SectionCard
                          key={section.id}
                          section={section}
                          isFirst={index === 0}
                          isLast={index === sections.length - 1}
                          onEdit={setEditingSection}
                          onDelete={handleDeleteSection}
                          onCopy={handleCopySection}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Section Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Section
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddSectionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSection}
        onAddAISection={handleAddAISection}
        isAdding={isAdding}
      />

      {editingSection && (
        <EditSectionPanel
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleUpdateSection}
          websiteId={websiteId}
          userId={userId}
        />
      )}

      {/* Delete Confirmation Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Delete Section</h3>
              </div>
              <button
                onClick={() => setSectionToDelete(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Confirm Deletion</p>
                  <p className="text-sm text-slate-600">
                    Are you sure you want to delete <span className="font-semibold text-slate-900">{getTemplateById(sectionToDelete.templateId)?.name || sectionToDelete.type}</span>?
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. The section will be permanently removed from your page.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSectionToDelete(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSection}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Save className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Unsaved Changes</h3>
              </div>
              <button
                onClick={() => setShowUnsavedChangesModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">You have unsaved changes</p>
                  <p className="text-sm text-slate-600">
                    Do you want to save your changes before leaving? Your changes will be lost if you don't save them.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowUnsavedChangesModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscardAndLeave}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors order-3 sm:order-2"
                >
                  Don't Save
                </button>
                <button
                  onClick={handleSaveAndLeave}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 order-1 sm:order-3"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Canvas Modal */}
      {showClearCanvasModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Clear Canvas</h3>
              </div>
              <button
                onClick={() => setShowClearCanvasModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Clear all sections?</p>
                  <p className="text-sm text-slate-600">
                    This will remove all <span className="font-semibold text-slate-900">{sections.length} {sections.length === 1 ? 'section' : 'sections'}</span> from your canvas.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  This action cannot be undone. You will need to add sections again to rebuild your page.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowClearCanvasModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearCanvas}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" />
                  Clear All Sections
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pointer Settings Modal */}
      <PointerSettingsModal
        isOpen={showPointersModal}
        onClose={() => setShowPointersModal(false)}
        settings={pointerSettings}
        onSave={(settings) => {
          setPointerSettings(settings);
          setHasChanges(true);
        }}
      />
    </div>
  );
}
