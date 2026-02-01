// User domain model

export type SaaSRole =
  | "saas_admin"
  | "saas_subscriber_manager"
  | "saas_support"
  | "saas_developer";

export type CompanyRole =
  | "company_admin"
  | "fleet_manager"
  | "driver"
  | "company_support";

export type UserRole = SaaSRole | CompanyRole;

export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  organizationName?: string;
  phone?: string;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

export interface Organization {
  id: string;
  name: string;
  status: "active" | "inactive" | "suspended";
  subscriptionTier?: string;
  createdAt: Date;
  updatedAt: Date;
}
