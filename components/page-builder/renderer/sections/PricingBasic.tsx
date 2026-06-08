'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingSectionContent, SectionSettings, PricingCard } from '@/types/page-builder';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { smoothScrollToSection, navigateToPageWithSection, navigateToPage } from '@/lib/page-builder/utils/scroll';

interface PricingBasicProps {
  content: Record<string, any>;
  settings?: SectionSettings;
  currentPageSlug?: string;
  websiteId?: string;
  templateId?: string;
  homePageSlug?: string;
}

export function PricingBasic({ content, settings, currentPageSlug, websiteId, templateId, homePageSlug }: PricingBasicProps) {
  const {
    headline,
    subheadline,
    badgeText,
    showBadge,
    cards,
    backgroundColor,
    textColor,
    accentColor,
    cardBackgroundColor,
    columns,
    footnoteText,
    showFootnote,
  } = content as PricingSectionContent;

  const [openFormId, setOpenFormId] = useState<string | null>(null);

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const bg = backgroundColor || '#ffffff';
  const text = textColor || '#1a1a1a';
  const accent = accentColor || '#6366f1';
  const cardBg = cardBackgroundColor || '#ffffff';
  const gridCols = columns || 3;

  const handleCTAClick = (card: PricingCard, e: React.MouseEvent) => {
    e.preventDefault();
    if (!card.cta) return;

    const cta = card.cta;

    if (cta.type === 'url' && cta.url) {
      window.open(cta.url, '_blank', 'noopener,noreferrer');
    } else if (cta.type === 'form' && cta.formId) {
      setOpenFormId(cta.formId);
    } else if (cta.type === 'page' && cta.pageId) {
      if (cta.sectionId) {
        navigateToPageWithSection(cta.pageId, cta.sectionId, homePageSlug);
      } else {
        smoothScrollToSection(`section-${cta.pageId}`);
      }
    }
  };

  const getGridClass = () => {
    switch (gridCols) {
      case 1: return 'grid-cols-1 max-w-md';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6"
      style={{ backgroundColor: bg }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          {showBadge && badgeText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: accent + '15', color: accent }}
            >
              {badgeText}
            </motion.div>
          )}
          {headline && (
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: text }}
            >
              {headline}
            </motion.h2>
          )}
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl max-w-2xl mx-auto"
              style={{ color: text, opacity: 0.7 }}
            >
              {subheadline}
            </motion.p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className={cn('grid gap-6 lg:gap-8 justify-items-center', getGridClass())}>
          {cards?.map((card, index) => (
            <motion.div
              key={card.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative w-full max-w-sm rounded-2xl p-6 sm:p-8 transition-all duration-300",
                card.highlighted
                  ? "shadow-xl ring-2 scale-105"
                  : "shadow-lg hover:shadow-xl hover:-translate-y-1"
              )}
              style={{
                backgroundColor: cardBg,
                borderColor: card.highlighted ? accent : 'transparent',
                borderWidth: card.highlighted ? 2 : 0,
                borderStyle: 'solid',
              }}
            >
              {/* Featured Badge */}
              {card.highlighted && card.badgeText && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  {card.badgeText}
                </div>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: card.iconType === 'solid'
                      ? (card.solidIconColor || accent) + '20'
                      : accent + '20',
                  }}
                >
                  {card.iconType === 'solid' ? (
                    (() => {
                      const IconComponent = getSolidIconComponent(card.solidIcon || 'star');
                      return IconComponent ? (
                        <IconComponent
                          className="w-7 h-7"
                          style={{ color: card.solidIconColor || accent }}
                        />
                      ) : (
                        <span className="text-2xl">{card.icon || '⭐'}</span>
                      );
                    })()
                  ) : (
                    <span className="text-3xl">{card.icon || '⭐'}</span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: text }}>
                  {card.title}
                </h3>
                {card.description && (
                  <p className="text-sm" style={{ color: text, opacity: 0.7 }}>
                    {card.description}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-bold" style={{ color: text }}>
                    {card.price}
                  </span>
                  {card.period && (
                    <span className="text-sm" style={{ color: text, opacity: 0.6 }}>
                      {card.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {card.features?.map((feature, fIndex) => (
                  <li key={feature.id || fIndex} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                        feature.included ? "text-white" : "text-slate-300"
                      )}
                      style={{
                        backgroundColor: feature.included ? '#22c55e' : 'transparent',
                        border: feature.included ? 'none' : '2px solid #cbd5e1',
                      }}
                    >
                      {feature.included ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        !feature.included && "line-through"
                      )}
                      style={{
                        color: feature.included ? text : `${text}80`,
                        opacity: feature.included ? 1 : 0.6,
                      }}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {card.ctaText && card.cta && (
                <button
                  onClick={(e) => handleCTAClick(card, e)}
                  className={cn(
                    "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200",
                    card.highlighted
                      ? "text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      : "border-2 hover:-translate-y-0.5"
                  )}
                  style={{
                    backgroundColor: card.highlighted ? accent : 'transparent',
                    color: card.highlighted ? '#ffffff' : accent,
                    borderColor: card.highlighted ? 'transparent' : accent,
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {card.ctaText}
                    {card.cta?.type === 'url' && (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </span>
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footnote */}
        {showFootnote && footnoteText && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10 text-sm"
            style={{ color: text, opacity: 0.6 }}
          >
            {footnoteText}
          </motion.p>
        )}
      </div>

      {/* Form Modal */}
      {openForm && (
        <FormModal
          form={openForm}
          isOpen={!!openFormId}
          onClose={() => setOpenFormId(null)}
          sourcePage={currentPageSlug}
        />
      )}
    </section>
  );
}
