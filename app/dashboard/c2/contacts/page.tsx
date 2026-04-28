import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ContactsTable } from '@/components/dashboard/c2/ContactsTable'

export default async function ContactsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Supplier and trade contacts shown to installers in the mobile app.
        </p>
      </div>
      <ContactsTable />
    </div>
  )
}
