'use client';

import { useState, useMemo } from 'react';
import {
  CardPermission,
  PermissionLevel,
  CARD_PERMISSIONS,
  CATEGORY_LABELS,
  PERMISSION_LEVEL_LABELS,
  PERMISSION_LEVEL_COLORS,
  CardPermissionsMap,
  getAvailableCards,
} from '@/lib/card-permissions';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  Lock,
} from 'lucide-react';

interface CardPermissionSelectorProps {
  value: CardPermissionsMap;
  onChange: (permissions: CardPermissionsMap) => void;
  enabledApps?: Record<string, { enabled: boolean }>;
  disabled?: boolean;
}

export function CardPermissionSelector({
  value,
  onChange,
  enabledApps,
  disabled = false,
}: CardPermissionSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['organization', 'crm'])
  );

  // Get available cards based on enabled apps
  const availableCards = useMemo(
    () => getAvailableCards(enabledApps),
    [enabledApps]
  );

  // Group cards by category
  const cardsByCategory = useMemo(() => {
    const grouped: Record<string, CardPermission[]> = {};
    availableCards.forEach((card) => {
      if (!grouped[card.category]) {
        grouped[card.category] = [];
      }
      grouped[card.category].push(card);
    });
    return grouped;
  }, [availableCards]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePermissionChange = (cardKey: string, level: PermissionLevel) => {
    const newPermissions = { ...value };
    if (level === 'none') {
      delete newPermissions[cardKey];
    } else {
      newPermissions[cardKey] = level;
    }
    onChange(newPermissions);
  };

  const getCardPermission = (cardKey: string): PermissionLevel => {
    return value[cardKey] || 'none';
  };

  // Get assigned cards count
  const assignedCount = Object.keys(value).filter(
    (key) => value[key] && value[key] !== 'none'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Card Access Permissions
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign access to specific cards/modules
          </p>
        </div>
        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
          {assignedCount} cards assigned
        </span>
      </div>

      {/* Category Accordions */}
      <div className="space-y-3">
        {Object.entries(cardsByCategory).map(([category, cards]) => (
          <div
            key={category}
            className="border border-slate-200 rounded-xl overflow-hidden"
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              disabled={disabled}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {cards.length} cards
                </span>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* Category Content */}
            {expandedCategories.has(category) && (
              <div className="divide-y divide-slate-100">
                {cards.map((card) => {
                  const Icon = card.icon;
                  const currentPermission = getCardPermission(card.key);

                  return (
                    <div
                      key={card.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white"
                    >
                      {/* Card Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-medium text-slate-900">
                            {card.label}
                          </h5>
                          <p className="text-xs text-slate-500 truncate">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      {/* Permission Selector */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {disabled ? (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              PERMISSION_LEVEL_COLORS[currentPermission]
                            }`}
                          >
                            {PERMISSION_LEVEL_LABELS[currentPermission]}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handlePermissionChange(card.key, 'none')
                              }
                              className={`p-2 rounded-lg transition-all ${
                                currentPermission === 'none'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                              }`}
                              title="No Access"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handlePermissionChange(card.key, 'read')
                              }
                              className={`p-2 rounded-lg transition-all ${
                                currentPermission === 'read'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'
                              }`}
                              title="Read Only"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handlePermissionChange(card.key, 'read-write')
                              }
                              className={`p-2 rounded-lg transition-all ${
                                currentPermission === 'read-write'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                              }`}
                              title="Read & Write"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {!disabled && availableCards.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              const allPermissions: CardPermissionsMap = {};
              availableCards.forEach((card) => {
                allPermissions[card.key] = 'read-write';
              });
              onChange(allPermissions);
            }}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Grant All Access
          </button>
          <button
            type="button"
            onClick={() => {
              const readPermissions: CardPermissionsMap = {};
              availableCards.forEach((card) => {
                readPermissions[card.key] = 'read';
              });
              onChange(readPermissions);
            }}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Read All
          </button>
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs font-medium text-slate-600 hover:text-slate-700 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

// Permission Tags Display Component
interface PermissionTagsProps {
  permissions: CardPermissionsMap;
  enabledApps?: Record<string, { enabled: boolean }>;
  maxVisible?: number;
}

export function PermissionTags({
  permissions,
  enabledApps,
  maxVisible = 5,
}: PermissionTagsProps) {
  const availableCards = useMemo(
    () => getAvailableCards(enabledApps),
    [enabledApps]
  );

  // Get assigned permissions with card info
  const assignedPermissions = useMemo(() => {
    return Object.entries(permissions)
      .filter(([_, level]) => level && level !== 'none')
      .map(([cardKey, level]) => {
        const card = availableCards.find((c) => c.key === cardKey);
        return {
          cardKey,
          level: level as PermissionLevel,
          card,
        };
      })
      .filter((p) => p.card); // Only show if card exists and is available
  }, [permissions, availableCards]);

  const visiblePermissions = assignedPermissions.slice(0, maxVisible);
  const remainingCount = assignedPermissions.length - maxVisible;

  if (assignedPermissions.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">
        No card access assigned
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visiblePermissions.map(({ cardKey, level, card }) => (
        <span
          key={cardKey}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            PERMISSION_LEVEL_COLORS[level]
          }`}
          title={`${card?.label}: ${PERMISSION_LEVEL_LABELS[level]}`}
        >
          {card?.label}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
