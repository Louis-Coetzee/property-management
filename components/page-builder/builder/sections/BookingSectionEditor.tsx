'use client';

import { useState } from 'react';
import { Settings, Users, Check, Filter, SortAsc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingSectionEditorProps {
  content: any;
  onChange: (content: any) => void;
}

export function BookingSectionEditor({ content, onChange }: BookingSectionEditorProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'consultants' | 'display'>('general');

  const updateContent = (updates: any) => {
    onChange({ ...content, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all",
            activeTab === 'general'
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Settings className="w-4 h-4" />
          General
        </button>
        <button
          onClick={() => setActiveTab('consultants')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all",
            activeTab === 'consultants'
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Users className="w-4 h-4" />
          Consultants
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all",
            activeTab === 'display'
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Filter className="w-4 h-4" />
          Display
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={content?.title || ''}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Book a Service"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={content?.subtitle || ''}
              onChange={(e) => updateContent({ subtitle: e.target.value })}
              placeholder="Select a service and choose your preferred date and time"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {/* Consultants Tab */}
      {activeTab === 'consultants' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Consultant Selection</h4>
                <p className="text-xs text-amber-600 mt-1">
                  Control whether customers can choose their consultant or if the default consultant is used automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
              <input
                type="radio"
                name="consultantSelection"
                checked={content?.allowConsultantSelection !== false}
                onChange={() => updateContent({ allowConsultantSelection: true })}
                className="w-4 h-4 text-amber-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Allow Selection</p>
                <p className="text-xs text-slate-500">Customers can choose from available consultants</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
              <input
                type="radio"
                name="consultantSelection"
                checked={content?.allowConsultantSelection === false}
                onChange={() => updateContent({ allowConsultantSelection: false })}
                className="w-4 h-4 text-amber-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Use Default Consultant</p>
                <p className="text-xs text-slate-500">Automatically use the default consultant (set in Consultants page)</p>
              </div>
            </label>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            <p><strong>Note:</strong> Set a default consultant in the Consultants CRM page. If no default is set, the first available consultant will be used.</p>
          </div>
        </div>
      )}

      {/* Display Tab */}
      {activeTab === 'display' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Filter className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Display Settings</h4>
                <p className="text-xs text-blue-600 mt-1">
                  Control what elements are shown on the booking section.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Show Filters */}
            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Show Filters</p>
                  <p className="text-xs text-slate-500">Display category/type filters above services</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={content?.showFilters !== false}
                  onChange={(e) => updateContent({ showFilters: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </div>
            </label>

            {/* Show Sort */}
            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <SortAsc className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Show Sort Options</p>
                  <p className="text-xs text-slate-500">Display sort dropdown (price, duration, popularity)</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={content?.showSort !== false}
                  onChange={(e) => updateContent({ showSort: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </div>
            </label>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            <p><strong>Note:</strong> Filters and sort options help customers find services more easily when you have many services available.</p>
          </div>
        </div>
      )}
    </div>
  );
}