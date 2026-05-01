import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { InstallerTable } from '@/components/dashboard/c2/InstallerTable'
import { AppDistribution } from '@/components/dashboard/c2/AppDistribution'
import { NotifyInstallers } from '@/components/dashboard/c2/NotifyInstallers'

export default async function InstallersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Installers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage installer app access. PIN is used to log in on the mobile app.</p>
      </div>
      <InstallerTable />
      <AppDistribution />
      <NotifyInstallers />
    </div>
  )
}
