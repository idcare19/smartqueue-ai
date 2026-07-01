'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FiltersBar } from '@/components/site/filters-bar';
import { EmptyState } from '@/components/site/empty-state';
import { notificationsApi } from '@/lib/notifications-api';
import type { NotificationLogItem, NotificationStats, NotificationTemplateItem } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';

export default function SettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, failed: 0, delivered: 0, providers: [] });
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [templateName, setTemplateName] = useState('Token Called SMS');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('Hello {{ customer_name }}, your token {{ token }} is now being called at {{ branch_name }}.');

  useEffect(() => {
    async function loadSettings() {
      if (!accessToken) return;
      try {
        const [templateResponse, statsResponse, logResponse] = await Promise.all([
          notificationsApi.templates(accessToken),
          notificationsApi.stats(accessToken),
          notificationsApi.logs(accessToken)
        ]);
        setTemplates(templateResponse.results);
        setStats(statsResponse);
        setLogs(logResponse.results);
      } catch {
        return;
      }
    }

    void loadSettings();
  }, [accessToken]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <FiltersBar placeholder="Search settings..." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Branding</h2>
          <div className="mt-6 space-y-4">
            <Input placeholder="Brand name" />
            <Input placeholder="Support email" />
            <Input placeholder="Theme accent" />
            <Textarea placeholder="Business hours, queue rules, display notes..." />
          </div>
          <div className="mt-6 flex gap-3">
            <Button>Save settings</Button>
            <Button variant="secondary">Preview</Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Notification providers</h2>
          <p className="mt-4 text-sm text-slate-300">Provider availability and credential readiness managed from environment variables.</p>
          <div className="mt-6 grid gap-3">
            {stats.providers.map((item) => (
              <div key={item.channel} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{item.provider}</span>
                  <span className={item.enabled ? 'text-emerald-300' : 'text-rose-300'}>{item.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {item.missing_credentials.length > 0 ? `Missing: ${item.missing_credentials.join(', ')}` : 'Credentials present or mock-ready.'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <EmptyState title="Environment-managed providers" description="Use deployment environment variables to enable, disable, or rotate provider credentials safely." />
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-semibold">Notification templates</h2>
          <div className="mt-6 space-y-4">
            <Input placeholder="Template name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            <Input placeholder="Subject" value={templateSubject} onChange={(event) => setTemplateSubject(event.target.value)} />
            <Textarea placeholder="Template body" value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} />
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() =>
                accessToken
                  ? notificationsApi.createTemplate(accessToken, {
                      name: templateName,
                      event_type: 'token_called',
                      channel: 'sms',
                      subject: templateSubject,
                      body: templateBody,
                      is_active: true
                    }).then((created) => setTemplates((current) => [created, ...current]))
                  : undefined
              }
            >
              Save template
            </Button>
            <Button variant="secondary">Preview</Button>
          </div>
          <div className="mt-6 space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{template.name}</p>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{template.channel}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{template.event_type}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Failure logs</h2>
          <div className="mt-6 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-sm text-white">{log.provider}</p>
                <p className="mt-1 text-xs text-slate-400">{log.error_message || 'No error message'}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{log.status}</span>
                  <button
                    className="text-xs text-emerald-300 hover:text-emerald-200"
                    onClick={() => accessToken ? notificationsApi.retry(accessToken, log.notification) : undefined}
                  >
                    Retry failed notification
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
