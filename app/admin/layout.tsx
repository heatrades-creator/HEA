import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import SignOutButton from "@/app/dashboard/SignOutButton"

export const metadata = { title: "Admin | HEA Group" }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/dashboard/login")
  }

  return (
    <div className="min-h-screen bg-[#181818]">
      <nav className="bg-[#202020] border-b border-[#2e2e2e] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin">
            <img src="/Logo_transparent.png" alt="HEA" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            {[
              { href: "/admin",       label: "Overview" },
              { href: "/admin/leads", label: "Leads" },
              { href: "/admin/jobs",  label: "Jobs" },
              { href: "/admin/audit", label: "Audit Log" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-sm text-[#d6d6d6] hover:text-[#ffd100] hover:bg-[#2a2a2a] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#555] text-sm hidden sm:block">
            {session.user?.email}
          </span>
          <Link
            href="/dashboard"
            className="text-xs text-[#555] hover:text-[#aaa] transition-colors"
          >
            Job CRM →
          </Link>
          <SignOutButton />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
