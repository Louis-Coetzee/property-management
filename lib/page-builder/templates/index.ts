export {
  getAllTemplates,
  getTemplatesByType,
  getTemplateById,
  getSectionTypes,
  isSectionTypeAvailable,
} from './registry';

export { default as sectionTemplates } from './registry';

// Page Templates
export {
  getPageTemplates,
  getPageTemplatesByCategory,
  getPageTemplateById,
  applyPageTemplate,
  vehicleDealershipTemplate,
  tutoringCenterTemplate,
  gardenServiceTemplate,
  PAGE_TEMPLATES,
  type PageTemplate,
} from './page-templates';
