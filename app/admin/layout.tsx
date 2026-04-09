import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin/AdminNav"

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
      <AdminNav userEmail={session.user?.email ?? ""} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
