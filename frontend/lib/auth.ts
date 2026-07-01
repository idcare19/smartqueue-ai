export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  organization_admin: 'Organization Admin',
  branch_manager: 'Branch Manager',
  staff: 'Staff',
  receptionist: 'Receptionist'
} as const;

export const DASHBOARD_ROLE_ACCESS: Record<string, string[]> = {
  '/dashboard': ['super_admin', 'organization_admin', 'branch_manager', 'staff', 'receptionist'],
  '/dashboard/analytics': ['super_admin', 'organization_admin', 'branch_manager'],
  '/dashboard/billing': ['super_admin', 'organization_admin'],
  '/dashboard/branches': ['super_admin', 'organization_admin', 'branch_manager'],
  '/dashboard/counters': ['super_admin', 'organization_admin', 'branch_manager', 'staff', 'receptionist'],
  '/dashboard/notifications': ['super_admin', 'organization_admin', 'branch_manager', 'staff', 'receptionist'],
  '/dashboard/organizations': ['super_admin', 'organization_admin'],
  '/dashboard/qr': ['super_admin', 'organization_admin', 'branch_manager'],
  '/dashboard/services': ['super_admin', 'organization_admin', 'branch_manager'],
  '/dashboard/settings': ['super_admin', 'organization_admin', 'branch_manager'],
  '/dashboard/staff': ['super_admin', 'organization_admin', 'branch_manager'],
  '/staff': ['super_admin', 'organization_admin', 'branch_manager', 'staff', 'receptionist']
};

export type UserRole = keyof typeof ROLE_LABELS;

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_name: string;
  phone_number: string;
  organization: number | null;
  branch: number | null;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
  phone_number: string;
  role: UserRole;
};

export type AuthResponse = AuthTokens & {
  user: AuthUser;
};

export type RegisterResponse = {
  user: AuthUser;
  email_verification_required?: boolean;
  access?: string;
  refresh?: string;
};

export type VerifyEmailPayload = {
  uid: string;
  token: string;
};

export type ResetPasswordPayload = VerifyEmailPayload & {
  password: string;
  confirm_password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export function isRouteAllowed(pathname: string, role?: UserRole) {
  if (!role) return false;

  for (const [route, allowedRoles] of Object.entries(DASHBOARD_ROLE_ACCESS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return allowedRoles.includes(role);
    }
  }

  return true;
}
