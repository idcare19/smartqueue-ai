export function isActiveRoute(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isDashboardSection(pathname: string) {
  return pathname.startsWith('/dashboard');
}

