import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset access" subtitle="We’ll send a secure reset link to your email.">
      <AuthCard>
        <form className="space-y-4">
          <Input placeholder="Email address" type="email" />
          <Button className="w-full">Send reset link</Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

