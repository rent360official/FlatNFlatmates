import type { FeatureStatus } from '@/models/FeatureFlag';

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
 * Returns a human-readable label and colour for a given feature status.
 */
export function featureStatusMeta(status: FeatureStatus): {
  label: string;
  colour: 'grey' | 'amber' | 'emerald';
} {
  switch (status) {
    case 'disabled':
      return { label: 'Disabled', colour: 'grey' };
    case 'testing':
      return { label: 'Testing', colour: 'amber' };
    case 'enabled':
      return { label: 'Enabled', colour: 'emerald' };
  }
}
