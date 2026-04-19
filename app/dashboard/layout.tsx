import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { Suspense } from 'react';
import SignOutButton from './SignOutButton';
import ProposalUsageBadge from '@/components/dashboard/ProposalUsageBadge';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { DashboardMobileNav } from '@/components/dashboard/DashboardMobileNav';
import { authOptions } from '@/lib/auth';

export const metadata = { title: 'Dashboard | HEA' };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* ── Top bar — white ── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 z-20 shadow-sm">
        <Link href="/dashboard" className="flex-shrink-0">
          <img src="/Logo_transparent.png" alt="HEA" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="hidden sm:block w-44 h-7 bg-gray-100 rounded-lg animate-pulse" />}>
            <ProposalUsageBadge />
          </Suspense>
          <span className="text-[#6b7280] text-xs hidden md:block">{session.user?.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <aside className="hidden md:flex w-52 flex-shrink-0 bg-[#111827] flex-col overflow-y-auto">
          <DashboardNav />
        </aside>

        {/* Main content — add bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto bg-[#f5f7fa] pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav — hidden on desktop ── */}
      <DashboardMobileNav />
    </div>
  );
}
