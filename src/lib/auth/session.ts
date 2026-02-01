// Session utilities
import type { SessionUser, UserRole } from '@/types';

/**
 * Check if user has a SaaS role
 */
export function isSaaSUser(role: UserRole): boolean {
  return ['saas_admin', 'saas_subscriber_manager', 'saas_support', 'saas_developer'].includes(role);
}

/**
 * Check if user has a company role
 */
export function isCompanyUser(role: UserRole): boolean {
  return ['company_admin', 'fleet_manager', 'driver', 'company_support'].includes(role);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return ['saas_admin', 'saas_subscriber_manager', 'company_admin'].includes(role);
}

/**
 * Check if user can manage fleet
 */
export function canManageFleet(role: UserRole): boolean {
  return ['saas_admin', 'company_admin', 'fleet_manager'].includes(role);
}

/**
 * Check if user can view analytics
 */
export function canViewAnalytics(role: UserRole): boolean {
  return ['saas_admin', 'saas_subscriber_manager', 'company_admin', 'fleet_manager'].includes(role);
}

/**
 * Check if user is an admin (any type)
 */
export function isAdmin(role: UserRole): boolean {
  return ['saas_admin', 'company_admin'].includes(role);
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdmin(role: UserRole): boolean {
  return isSaaSUser(role);
}

/**
 * Get display name for user
 */
export function getDisplayName(user: SessionUser): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

/**
 * Get initials for user avatar
 */
export function getInitials(user: SessionUser): string {
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return (first + last).toUpperCase() || user.email[0].toUpperCase();
}
