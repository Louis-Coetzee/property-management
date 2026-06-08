'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  truncate?: boolean;
}

interface ResponsiveBreadcrumbProps {
  items: BreadcrumbItem[];
  currentPage?: string;
}

export function ResponsiveBreadcrumb({ items, currentPage }: ResponsiveBreadcrumbProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Horizontal scrollable breadcrumb for mobile, full for desktop */}
      <div className="flex items-center py-3 sm:py-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex items-center gap-1 sm:gap-2 min-w-max sm:min-w-0">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap ${
                    item.truncate ? 'max-w-[120px] sm:max-w-[150px]' : ''
                  } ${item.truncate ? 'truncate' : ''}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-500 whitespace-nowrap ${
                    item.truncate ? 'max-w-[120px] sm:max-w-[150px]' : ''
                  } ${item.truncate ? 'truncate' : ''}`}
                >
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0 mx-0.5" />
              )}
            </div>
          ))}
          {currentPage && items.length > 0 && (
            <>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0 mx-0.5" />
              <span className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-900 font-medium whitespace-nowrap">
                {currentPage}
              </span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

// Alternative variant with collapsible dropdown for mobile
interface CollapsibleBreadcrumbProps {
  items: BreadcrumbItem[];
  currentPage?: string;
}

export function CollapsibleBreadcrumb({ items, currentPage }: CollapsibleBreadcrumbProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Desktop: Full breadcrumb */}
      <nav className="hidden sm:flex items-center gap-2 py-4 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {item.href ? (
              <Link
                href={item.href}
                className={`text-slate-500 hover:text-slate-700 transition-colors ${
                  item.truncate ? 'max-w-[150px] truncate' : ''
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-slate-500 ${item.truncate ? 'max-w-[150px] truncate' : ''}`}
              >
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>
        ))}
        {currentPage && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-medium">{currentPage}</span>
          </>
        )}
      </nav>

      {/* Mobile: Scrollable breadcrumb with snap scroll */}
      <div className="sm:hidden flex items-center py-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <nav className="flex items-center min-w-max px-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center snap-start">
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap ${
                    item.truncate ? 'max-w-[100px] truncate' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`flex items-center px-2 py-1.5 text-xs text-slate-500 whitespace-nowrap ${
                    item.truncate ? 'max-w-[100px] truncate' : ''
                  }`}
                >
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              )}
            </div>
          ))}
          {currentPage && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="flex items-center px-2 py-1.5 text-xs text-slate-900 font-medium whitespace-nowrap snap-center">
                {currentPage}
              </span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
