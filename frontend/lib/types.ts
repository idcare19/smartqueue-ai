import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: 'dashboard' | 'queue';
};

export type StatCard = {
  label: string;
  value: string;
  trend: string;
};

export type TableColumn<T> = {
  key: keyof T;
  label: string;
};

export type TableRow = Record<string, string>;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type QueueStatus = 'Waiting' | 'Called' | 'Serving' | 'Completed' | 'Cancelled';

export type BranchRow = {
  branch: string;
  status: 'Active' | 'Paused' | 'Offline';
  workingHours: string;
  manager: string;
  queue: string;
  staff: string;
};

export type ServiceRow = {
  service: string;
  duration: string;
  prefix: string;
  priority: string;
  status: 'Active' | 'Inactive';
};

export type CounterRow = {
  counter: string;
  branch: string;
  staff: string;
  currentToken: string;
  status: 'Open' | 'Paused' | 'Closed';
};

export type StaffRow = {
  name: string;
  role: string;
  branch: string;
  permission: string;
  status: 'Active' | 'Invited' | 'Suspended';
};

export type SubscriptionPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export type InvoiceRow = {
  invoice: string;
  date: string;
  plan: string;
  amount: string;
  status: 'Paid' | 'Due' | 'Failed';
};

export type QrRow = {
  label: string;
  type: 'Branch' | 'Service' | 'Counter';
  branch: string;
  destination: string;
};

export type QueueApiToken = {
  id: number;
  branch: number;
  branch_name: string;
  service: number;
  service_name: string;
  counter: number | null;
  counter_name: string;
  customer_name: string;
  mobile_number: string;
  token_number: string;
  sequence_number: number;
  status: string;
  note: string;
  queue_date: string;
  estimated_wait_minutes: number;
  confidence: string;
};

export type AnalyticsSummary = {
  average_wait_time_minutes: number;
  average_service_time_minutes: number;
  peak_hours: Array<{ hour: number | null; total: number }>;
  no_show_rate: number;
  completed_tokens: number;
  queue_load_by_service: Array<{ service: string; total: number }>;
  counter_performance: Array<{ counter: string; total: number }>;
  insights: string[];
  prediction: { estimated_wait_minutes: number; confidence: string } | null;
};

export type NotificationItem = {
  id: number;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app' | 'push';
  event_type: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'read';
  provider: string;
  title: string;
  message: string;
  destination: string;
  queue_token: number | null;
  queue_token_number: string;
  retry_count: number;
  max_retries: number;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationTemplateItem = {
  id: number;
  name: string;
  event_type: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app' | 'push';
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationLogItem = {
  id: number;
  notification: number;
  provider: string;
  status: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  error_message: string;
  attempted_at: string;
};

export type NotificationStats = {
  total: number;
  unread: number;
  failed: number;
  delivered: number;
  providers: Array<{
    channel: string;
    provider: string;
    enabled: boolean;
    missing_credentials: string[];
  }>;
};
