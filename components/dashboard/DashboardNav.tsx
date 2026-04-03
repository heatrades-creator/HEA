'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/dashboard',
    exact: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Jobs',
    href: '/dashboard/jobs',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: 'Kanban',
    href: '/dashboard/kanban',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
] as const;

const BOTTOM_ITEMS = [
  {
    label: 'Settings',
    href: '/dashboard/settings',
    exact: false,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
] as const;

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-r-lg border-l-2 ${
        active
          ? 'border-[#ffd100] bg-[#ffd100]/5 text-white font-medium'
          : 'border-transparent text-[#666] hover:text-[#aaa] hover:bg-[#252525]'
      }`}
    >
      <span className={active ? 'text-[#ffd100]' : 'text-[#555]'}>{icon}</span>
      {label}
    </Link>
  );
}

export default function DashboardNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    // For /dashboard/jobs, match /dashboard/jobs and /dashboard/jobs/[id]
    // but NOT /dashboard/kanban etc.
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Special case: /dashboard/jobs/[id] should activate Jobs, not Overview
  const jobDetailActive = pathname.startsWith('/dashboard/jobs/');

  return (
    <nav className="flex flex-col h-full py-4">
      <div className="space-y-0.5 flex-1">
        <p className="text-[#333] text-[10px] font-semibold uppercase tracking-widest px-4 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          let active: boolean;
          if (item.href === '/dashboard') {
            // Overview is active only on exact /dashboard, not on /dashboard/jobs/[id]
            active = pathname === '/dashboard';
          } else if (item.href === '/dashboard/jobs') {
            // Jobs active on /dashboard/jobs AND /dashboard/jobs/[id]
            active = pathname === '/dashboard/jobs' || jobDetailActive;
          } else {
            active = isActive(item.href, item.exact);
          }
          return (
            <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={active} />
          );
        })}
      </div>

      <div className="space-y-0.5 border-t border-[#242424] pt-4">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href, item.exact)}
          />
        ))}
      </div>
    </nav>
  );
}
