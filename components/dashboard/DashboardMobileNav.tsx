'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Active state helper ──────────────────────────────────────────────────────

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  if (href === '/dashboard/jobs') return pathname === '/dashboard/jobs' || pathname.startsWith('/dashboard/jobs/');
  return pathname === href || pathname.startsWith(href + '/');
}

// ── Inline SVG icons (subset used in bottom bar) ────────────────────────────

const icons = {
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  jobs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  kanban: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  people: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  // drawer icons
  command: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h11M9 21V3m12 9h-6m0 0l3-3m-3 3l3 3" />
    </svg>
  ),
  recruit: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  onboarding: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  units: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  tasks: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  documents: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  templates: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  pricing: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  solar: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  installers: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  contacts: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  external: (
    <svg className="w-3 h-3 ml-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

// ── Bottom tab definitions ───────────────────────────────────────────────────

const BOTTOM_TABS = [
  { label: 'Home',   href: '/dashboard',        exact: true,  icon: icons.home   },
  { label: 'Jobs',   href: '/dashboard/jobs',    exact: false, icon: icons.jobs   },
  { label: 'Board',  href: '/dashboard/kanban',  exact: false, icon: icons.kanban },
  { label: 'People', href: '/dashboard/c2/people', exact: false, icon: icons.people },
] as const;

// ── Full drawer nav (mirrors DashboardNav sections) ──────────────────────────

const DRAWER_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview',       href: '/dashboard',         exact: true,  icon: icons.home,      external: false },
      { label: 'Jobs',           href: '/dashboard/jobs',    exact: false, icon: icons.jobs,      external: false },
      { label: 'Kanban',         href: '/dashboard/kanban',  exact: false, icon: icons.kanban,    external: false },
    ],
  },
  {
    label: 'Command',
    items: [
      { label: 'Command',        href: '/dashboard/c2',                  exact: true,  icon: icons.command,    external: false },
      { label: 'People',         href: '/dashboard/c2/people',           exact: false, icon: icons.people,     external: false },
      { label: 'Recruit',        href: '/dashboard/c2/recruitment',      exact: false, icon: icons.recruit,    external: false },
      { label: 'Onboarding',     href: '/dashboard/c2/onboarding',       exact: false, icon: icons.onboarding, external: false },
      { label: 'Units',          href: '/dashboard/c2/units',            exact: false, icon: icons.units,      external: false },
      { label: 'Tasks',          href: '/dashboard/c2/tasks',            exact: false, icon: icons.tasks,      external: false },
      { label: 'Installers',     href: '/dashboard/c2/installers',       exact: false, icon: icons.installers, external: false },
      { label: 'Contacts',      href: '/dashboard/c2/contacts',         exact: false, icon: icons.contacts,   external: false },
    ],
  },
  {
    label: 'Proposals',
    items: [
      { label: 'Documents',      href: '/dashboard/documents',  exact: false, icon: icons.documents,  external: false },
      { label: 'Templates',      href: '/dashboard/templates',  exact: false, icon: icons.templates,  external: false },
      { label: 'Pricing',        href: '/dashboard/pricing',    exact: false, icon: icons.pricing,    external: false },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Solar Analyser', href: '/solar-analyser', exact: false, icon: icons.solar, external: true },
    ],
  },
];

const DRAWER_BOTTOM = [
  { label: 'Settings', href: '/dashboard/settings', exact: false, icon: icons.settings, external: false },
];

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardMobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const tabCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-h-[52px] transition-colors ${
      active ? 'text-[#ffd100]' : 'text-[#6b7280] active:text-white'
    }`;

  const drawerItemCls = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${
      active
        ? 'bg-white/10 text-white font-semibold border-l-2 border-[#ffd100]'
        : 'text-[#9ca3af] hover:text-white hover:bg-white/10 border-l-2 border-transparent'
    }`;

  return (
    <>
      {/* ── Bottom tab bar ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-white/10 flex items-stretch">
        {BOTTOM_TABS.map(tab => {
          const active = isActive(pathname, tab.href, tab.exact);
          return (
            <Link key={tab.href} href={tab.href} className={tabCls(active)}>
              <span className={active ? 'text-[#ffd100]' : 'text-[#6b7280]'}>{tab.icon}</span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={tabCls(drawerOpen)}
          aria-label="Open navigation menu"
        >
          <span className={drawerOpen ? 'text-[#ffd100]' : 'text-[#6b7280]'}>{icons.menu}</span>
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* ── Backdrop ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Slide-up drawer ──────────────────────────────────── */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-50 bg-[#111827] rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-out max-h-[82vh] flex flex-col
          ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
          <p className="text-white font-semibold text-sm">Navigation</p>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav content */}
        <div className="overflow-y-auto flex-1 px-3 py-3 space-y-4 pb-6">
          {DRAWER_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-4 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : isActive(pathname, item.href, item.exact);

                  const content = (
                    <>
                      <span className={active ? 'text-[#ffd100]' : 'text-gray-500'}>{item.icon}</span>
                      <span className="flex-1 leading-none">{item.label}</span>
                      {item.external && icons.external}
                    </>
                  );

                  if (item.external) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={drawerItemCls(active)}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} className={drawerItemCls(active)}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bottom settings */}
          <div className="border-t border-white/10 pt-3 space-y-0.5">
            {DRAWER_BOTTOM.map(item => {
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link key={item.href} href={item.href} className={drawerItemCls(active)}>
                  <span className={active ? 'text-[#ffd100]' : 'text-gray-500'}>{item.icon}</span>
                  <span className="flex-1 leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
