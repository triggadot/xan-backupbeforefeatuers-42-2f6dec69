/**
 * Exports for all feature page components
 * This file prevents circular references by keeping exports separate
 */

export { default as FeatureListPage } from './index';
export { default as CreateFeaturePage } from './create';
export { default as FeatureDetailPage } from './[id]';
export { default as EditFeaturePage } from './[id]/edit'; 