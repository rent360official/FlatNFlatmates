export type FeatureStatus = 'disabled' | 'testing' | 'enabled';

/**
 * Roles that can see features in "testing" state.
 */
export const TESTING_ROLES = ['super_admin', 'ops_admin', 'tester'] as const;

/**
 * Returns true if the feature should be visible to the user given their role.
 *
 * - disabled  → always false (no one sees it)
 * - testing   → true only for TESTING_ROLES
 * - enabled   → true for everyone
 */
export function isFeatureVisible(status: FeatureStatus, role: string | undefined | null): boolean {
  if (status === 'disabled') return false;
  if (status === 'enabled') return true;
  // testing
  return TESTING_ROLES.includes(role as any);
}

/**
 * Catalog of all known user-facing features integrated with Feature Management in the codebase.
 */
export interface CodeHandledFeature {
  key: string;
  label: string;
  description: string;
  module: string;
}

export const CODE_HANDLED_FEATURES: CodeHandledFeature[] = [
  {
    key: 'property_interest_sms',
    label: 'Property Interest SMS Alerts',
    description: 'Triggers automated SMS via MSG91 to property owner when prospective tenants click "Interested" on a flat detail page.',
    module: 'Property & Messaging',
  },
  {
    key: 'facebook_community_cta',
    label: 'Facebook Community CTA',
    description: 'Shows landscape Facebook community group CTA on /search/flats and /search/flatmates with locality redirection modal.',
    module: 'Search & Community',
  },
  {
    key: 'vibe_upgrade_catalog',
    label: 'Vibe Upgrade Catalog',
    description: 'Controls visibility of Vibe Upgrade packages catalog, header/footer links, homepage section, and checkout flow.',
    module: 'Services & Monetization',
  },
  {
    key: 'living_services',
    label: 'Living Services',
    description: 'Controls visibility of Living Services link in the header navigation menu.',
    module: 'Header Navigation',
  },
  {
    key: 'legal_services',
    label: 'Legal Services',
    description: 'Controls visibility of Legal & rental agreement services in header navigation menu.',
    module: 'Header Navigation',
  },
];
