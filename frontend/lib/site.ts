import {
  BarChart3,
  Bell,
  BellRing,
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  QrCode,
  ScanLine,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users
} from 'lucide-react';

export const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, group: 'dashboard' },
  { label: 'Branches', href: '/dashboard/branches', icon: Building2, group: 'dashboard' },
  { label: 'Services', href: '/dashboard/services', icon: SlidersHorizontal, group: 'dashboard' },
  { label: 'Counters', href: '/dashboard/counters', icon: Users, group: 'dashboard' },
  { label: 'Staff', href: '/dashboard/staff', icon: Users, group: 'dashboard' },
  { label: 'Organizations', href: '/dashboard/organizations', icon: Building2, group: 'dashboard' },
  { label: 'Queue', href: '/queue', icon: ScanLine, group: 'queue' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, group: 'dashboard' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, group: 'dashboard' },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard, group: 'dashboard' },
  { label: 'QR Codes', href: '/dashboard/qr', icon: QrCode, group: 'dashboard' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings2, group: 'dashboard' }
];

export const landingFeatures = [
  { title: 'Realtime queue orchestration', text: 'Call, recall, transfer, and complete tokens instantly across branches.', icon: Users },
  { title: 'Branded QR intake', text: 'Each service or counter can generate a polished QR entry point.', icon: QrCode },
  { title: 'AI wait predictions', text: 'Estimate wait time with historical patterns and live throughput.', icon: Sparkles },
  { title: 'Notification delivery', text: 'Keep customers informed by SMS, email, WhatsApp, and push.', icon: BellRing }
];

export const industries = ['Clinics', 'Hospitals', 'Banks', 'Government', 'Salons', 'Restaurants', 'Service Centers'];

export const pricingPlans = [
  { name: 'Free', price: '$0', description: 'For a single location getting started.', features: ['1 branch', 'Basic queue', 'Email support'] },
  { name: 'Starter', price: '$29', description: 'For small teams with live queue needs.', features: ['3 branches', 'Realtime dashboard', 'Role permissions'] },
  { name: 'Professional', price: '$79', description: 'For growing service networks.', features: ['Unlimited tokens', 'Analytics', 'Notifications'] },
  { name: 'Enterprise', price: 'Custom', description: 'For multi-site, high-volume operations.', features: ['SSO', 'SLAs', 'Dedicated support'] }
];

export const testimonials = [
  { quote: 'Our front desk became calmer on day one. The queue visibility changed everything.', name: 'Amina Shah', role: 'Operations Director, Clinic Group' },
  { quote: 'The public display and live calling flow feel like a true enterprise product.', name: 'Daniel Kim', role: 'Branch Manager, Financial Services' },
  { quote: 'Premium UI, clean workflows, and zero confusion for staff or customers.', name: 'Priya Nair', role: 'Admin Lead, Service Center' }
];

export const authCards = [
  { title: 'Secure sign in', text: 'JWT-backed authentication with refresh support and role routing.', icon: ShieldCheck },
  { title: 'Fast onboarding', text: 'Create organizations, branches, and staff access from one place.', icon: Building2 },
  { title: 'Support-ready', text: 'A polished interface that can scale into an enterprise support workflow.', icon: LifeBuoy }
];

export const dashboardStats = [
  { label: 'Active tokens', value: '128', trend: '+18%' },
  { label: 'Avg wait time', value: '12m', trend: '-9%' },
  { label: 'Completed today', value: '342', trend: '+21%' },
  { label: 'No show rate', value: '3.8%', trend: '-1.2%' }
];
