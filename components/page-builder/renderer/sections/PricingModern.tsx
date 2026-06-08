'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingSectionContent, SectionSettings, PricingCard } from '@/types/page-builder';
import { getSolidIconComponent } from '@/lib/page-builder/icons/solid-icons';
import { FormModal } from '@/components/forms/FormModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { convertConvexForm } from '@/lib/forms';
import { smoothScrollToSection, navigateToPageWithSection } from '@/lib/page-builder/utils/scroll';

interface PricingModernProps {
  content: Record<string, any>;
  settings?: SectionSettings;
  currentPageSlug?: string;
  websiteId?: string;
  templateId?: string;
  homePageSlug?: string;
}

export function PricingModern({ content, settings, currentPageSlug, websiteId, templateId, homePageSlug }: PricingModernProps) {
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Fetch the form when formId is set (public query)
  const openFormResult = useQuery(api.forms.getFormByIdPublic, openFormId ? { formId: openFormId as any } : 'skip');
  const openForm = openFormResult ? convertConvexForm(openFormResult) : null;

  const bg = backgroundColor || '#0f172a';
  const text = textColor || '#ffffff';
  const accent = accentColor || '#6366f1';
  const cardBg = cardBackgroundColor || '#1e293b';
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
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: accent, opacity: 0.5 }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          {showBadge && badgeText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border"
              style={{
                backgroundColor: `${accent}20`,
                borderColor: `${accent}40`,
                color: accent,
              }}
            >
              <Sparkles className="w-4 h-4" />
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
              onMouseEnter={() => setHoveredCard(card.id || String(index))}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                "relative w-full max-w-sm rounded-2xl p-6 sm:p-8 transition-all duration-500",
                card.highlighted
                  ? "scale-105 z-10"
                  : "hover:scale-102"
              )}
              style={{
                background: card.highlighted
                  ? `linear-gradient(135deg, ${cardBg} 0%, ${accent}20 100%)`
                  : cardBg,
                boxShadow: card.highlighted
                  ? `0 0 60px -12px ${accent}60`
                  : hoveredCard === (card.id || String(index))
                    ? `0 0 30px -8px ${accent}40`
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${card.highlighted ? `${accent}60` : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {/* Glassmorphism Overlay */}
              <div
                className="absolute inset-0 rounded-2xl opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                }}
              />

              {/* Featured Badge */}
              {card.highlighted && card.badgeText && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white shadow-lg z-10"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                  }}
                >
                  {card.badgeText}
                </div>
              )}

              <div className="relative">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                    style={{
                      background: card.iconType === 'solid'
                        ? `linear-gradient(135deg, ${(card.solidIconColor || accent)}40 0%, ${(card.solidIconColor || accent)}20 100%)`
                        : `linear-gradient(135deg, ${accent}40 0%, ${accent}20 100%)`,
                      border: `1px solid ${(card.solidIconColor || accent)}30`,
                    }}
                  >
                    {card.iconType === 'solid' ? (
                      (() => {
                        const IconComponent = getSolidIconComponent(card.solidIcon || 'star');
                        return IconComponent ? (
                          <IconComponent
                            className="w-8 h-8"
                            style={{ color: card.solidIconColor || accent }}
                          />
                        ) : (
                          <span className="text-3xl">{card.icon || '⭐'}</span>
                        );
                      })()
                    ) : (
                      <span className="text-4xl">{card.icon || '⭐'}</span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2" style={{ color: text }}>
                    {card.title}
                  </h3>
                  {card.description && (
                    <p className="text-sm" style={{ color: text, opacity: 0.6 }}>
                      {card.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${text} 0%, ${text}aa 100%)`,
                      }}
                    >
                      {card.price}
                    </span>
                    {card.period && (
                      <span className="text-sm" style={{ color: text, opacity: 0.5 }}>
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
                          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-sm",
                        )}
                        style={{
                          backgroundColor: feature.included ? `${accent}40` : 'transparent',
                          border: feature.included ? 'none' : `1px solid ${text}30`,
                        }}
                      >
                        {feature.included ? (
                          <Check className="w-3 h-3" style={{ color: accent }} />
                        ) : (
                          <X className="w-3 h-3" style={{ color: text, opacity: 0.3 }} />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          !feature.included && "line-through"
                        )}
                        style={{
                          color: feature.included ? text : `${text}80`,
                          opacity: feature.included ? 1 : 0.4,
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
                      "w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden group",
                      card.highlighted
                        ? "text-white"
                        : "backdrop-blur-sm"
                    )}
                    style={{
                      background: card.highlighted
                        ? `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`
                        : `linear-gradient(135deg, ${accent}20 0%, ${accent}10 100%)`,
                      border: card.highlighted ? 'none' : `1px solid ${accent}40`,
                      color: card.highlighted ? '#ffffff' : accent,
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {card.ctaText}
                      {card.cta?.type === 'url' && (
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </span>
                    {!card.highlighted && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${accent}30 0%, ${accent}20 100%)`,
                        }}
                      />
                    )}
                  </button>
                )}
              </div>
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
            className="text-center mt-12 text-sm"
            style={{ color: text, opacity: 0.5 }}
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
