import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/lib/realtime';

const statusLabel: Record<ConnectionStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
  disconnected: 'Disconnected'
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        status === 'connected' && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        status === 'connecting' && 'border-sky-400/30 bg-sky-400/10 text-sky-300',
        status === 'reconnecting' && 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        status === 'offline' && 'border-rose-400/30 bg-rose-400/10 text-rose-300',
        status === 'disconnected' && 'border-white/10 bg-white/5 text-slate-300'
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {statusLabel[status]}
    </div>
  );
}

