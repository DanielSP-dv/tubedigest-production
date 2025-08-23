/**
 * Feature Flags Configuration
 * 
 * This file manages feature flags for progressive deployment and rollback capabilities
 * during the TubeDigest UI/UX enhancement project.
 */

export interface FeatureFlags {
  // Channel Management Enhancements
  ENHANCED_CHANNEL_SELECTION: boolean;
  CHANNEL_IMPORT_FEATURE: boolean;
  CHANNEL_LIMIT_DISPLAY: boolean;
  
  // UI/UX Improvements
  CIRCULAR_REFRESH_ANIMATION: boolean;
  ENHANCED_NAVIGATION: boolean;
  IMPROVED_SIDEBAR_COLLAPSE: boolean;
  
  // Dashboard Enhancements
  ENHANCED_DASHBOARD_LAYOUT: boolean;
  PROFILE_SECTION: boolean;
  DIGEST_CONFIGURATION: boolean;
  
  // Performance Optimizations
  DEBOUNCED_CHANNEL_SELECTION: boolean;
  OPTIMIZED_VIDEO_LOADING: boolean;
}

/**
 * Default feature flags configuration
 * Can be overridden by environment variables
 */
const defaultFeatureFlags: FeatureFlags = {
  // Channel Management Enhancements
  ENHANCED_CHANNEL_SELECTION: true,
  CHANNEL_IMPORT_FEATURE: true,
  CHANNEL_LIMIT_DISPLAY: true,
  
  // UI/UX Improvements
  CIRCULAR_REFRESH_ANIMATION: true,
  ENHANCED_NAVIGATION: true,
  IMPROVED_SIDEBAR_COLLAPSE: true,
  
  // Dashboard Enhancements
  ENHANCED_DASHBOARD_LAYOUT: true,
  PROFILE_SECTION: true,
  DIGEST_CONFIGURATION: true,
  
  // Performance Optimizations
  DEBOUNCED_CHANNEL_SELECTION: true,
  OPTIMIZED_VIDEO_LOADING: true,
};

/**
 * Environment variable mapping
 * Allows runtime configuration via environment variables
 */
const getFeatureFlagFromEnv = (flagName: string, defaultValue: boolean): boolean => {
  const envVar = `REACT_APP_FEATURE_${flagName}`;
  const envValue = process.env[envVar];
  
  if (envValue === undefined) {
    return defaultValue;
  }
  
  return envValue.toLowerCase() === 'true';
};

/**
 * Feature flags instance
 * Combines defaults with environment overrides
 */
export const FEATURE_FLAGS: FeatureFlags = {
  ENHANCED_CHANNEL_SELECTION: getFeatureFlagFromEnv('ENHANCED_CHANNEL_SELECTION', defaultFeatureFlags.ENHANCED_CHANNEL_SELECTION),
  CHANNEL_IMPORT_FEATURE: getFeatureFlagFromEnv('CHANNEL_IMPORT_FEATURE', defaultFeatureFlags.CHANNEL_IMPORT_FEATURE),
  CHANNEL_LIMIT_DISPLAY: getFeatureFlagFromEnv('CHANNEL_LIMIT_DISPLAY', defaultFeatureFlags.CHANNEL_LIMIT_DISPLAY),
  
  CIRCULAR_REFRESH_ANIMATION: getFeatureFlagFromEnv('CIRCULAR_REFRESH_ANIMATION', defaultFeatureFlags.CIRCULAR_REFRESH_ANIMATION),
  ENHANCED_NAVIGATION: getFeatureFlagFromEnv('ENHANCED_NAVIGATION', defaultFeatureFlags.ENHANCED_NAVIGATION),
  IMPROVED_SIDEBAR_COLLAPSE: getFeatureFlagFromEnv('IMPROVED_SIDEBAR_COLLAPSE', defaultFeatureFlags.IMPROVED_SIDEBAR_COLLAPSE),
  
  ENHANCED_DASHBOARD_LAYOUT: getFeatureFlagFromEnv('ENHANCED_DASHBOARD_LAYOUT', defaultFeatureFlags.ENHANCED_DASHBOARD_LAYOUT),
  PROFILE_SECTION: getFeatureFlagFromEnv('PROFILE_SECTION', defaultFeatureFlags.PROFILE_SECTION),
  DIGEST_CONFIGURATION: getFeatureFlagFromEnv('DIGEST_CONFIGURATION', defaultFeatureFlags.DIGEST_CONFIGURATION),
  
  DEBOUNCED_CHANNEL_SELECTION: getFeatureFlagFromEnv('DEBOUNCED_CHANNEL_SELECTION', defaultFeatureFlags.DEBOUNCED_CHANNEL_SELECTION),
  OPTIMIZED_VIDEO_LOADING: getFeatureFlagFromEnv('OPTIMIZED_VIDEO_LOADING', defaultFeatureFlags.OPTIMIZED_VIDEO_LOADING),
};

/**
 * Feature flag utility functions
 */
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[flag];
};

export const getEnabledFeatures = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
};

export const getDisabledFeatures = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature);
};

/**
 * Feature flag groups for easier management
 */
export const FEATURE_GROUPS = {
  CHANNEL_MANAGEMENT: [
    'ENHANCED_CHANNEL_SELECTION',
    'CHANNEL_IMPORT_FEATURE',
    'CHANNEL_LIMIT_DISPLAY',
  ] as const,
  
  UI_UX_IMPROVEMENTS: [
    'CIRCULAR_REFRESH_ANIMATION',
    'ENHANCED_NAVIGATION',
    'IMPROVED_SIDEBAR_COLLAPSE',
  ] as const,
  
  DASHBOARD_ENHANCEMENTS: [
    'ENHANCED_DASHBOARD_LAYOUT',
    'PROFILE_SECTION',
    'DIGEST_CONFIGURATION',
  ] as const,
  
  PERFORMANCE: [
    'DEBOUNCED_CHANNEL_SELECTION',
    'OPTIMIZED_VIDEO_LOADING',
  ] as const,
};

/**
 * Check if all features in a group are enabled
 */
export const isFeatureGroupEnabled = (group: keyof typeof FEATURE_GROUPS): boolean => {
  return FEATURE_GROUPS[group].every(feature => isFeatureEnabled(feature));
};

/**
 * Check if any feature in a group is enabled
 */
export const isAnyFeatureInGroupEnabled = (group: keyof typeof FEATURE_GROUPS): boolean => {
  return FEATURE_GROUPS[group].some(feature => isFeatureEnabled(feature));
};

/**
 * Development utilities
 */
export const logFeatureFlags = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Feature Flags Status:');
    console.log('Enabled:', getEnabledFeatures());
    console.log('Disabled:', getDisabledFeatures());
  }
};

// Log feature flags in development
if (process.env.NODE_ENV === 'development') {
  logFeatureFlags();
}
