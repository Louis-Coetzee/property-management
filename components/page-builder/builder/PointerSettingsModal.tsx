'use client';

import { useState, useEffect } from 'react';
import { X, MousePointer, Circle, Square, Triangle, Sparkles, Palette, Sliders, RotateCcw, Car, CircleDot, Key, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PointerSettings {
  enabled: boolean;
  type: 'default' | 'circle' | 'dot' | 'arrow' | 'car' | 'steering' | 'key' | 'pin' | 'custom';
  size: number; // 16-64
  color: string;
  borderColor: string;
  trailEnabled: boolean;
  trailLength: number; // 3-20
  trailColor: string;
  hoverScale: number; // 1.0-1.5
  clickEffect: boolean;
}

const DEFAULT_SETTINGS: PointerSettings = {
  enabled: false,
  type: 'circle',
  size: 24,
  color: '#dc2626',
  borderColor: '#ffffff',
  trailEnabled: false,
  trailLength: 8,
  trailColor: '#dc2626',
  hoverScale: 1.2,
  clickEffect: true,
};

const POINTER_TYPES = [
  { id: 'default', label: 'Default', icon: MousePointer, description: 'System cursor' },
  { id: 'circle', label: 'Circle', icon: Circle, description: 'Modern circle cursor' },
  { id: 'dot', label: 'Dot', icon: Circle, description: 'Minimal dot cursor' },
  { id: 'arrow', label: 'Arrow', icon: Triangle, description: 'Custom arrow cursor' },
  { id: 'car', label: 'Car', icon: Car, description: 'Sports car cursor' },
  { id: 'steering', label: 'Steering Wheel', icon: CircleDot, description: 'Steering wheel cursor' },
  { id: 'key', label: 'Car Key', icon: Key, description: 'Car key fob cursor' },
  { id: 'pin', label: 'Location', icon: MapPin, description: 'Map pin cursor' },
];

const PRESET_COLORS = [
  { name: 'Red', color: '#dc2626' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Pink', color: '#db2777' },
  { name: 'Teal', color: '#0d9488' },
  { name: 'Dark', color: '#1f2937' },
];

interface PointerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PointerSettings | null;
  onSave: (settings: PointerSettings) => void;
}

export function PointerSettingsModal({ isOpen, onClose, settings, onSave }: PointerSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<PointerSettings>(settings || DEFAULT_SETTINGS);

  useEffect(() => {
    setLocalSettings(settings || DEFAULT_SETTINGS);
  }, [settings, isOpen]);

  const updateSetting = <K extends keyof PointerSettings>(key: K, value: PointerSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200">
              <MousePointer className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Pointer Settings</h3>
              <p className="text-xs text-slate-500">Customize cursor appearance on your page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                localSettings.enabled ? "bg-green-100" : "bg-slate-200"
              )}>
                <Sparkles className={cn(
                  "h-5 w-5",
                  localSettings.enabled ? "text-green-600" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Enable Custom Pointer</p>
                <p className="text-xs text-slate-500">Replace default cursor with custom style</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('enabled', !localSettings.enabled)}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                localSettings.enabled ? "bg-green-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow",
                  localSettings.enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {localSettings.enabled && (
            <>
              {/* Pointer Type */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MousePointer className="h-4 w-4 text-slate-500" />
                  Pointer Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {POINTER_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = localSettings.type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => updateSetting('type', type.id as any)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-center",
                          isSelected
                            ? "border-red-500 bg-red-50 shadow-lg shadow-red-100"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-red-100" : "bg-slate-100"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-red-600" : "text-slate-600"
                          )} />
                        </div>
                        <p className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-red-900" : "text-slate-700"
                        )}>
                          {type.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Sliders className="h-4 w-4 text-slate-500" />
                    Pointer Size
                  </label>
                  <span className="text-sm font-medium text-slate-600">{localSettings.size}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="64"
                  value={localSettings.size}
                  onChange={(e) => updateSetting('size', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Small (16px)</span>
                  <span>Large (64px)</span>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Palette className="h-4 w-4 text-slate-500" />
                  Pointer Colors
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Primary Color</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => updateSetting('color', preset.color)}
                          className={cn(
                            "w-8 h-8 rounded-lg transition-all",
                            localSettings.color === preset.color
                              ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                              : "hover:scale-105"
                          )}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={localSettings.color}
                        onChange={(e) => updateSetting('color', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-200"
                        title="Custom color"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">Border Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localSettings.borderColor}
                        onChange={(e) => updateSetting('borderColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-2 border-slate-200"
                      />
                      <input
                        type="text"
                        value={localSettings.borderColor}
                        onChange={(e) => updateSetting('borderColor', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trail Effect */}
              <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Trail Effect</p>
                    <p className="text-xs text-slate-500">Add a trailing effect to your cursor</p>
                  </div>
                  <button
                    onClick={() => updateSetting('trailEnabled', !localSettings.trailEnabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      localSettings.trailEnabled ? "bg-red-600" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
                        localSettings.trailEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {localSettings.trailEnabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-600">Trail Length</label>
                      <span className="text-xs font-medium text-slate-600">{localSettings.trailLength} dots</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={localSettings.trailLength}
                      onChange={(e) => updateSetting('trailLength', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <label className="text-xs font-medium text-slate-600">Trail Color</label>
                      <input
                        type="color"
                        value={localSettings.trailColor}
                        onChange={(e) => updateSetting('trailColor', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Effects */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900">Hover Scale</p>
                    <span className="text-xs font-medium text-slate-600">{localSettings.hoverScale}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.5"
                    step="0.1"
                    value={localSettings.hoverScale}
                    onChange={(e) => updateSetting('hoverScale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <p className="text-xs text-slate-500 mt-2">Cursor grows when hovering clickable elements</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Click Effect</p>
                      <p className="text-xs text-slate-500">Ripple animation on click</p>
                    </div>
                    <button
                      onClick={() => updateSetting('clickEffect', !localSettings.clickEffect)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        localSettings.clickEffect ? "bg-red-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
                          localSettings.clickEffect ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs font-medium text-slate-500 mb-3 text-center">Preview</p>
                <div className="flex items-center justify-center h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl relative overflow-hidden">
                  {localSettings.type === 'default' ? (
                    <MousePointer className="text-slate-400" style={{ width: localSettings.size, height: localSettings.size }} />
                  ) : localSettings.type === 'circle' ? (
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: localSettings.size,
                        height: localSettings.size,
                        backgroundColor: localSettings.color,
                        border: `2px solid ${localSettings.borderColor}`,
                        transform: `scale(${localSettings.hoverScale})`,
                      }}
                    />
                  ) : localSettings.type === 'dot' ? (
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width: localSettings.size / 2,
                        height: localSettings.size / 2,
                        backgroundColor: localSettings.color,
                        transform: `scale(${localSettings.hoverScale})`,
                      }}
                    />
                  ) : localSettings.type === 'arrow' ? (
                    <svg
                      width={localSettings.size}
                      height={localSettings.size}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ transform: `scale(${localSettings.hoverScale})` }}
                    >
                      <path
                        d="M5 3L19 12L12 14L9 21L5 3Z"
                        fill={localSettings.color}
                        stroke={localSettings.borderColor}
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : localSettings.type === 'car' ? (
                    <svg
                      width={localSettings.size * 1.5}
                      height={localSettings.size}
                      viewBox="0 0 24 16"
                      fill="none"
                      style={{ transform: `scale(${localSettings.hoverScale})` }}
                    >
                      <path
                        d="M2 10C2 9 3 8 4 8H5L6.5 5C7 4 8 3.5 9 3.5H15C16 3.5 17 4 17.5 5L19 8H20C21 8 22 9 22 10V12C22 12.5 21.5 13 21 13H20C20 14.1 19.1 15 18 15C16.9 15 16 14.1 16 13H8C8 14.1 7.1 15 6 15C4.9 15 4 14.1 4 13H3C2.5 13 2 12.5 2 12V10Z"
                        fill={localSettings.color}
                        stroke={localSettings.borderColor}
                        strokeWidth="1"
                      />
                      <circle cx="6" cy="11" r="1.5" fill={localSettings.borderColor} />
                      <circle cx="18" cy="11" r="1.5" fill={localSettings.borderColor} />
                    </svg>
                  ) : localSettings.type === 'steering' ? (
                    <svg
                      width={localSettings.size}
                      height={localSettings.size}
                      viewBox="0 0 32 32"
                      fill="none"
                      style={{ transform: `scale(${localSettings.hoverScale})` }}
                    >
                      {/* Outer rim with gradient effect */}
                      <circle cx="16" cy="16" r="13" stroke={localSettings.color} strokeWidth="4" fill="none" />
                      <circle cx="16" cy="16" r="11" stroke={localSettings.borderColor} strokeWidth="1" fill="none" opacity="0.3" />
                      {/* Inner rim detail */}
                      <circle cx="16" cy="16" r="9" stroke={localSettings.color} strokeWidth="1.5" fill="none" opacity="0.5" />
                      {/* Center hub */}
                      <circle cx="16" cy="16" r="4" fill={localSettings.color} />
                      <circle cx="16" cy="16" r="2.5" fill={localSettings.borderColor} opacity="0.4" />
                      {/* Spokes - top */}
                      <path d="M16 7 L16 12" stroke={localSettings.color} strokeWidth="3" strokeLinecap="round" />
                      {/* Spokes - bottom left */}
                      <path d="M9 22 L12.5 18" stroke={localSettings.color} strokeWidth="3" strokeLinecap="round" />
                      {/* Spokes - bottom right */}
                      <path d="M23 22 L19.5 18" stroke={localSettings.color} strokeWidth="3" strokeLinecap="round" />
                      {/* Grip highlights */}
                      <path d="M6 10 A10 10 0 0 1 10 6" stroke={localSettings.borderColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                      <path d="M26 10 A10 10 0 0 0 22 6" stroke={localSettings.borderColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    </svg>
                  ) : localSettings.type === 'key' ? (
                    <svg
                      width={localSettings.size * 1.3}
                      height={localSettings.size * 0.7}
                      viewBox="0 0 40 22"
                      fill="none"
                      style={{ transform: `scale(${localSettings.hoverScale})` }}
                    >
                      {/* Key fob body */}
                      <rect x="2" y="4" width="18" height="14" rx="4" fill={localSettings.color} />
                      <rect x="3" y="5" width="16" height="12" rx="3" fill={localSettings.borderColor} opacity="0.15" />
                      {/* Buttons on fob */}
                      <circle cx="8" cy="9" r="2" fill={localSettings.borderColor} opacity="0.8" />
                      <circle cx="14" cy="9" r="2" fill={localSettings.borderColor} opacity="0.8" />
                      <rect x="6" y="13" width="10" height="3" rx="1.5" fill={localSettings.borderColor} opacity="0.6" />
                      {/* Key shaft */}
                      <rect x="20" y="8" width="14" height="6" rx="1" fill={localSettings.color} />
                      <rect x="20" y="9" width="12" height="4" fill={localSettings.borderColor} opacity="0.1" />
                      {/* Key teeth */}
                      <rect x="28" y="14" width="2" height="3" fill={localSettings.color} />
                      <rect x="32" y="14" width="2" height="4" fill={localSettings.color} />
                      <rect x="36" y="14" width="2" height="3" fill={localSettings.color} />
                      {/* Key tip */}
                      <rect x="38" y="8" width="2" height="6" rx="1" fill={localSettings.color} />
                      {/* Highlight on fob */}
                      <path d="M5 6 Q11 4 17 6" stroke={localSettings.borderColor} strokeWidth="1" opacity="0.4" fill="none" />
                    </svg>
                  ) : localSettings.type === 'pin' ? (
                    <svg
                      width={localSettings.size}
                      height={localSettings.size * 1.2}
                      viewBox="0 0 24 28"
                      fill="none"
                      style={{ transform: `scale(${localSettings.hoverScale})` }}
                    >
                      <path
                        d="M12 2C7.58 2 4 5.58 4 10C4 16.5 12 26 12 26C12 26 20 16.5 20 10C20 5.58 16.42 2 12 2Z"
                        fill={localSettings.color}
                        stroke={localSettings.borderColor}
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="3"
                        fill={localSettings.borderColor}
                      />
                    </svg>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_SETTINGS };
