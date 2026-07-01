import type {
  AnalyticsSummary,
  BranchRow,
  CounterRow,
  InvoiceRow,
  NotificationItem,
  NotificationLogItem,
  NotificationStats,
  NotificationTemplateItem,
  QrRow,
  ServiceRow,
  StaffRow,
  StatCard,
  SubscriptionPlan,
  TableRow
} from '@/lib/types';

export const dashboardStats: StatCard[] = [
  { label: 'Active tokens', value: '128', trend: '+18%' },
  { label: 'Avg wait time', value: '12m', trend: '-9%' },
  { label: 'Completed today', value: '342', trend: '+21%' },
  { label: 'No show rate', value: '3.8%', trend: '-1.2%' }
];

export const queueRows: TableRow[] = [
  { token: 'A-014', customer: 'Ava Johnson', service: 'General', counter: '03', status: 'Serving', eta: '2m' },
  { token: 'A-015', customer: 'Liam Chen', service: 'Billing', counter: '01', status: 'Waiting', eta: '8m' },
  { token: 'A-016', customer: 'Sara Khan', service: 'Priority', counter: '02', status: 'Called', eta: '1m' },
  { token: 'A-017', customer: 'Noah Brown', service: 'Registration', counter: '05', status: 'Completed', eta: 'Done' }
];

export const branchRows: TableRow[] = [
  { branch: 'North Wing', counters: '8', staff: '14', queue: '42', status: 'Active' },
  { branch: 'Central Desk', counters: '5', staff: '11', queue: '18', status: 'Active' },
  { branch: 'Evening Desk', counters: '3', staff: '6', queue: '9', status: 'Offline' }
];

export const analyticsHighlights = [
  { title: 'Peak hour', value: '11:30 AM - 1:00 PM', detail: 'Highest inflow across all branches' },
  { title: 'Average service time', value: '7m 40s', detail: 'Improving by 12% week over week' },
  { title: 'No show rate', value: '3.8%', detail: 'VIP and emergency queues excluded' }
];

export const notifications: NotificationItem[] = [
  {
    id: 1,
    channel: 'in_app',
    event_type: 'token_called',
    status: 'delivered',
    provider: 'in_app',
    title: 'A-016 is now called',
    message: 'Please proceed to Counter 03.',
    destination: '',
    queue_token: 16,
    queue_token_number: 'A-016',
    retry_count: 0,
    max_retries: 3,
    sent_at: new Date().toISOString(),
    delivered_at: new Date().toISOString(),
    read_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    channel: 'sms',
    event_type: 'queue_delayed',
    status: 'sent',
    provider: 'twilio',
    title: 'North Wing queue is delayed',
    message: 'Updated wait time is 18 minutes.',
    destination: '+91 99999 99999',
    queue_token: 12,
    queue_token_number: 'A-012',
    retry_count: 0,
    max_retries: 3,
    sent_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    channel: 'email',
    event_type: 'queue_joined',
    status: 'failed',
    provider: 'resend',
    title: 'Welcome to SmartQueue',
    message: 'Your token has been created successfully.',
    destination: '',
    queue_token: 10,
    queue_token_number: 'A-010',
    retry_count: 1,
    max_retries: 3,
    sent_at: null,
    delivered_at: null,
    read_at: null,
    created_at: new Date().toISOString()
  }
];

export const queueProgress = [
  { step: 'Waiting', value: 60 },
  { step: 'Called', value: 20 },
  { step: 'Serving', value: 12 },
  { step: 'Completed', value: 8 }
];

export const branchManagementRows: BranchRow[] = [
  { branch: 'North Wing', status: 'Active', workingHours: '8:00 AM - 8:00 PM', manager: 'Aisha Khan', queue: '42', staff: '14' },
  { branch: 'Central Desk', status: 'Paused', workingHours: '9:00 AM - 6:00 PM', manager: 'Mark Lee', queue: '18', staff: '11' },
  { branch: 'Weekend Desk', status: 'Offline', workingHours: '10:00 AM - 4:00 PM', manager: 'Sara Ahmed', queue: '9', staff: '6' }
];

export const serviceRows: ServiceRow[] = [
  { service: 'General Consultation', duration: '8 min', prefix: 'G', priority: 'Normal', status: 'Active' },
  { service: 'Billing Support', duration: '5 min', prefix: 'B', priority: 'Normal', status: 'Active' },
  { service: 'Priority Assistance', duration: '4 min', prefix: 'P', priority: 'High', status: 'Active' },
  { service: 'VIP Concierge', duration: '3 min', prefix: 'V', priority: 'VIP', status: 'Inactive' }
];

export const counterRows: CounterRow[] = [
  { counter: 'Counter 01', branch: 'North Wing', staff: 'Aisha Khan', currentToken: 'A-014', status: 'Open' },
  { counter: 'Counter 02', branch: 'Central Desk', staff: 'Mark Lee', currentToken: 'A-016', status: 'Paused' },
  { counter: 'Counter 03', branch: 'Weekend Desk', staff: 'Sara Ahmed', currentToken: 'A-009', status: 'Closed' }
];

export const staffRows: StaffRow[] = [
  { name: 'Aisha Khan', role: 'Branch Manager', branch: 'North Wing', permission: 'Full access', status: 'Active' },
  { name: 'Mark Lee', role: 'Receptionist', branch: 'Central Desk', permission: 'Queue ops', status: 'Active' },
  { name: 'Sara Ahmed', role: 'Staff', branch: 'Weekend Desk', permission: 'Token actions', status: 'Invited' }
];

export const subscriptionPlans: SubscriptionPlan[] = [
  { name: 'Free', price: '$0', description: 'Single branch starter plan.', features: ['1 branch', 'Basic queue', 'Email support'] },
  { name: 'Starter', price: '$29', description: 'For growing teams.', features: ['3 branches', 'Live queue', 'Role permissions'] },
  { name: 'Professional', price: '$79', description: 'Best for production operations.', features: ['Unlimited tokens', 'Analytics', 'Notifications'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', description: 'Custom rollout and SLA support.', features: ['SSO', 'Dedicated SLA', 'Custom limits'] }
];

export const invoiceRows: InvoiceRow[] = [
  { invoice: 'INV-1001', date: 'Jul 01, 2026', plan: 'Professional', amount: '$79', status: 'Paid' },
  { invoice: 'INV-1002', date: 'Jun 01, 2026', plan: 'Professional', amount: '$79', status: 'Paid' },
  { invoice: 'INV-1003', date: 'May 01, 2026', plan: 'Starter', amount: '$29', status: 'Due' }
];

export const qrRows: QrRow[] = [
  { label: 'North Wing QR', type: 'Branch', branch: 'North Wing', destination: 'Branch landing page' },
  { label: 'General Consultation QR', type: 'Service', branch: 'North Wing', destination: 'Service intake page' },
  { label: 'Counter 01 QR', type: 'Counter', branch: 'Central Desk', destination: 'Counter display flow' }
];

export const analyticsFallback: AnalyticsSummary = {
  average_wait_time_minutes: 12,
  average_service_time_minutes: 7,
  peak_hours: [
    { hour: 11, total: 48 },
    { hour: 12, total: 41 },
    { hour: 13, total: 35 }
  ],
  no_show_rate: 3.8,
  completed_tokens: 342,
  queue_load_by_service: [
    { service: 'Consultation', total: 122 },
    { service: 'Billing', total: 84 },
    { service: 'Priority', total: 61 }
  ],
  counter_performance: [
    { counter: 'Counter 1', total: 102 },
    { counter: 'Counter 2', total: 68 },
    { counter: 'Counter 3', total: 57 }
  ],
  insights: [
    'Peak load expected soon',
    'Counter 2 is slower than average',
    'No-show rate increased today',
    'Add one more counter to reduce wait time'
  ],
  prediction: {
    estimated_wait_minutes: 14,
    confidence: 'medium'
  }
};

export const notificationStatsFallback: NotificationStats = {
  total: 128,
  unread: 14,
  failed: 3,
  delivered: 102,
  providers: [
    { channel: 'sms', provider: 'twilio', enabled: true, missing_credentials: [] },
    { channel: 'whatsapp', provider: 'whatsapp_cloud', enabled: true, missing_credentials: [] },
    { channel: 'email', provider: 'resend', enabled: true, missing_credentials: ['RESEND_API_KEY'] },
    { channel: 'in_app', provider: 'in_app', enabled: true, missing_credentials: [] }
  ]
};

export const notificationTemplatesFallback: NotificationTemplateItem[] = [
  {
    id: 1,
    name: 'Token Called SMS',
    event_type: 'token_called',
    channel: 'sms',
    subject: '',
    body: 'Hello {{ customer_name }}, your token {{ token }} is now being called at {{ branch_name }}.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Queue Completed Email',
    event_type: 'queue_completed',
    channel: 'email',
    subject: 'Queue completed',
    body: 'Hello {{ customer_name }}, your visit at {{ branch_name }} is complete.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const notificationLogsFallback: NotificationLogItem[] = [
  {
    id: 1,
    notification: 3,
    provider: 'resend',
    status: 'failed',
    request_payload: {},
    response_payload: {},
    error_message: 'Missing destination.',
    attempted_at: new Date().toISOString()
  }
];
