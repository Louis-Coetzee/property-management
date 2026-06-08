'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus,
  Clock,
  Timer,
  Zap,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnimationSettings, AnimationType, AnimationDirection, AnimationSpeed, AnimationEasing } from '@/types/page-builder';

interface AnimationSettingsEditorProps {
  settings?: AnimationSettings;
  onChange: (settings: AnimationSettings) => void;
}

const ANIMATION_TYPES: { value: AnimationType; label: string; description: string }[] = [
  { value: 'fade', label: 'Fade', description: 'Simple fade in effect' },
  { value: 'slide', label: 'Slide', description: 'Slides in from a direction' },
  { value: 'scale', label: 'Scale', description: 'Scales up from smaller size' },
  { value: 'blur', label: 'Blur', description: 'Blurs in from out of focus' },
  { value: 'rotate', label: 'Rotate', description: 'Rotates into position' },
  { value: 'flip', label: 'Flip', description: 'Flips in from side' },
  { value: 'bounce', label: 'Bounce', description: 'Bouncy spring effect' },
];

const ANIMATION_DIRECTIONS: { value: AnimationDirection; label: string; icon: React.ReactNode }[] = [
  { value: 'up', label: 'Up', icon: <ArrowUp className="h-4 w-4" /> },
  { value: 'down', label: 'Down', icon: <ArrowDown className="h-4 w-4" /> },
  { value: 'left', label: 'Left', icon: <ArrowLeft className="h-4 w-4" /> },
  { value: 'right', label: 'Right', icon: <ArrowRight className="h-4 w-4" /> },
  { value: 'none', label: 'None', icon: <Minus className="h-4 w-4" /> },
];

const ANIMATION_SPEEDS: { value: AnimationSpeed; label: string; ms: number }[] = [
  { value: 'slow', label: 'Slow', ms: 800 },
  { value: 'normal', label: 'Normal', ms: 500 },
  { value: 'fast', label: 'Fast', ms: 300 },
];

const ANIMATION_EASINGS: { value: AnimationEasing; label: string; description: string }[] = [
  { value: 'easeOut', label: 'Ease Out', description: 'Starts fast, slows down' },
  { value: 'easeIn', label: 'Ease In', description: 'Starts slow, speeds up' },
  { value: 'easeInOut', label: 'Ease In Out', description: 'Smooth acceleration' },
  { value: 'spring', label: 'Spring', description: 'Bouncy, natural feel' },
  { value: 'ease', label: 'Linear', description: 'Constant speed' },
];

export function AnimationSettingsEditor({ settings = {}, onChange }: AnimationSettingsEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const enabled = settings.enabled ?? false;

  const updateSetting = <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleEnableToggle = () => {
    const newEnabled = !enabled;
    onChange({
      ...settings,
      enabled: newEnabled,
      // Set defaults when enabling for the first time
      ...(newEnabled && !settings.type ? {
        type: 'fade',
        direction: 'up',
        speed: 'normal',
        delay: 0,
        duration: 500,
        easing: 'easeOut',
        distance: 50,
        stagger: false,
        staggerDelay: 100,
      } : {}),
    });
  };

  const handlePreview = () => {
    setIsPreviewing(true);
    setTimeout(() => setIsPreviewing(false), 100);
  };

  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Animation</h4>
          {enabled && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Enabled
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-5">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-900">
                    Enable Animation
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Animate this section when it enters the viewport
                  </p>
                </div>
                <button
                  onClick={handleEnableToggle}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {enabled && (
                <>
                  {/* Animation Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Animation Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ANIMATION_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => updateSetting('type', type.value)}
                          className={cn(
                            'p-2.5 rounded-xl border-2 text-left transition-all',
                            settings.type === type.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <div className="text-sm font-medium text-slate-900">{type.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction (for slide animations) */}
                  {settings.type === 'slide' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Direction
                      </label>
                      <div className="flex gap-2">
                        {ANIMATION_DIRECTIONS.map((dir) => (
                          <button
                            key={dir.value}
                            onClick={() => updateSetting('direction', dir.value)}
                            className={cn(
                              'flex-1 p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all',
                              settings.direction === dir.value
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            )}
                          >
                            {dir.icon}
                            <span className="text-xs font-medium text-slate-700">{dir.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Speed / Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Speed
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ANIMATION_SPEEDS.map((speed) => (
                        <button
                          key={speed.value}
                          onClick={() => updateSetting('speed', speed.value)}
                          className={cn(
                            'p-2.5 rounded-xl border-2 text-center transition-all',
                            settings.speed === speed.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <div className="text-sm font-medium text-slate-900">{speed.label}</div>
                          <div className="text-[10px] text-slate-500">{speed.ms}ms</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Custom Duration <span className="text-slate-400 font-normal">(ms)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={200}
                        max={2000}
                        step={50}
                        value={settings.duration ?? 500}
                        onChange={(e) => updateSetting('duration', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <input
                        type="number"
                        min={200}
                        max={2000}
                        step={50}
                        value={settings.duration ?? 500}
                        onChange={(e) => updateSetting('duration', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    </div>
                  </div>

                  {/* Delay */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Delay <span className="text-slate-400 font-normal">(ms)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={2000}
                        step={50}
                        value={settings.delay ?? 0}
                        onChange={(e) => updateSetting('delay', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        step={50}
                        value={settings.delay ?? 0}
                        onChange={(e) => updateSetting('delay', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Time before animation starts after section enters viewport
                    </p>
                  </div>

                  {/* Easing */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Easing
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ANIMATION_EASINGS.map((easing) => (
                        <button
                          key={easing.value}
                          onClick={() => updateSetting('easing', easing.value)}
                          className={cn(
                            'p-2.5 rounded-xl border-2 text-left transition-all',
                            settings.easing === easing.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          )}
                        >
                          <div className="text-sm font-medium text-slate-900">{easing.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{easing.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Distance (for slide animations) */}
                  {settings.type === 'slide' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        Distance <span className="text-slate-400 font-normal">(px)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={10}
                          max={200}
                          step={10}
                          value={settings.distance ?? 50}
                          onChange={(e) => updateSetting('distance', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <input
                          type="number"
                          min={10}
                          max={200}
                          step={10}
                          value={settings.distance ?? 50}
                          onChange={(e) => updateSetting('distance', parseInt(e.target.value))}
                          className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stagger children */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          Stagger Children
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Animate child elements one after another
                        </p>
                      </div>
                      <button
                        onClick={() => updateSetting('stagger', !settings.stagger)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          settings.stagger ? 'bg-indigo-600' : 'bg-slate-200'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                            settings.stagger ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {settings.stagger && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          Stagger Delay <span className="text-slate-400 font-normal">(ms)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={500}
                            step={25}
                            value={settings.staggerDelay ?? 100}
                            onChange={(e) => updateSetting('staggerDelay', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <input
                            type="number"
                            min={0}
                            max={500}
                            step={25}
                            value={settings.staggerDelay ?? 100}
                            onChange={(e) => updateSetting('staggerDelay', parseInt(e.target.value))}
                            className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Delay between each child element animation
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="pt-2">
                    <button
                      onClick={handlePreview}
                      className="w-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Preview Animation
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Preview Box */}
      {enabled && isExpanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="p-4 bg-slate-100 rounded-xl">
            <div className="text-xs text-slate-500 mb-2 text-center">Preview</div>
            <AnimationPreview
              key={isPreviewing ? Date.now() : 'static'}
              settings={settings}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Preview component
function AnimationPreview({ settings }: { settings: AnimationSettings }) {
  const variants = {
    hidden: getHiddenState(settings),
    visible: getVisibleState(),
  };

  const duration = (settings.duration ?? 500) / 1000;
  const delay = (settings.delay ?? 0) / 1000;

  const transition = settings.easing === 'spring'
    ? {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
        duration,
        delay,
      }
    : {
        duration,
        delay,
        ease: getEaseValue(settings.easing),
      };

  return (
    <motion.div
      className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-medium text-sm"
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={transition}
    >
      Section Preview
    </motion.div>
  );
}

function getHiddenState(settings: AnimationSettings) {
  const { type = 'fade', direction = 'up', distance = 50 } = settings;

  const getOffset = () => {
    switch (direction) {
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const offset = type === 'slide' ? getOffset() : { x: 0, y: 0 };

  return {
    opacity: ['fade', 'slide', 'blur'].includes(type) ? 0 : 1,
    scale: type === 'scale' ? 0.8 : type === 'bounce' ? 0.3 : 1,
    rotate: type === 'rotate' ? -10 : type === 'flip' ? 90 : 0,
    filter: type === 'blur' ? 'blur(10px)' : 'blur(0px)',
    ...offset,
  };
}

function getVisibleState() {
  return {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
  };
}

function getEaseValue(easing?: AnimationEasing): [number, number, number, number] {
  switch (easing) {
    case 'easeIn': return [0.42, 0, 1, 1];
    case 'easeOut': return [0, 0, 0.58, 1];
    case 'easeInOut': return [0.42, 0, 0.58, 1];
    case 'spring': return [0.25, 0.1, 0.25, 1];
    default: return [0.25, 0.1, 0.25, 1];
  }
}

export default AnimationSettingsEditor;
