'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Sparkles, Copy, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageSection } from '@/types/page-builder';
import { getTemplateById } from '@/lib/page-builder/templates';

interface SectionCardProps {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (section: PageSection) => void;
  onDelete: (sectionId: string) => void;
  onCopy?: (section: PageSection) => void;
}

export function SectionCard({ section, isFirst, isLast, onEdit, onDelete, onCopy }: SectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const template = getTemplateById(section.templateId);
  
  const isCustomCode = section.type === 'custom-code';
  const sectionName = isCustomCode 
    ? (section.content?.sectionName || 'Custom Code')
    : (template?.name || section.type);
  const sectionDescription = isCustomCode
    ? 'Custom HTML/CSS Section'
    : (template?.description || `${section.type} section`);
  const TemplateIcon = isCustomCode ? Code : (template?.icon || Sparkles);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-xl border-2 transition-all duration-200',
        isDragging
          ? 'border-indigo-400 shadow-xl scale-105 z-50'
          : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
      )}
    >
      {/* Drag handle - visible on hover */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 py-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity',
          'touch-auto'
        )}
        aria-label="Drag to reorder"
      >
        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </div>
      </button>

      {/* Content */}
      <div className="flex items-center gap-4 p-4">
        {/* Icon/Preview */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 flex-shrink-0">
          <TemplateIcon className="h-6 w-6 text-indigo-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {sectionName}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              #{section.order + 1}
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">
            {sectionDescription}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(section)}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit section"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {onCopy && (
            <button
              onClick={() => onCopy(section)}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Copy section"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(section.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Order indicator arrow (subtle) */}
      {!isFirst && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </div>
      )}
      {!isLast && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
