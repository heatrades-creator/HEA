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
    <div className="min-h-screen bg-[#f1f3f8] flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-14 bg-white border-b border-[#e5e9f0] flex items-center justify-between px-5 flex-shrink-0 z-20 shadow-sm">
        <Link href="/dashboard" className="flex-shrink-0">
          <img src="/Logo_transparent.png" alt="HEA" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="hidden sm:block w-44 h-7 bg-gray-100 rounded-lg animate-pulse" />}>
            <ProposalUsageBadge />
          </Suspense>
          <span className="text-gray-400 text-xs hidden md:block">{session.user?.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-52 flex-shrink-0 bg-white border-r border-[#e5e9f0] flex flex-col overflow-y-auto shadow-sm">
          <DashboardNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#f1f3f8]">
          {children}
        </main>
      </div>
    </div>
  );
}
