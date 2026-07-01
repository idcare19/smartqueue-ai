import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FiltersBar({ placeholder = 'Search...' }: { placeholder?: string }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Input placeholder={placeholder} className="md:max-w-sm" />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">Today</Button>
        <Button variant="secondary">Active</Button>
        <Button variant="secondary">Branch</Button>
      </div>
    </div>
  );
}

