'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────
   Navigation structure — all tools have a home
───────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Overview',
        href: '/dashboard',
        exact: true,
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
      {
        label: 'Kanban',
        href: '/dashboard/kanban',
        exact: false,
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Proposals',
    items: [
      {
        label: 'Documents',
        href: '/dashboard/documents',
        exact: false,
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: 'Templates',
        href: '/dashboard/templates',
        exact: false,
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Solar Analyser',
        href: '/solar-analyser',
        exact: false,
        external: true,
        icon: (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        ),
      },
    ],
  },
] as const;

const BOTTOM_SECTION = [
  {
    label: 'Settings',
    href: '/dashboard/settings',
    exact: false,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  if (href === '/dashboard/jobs') {
    // Active on /dashboard/jobs AND /dashboard/jobs/[id], but not /dashboard/kanban etc.
    return pathname === '/dashboard/jobs' || pathname.startsWith('/dashboard/jobs/');
  }
  return pathname === href || pathname.startsWith(href + '/');
}

function NavItem({
  href,
  label,
  icon,
  active,
  external = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  external?: boolean;
}) {
  const cls = `flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border-l-2 transition-colors ${
    active
      ? 'border-[#ffd100] bg-[#ffd100]/8 text-white font-medium'
      : 'border-transparent text-[#777] hover:text-[#bbb] hover:bg-[#252525]'
  }`;

  const content = (
    <>
      <span className={active ? 'text-[#ffd100]' : 'text-[#555]'}>{icon}</span>
      <span className="leading-none">{label}</span>
      {external && (
        <svg className="w-3 h-3 ml-auto text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full py-3 px-2">
      {/* Main sections */}
      <div className="flex-1 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444] px-3 mb-1.5">
              {section.label}
            </p>
            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                // Overview: only exact /dashboard
                const active = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : isActive(pathname, item.href, item.exact);

                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={active}
                    external={'external' in item ? item.external : false}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom — Settings */}
      <div className="border-t border-[#2a2a2a] pt-3 space-y-0.5">
        {BOTTOM_SECTION.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item.href, item.exact)}
          />
        ))}
      </div>
    </nav>
  );
}
