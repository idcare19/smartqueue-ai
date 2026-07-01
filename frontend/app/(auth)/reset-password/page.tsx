import { AuthCard } from '@/components/auth/auth-card';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Use a strong password to secure your account.">
      <AuthCard>
        <form className="space-y-4">
          <Input placeholder="New password" type="password" />
          <Input placeholder="Confirm password" type="password" />
          <Button className="w-full">Update password</Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

