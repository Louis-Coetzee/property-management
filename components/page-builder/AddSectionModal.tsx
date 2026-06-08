'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { CategoryStep } from './CategoryStep';
import { TemplateStep } from './TemplateStep';
import { AIGenerationStep } from './AIGenerationStep';
import { CustomCodeStep } from './CustomCodeStep';
import { getTemplatesByType } from '@/lib/page-builder/templates';
import { createAISection, createCustomCodeSection } from '@/lib/page-builder/ai-sections';
import type { SectionType, PageSection } from '@/types/page-builder';

type Step = 'category' | 'template' | 'ai-generation' | 'custom-code';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (templateId: string) => Promise<void>;
  onAddAISection?: (section: PageSection) => Promise<void>;
  isAdding?: boolean;
}

export function AddSectionModal({ isOpen, onClose, onAdd, onAddAISection, isAdding }: AddSectionModalProps) {
  const [step, setStep] = useState<Step>('category');
  const [selectedType, setSelectedType] = useState<SectionType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState(0);

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep('category');
      setSelectedType(null);
      setSelectedTemplateId(null);
    }
  };

  if (!isOpen) return null;

  const handleTypeSelect = (type: SectionType) => {
    setSelectedType(type);
    if (type === 'ai-generated') {
      setStep('ai-generation');
    } else if (type === 'custom-code') {
      setStep('custom-code');
    } else {
      setStep('template');
    }
  };

  const handleBack = () => {
    setStep('category');
    setSelectedTemplateId(null);
  };

  const handleAISectionGenerated = async (sectionFileId: string, sectionName: string, previewHtml: string, r2Url: string) => {
    if (!onAddAISection) return;

    const section = createAISection({
      prompt: '',
      sectionFileId,
      r2Url,
      generatedAt: Date.now(),
      sectionName,
    }, currentOrder);

    await onAddAISection(section);
    setStep('category');
    setSelectedType(null);
    onClose();
  };

  const handleCustomCodeGenerated = async (codeFileId: string, sectionName: string, code: string, r2Url: string) => {
    if (!onAddAISection) return;

    const section = createCustomCodeSection({
      codeFileId,
      r2Url,
      code,
      sectionName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }, currentOrder);

    await onAddAISection(section);
    setStep('category');
    setSelectedType(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!selectedTemplateId) return;

    await onAdd(selectedTemplateId);
    // Reset and close after successful add
    setStep('category');
    setSelectedType(null);
    setSelectedTemplateId(null);
    onClose();
  };

  const templates = selectedType ? getTemplatesByType(selectedType) : [];
  const canAdd = selectedTemplateId !== null && !isAdding;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
              {step === 'category' ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {step === 'category' ? 'Add Section' : step === 'ai-generation' ? 'Generate with AI' : step === 'custom-code' ? 'Custom Code' : 'Select Template'}
            </h3>
          </div>
          <button
            onClick={() => {
              handleOpenChange(false);
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content with slide animation */}
        <div className="flex-1 overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {step === 'category' ? (
              <motion.div
                key="category"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar"
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                <CategoryStep
                  selectedType={selectedType}
                  onTypeSelect={handleTypeSelect}
                />
              </motion.div>
            ) : step === 'ai-generation' ? (
              <motion.div
                key="ai-generation"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar"
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                <AIGenerationStep
                  onBack={handleBack}
                  onGenerated={handleAISectionGenerated}
                  isAdding={isAdding}
                />
              </motion.div>
            ) : step === 'custom-code' ? (
              <motion.div
                key="custom-code"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar"
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                <CustomCodeStep
                  onBack={handleBack}
                  onGenerated={handleCustomCodeGenerated}
                  isAdding={isAdding}
                />
              </motion.div>
            ) : (
              <motion.div
                key="template"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar"
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                <TemplateStep
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onTemplateSelect={setSelectedTemplateId}
                  onBack={handleBack}
                  sectionTypeName={selectedType || ''}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <div className="text-sm text-slate-600">
            {step === 'template' && (
              <span className="font-medium">Selected: </span>
            )}
            {step === 'template' && selectedTemplateId ? (
              <span className="text-slate-900">
                {templates.find((t) => t.id === selectedTemplateId)?.name}
              </span>
            ) : step === 'template' ? (
              <span className="text-slate-400">Choose a template</span>
            ) : step === 'ai-generation' ? (
              <span className="text-slate-400">Describe your section</span>
            ) : step === 'custom-code' ? (
              <span className="text-slate-400">Enter your custom code</span>
            ) : (
              <span>Step 1 of 2</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            {(step === 'template' || step === 'ai-generation' || step === 'custom-code') && (
              <button
                onClick={handleBack}
                disabled={isAdding}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'template' && (
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className="px-4 sm:px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-slate-900/20 flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Add Section</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
