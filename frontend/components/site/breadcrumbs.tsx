import Link from 'next/link';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          {item.href ? <Link href={item.href} className="text-slate-300 hover:text-white">{item.label}</Link> : <span>{item.label}</span>}
        </div>
      ))}
    </nav>
  );
}
