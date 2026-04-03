import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { Suspense } from 'react';
import SignOutButton from './SignOutButton';
import ProposalUsageBadge from '@/components/dashboard/ProposalUsageBadge';
import DashboardNav from '@/components/dashboard/DashboardNav';

export const metadata = { title: 'Dashboard | HEA' };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#181818] flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-14 bg-[#202020] border-b border-[#2a2a2a] flex items-center justify-between px-5 flex-shrink-0 z-20">
        <Link href="/dashboard" className="flex-shrink-0">
          <img src="/Logo_transparent.png" alt="HEA" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="hidden sm:block w-44 h-7 bg-[#2a2a2a] rounded-lg animate-pulse" />}>
            <ProposalUsageBadge />
          </Suspense>
          <span className="text-[#444] text-xs hidden md:block">{session.user?.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-52 flex-shrink-0 bg-[#1d1d1d] border-r border-[#242424] flex flex-col overflow-y-auto">
          <DashboardNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
