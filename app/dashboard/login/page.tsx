import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LoginButton from './LoginButton';

export const metadata = { title: 'Staff Login | HEA' };

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="bg-[#eef0f5] border border-[#e5e9f0] rounded-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        {/* Logo */}
        <img src="/Logo_transparent.png" alt="HEA" className="h-16 w-auto" />

        <div className="text-center">
          <h1 className="text-[#111827] text-2xl font-semibold">Staff Dashboard</h1>
          <p className="text-[#6b7280] text-sm mt-1">Sign in with your HEA Google account</p>
        </div>

        <LoginButton />

        <p className="text-[#6b7280] text-xs text-center">
          Access restricted to authorised HEA staff only.
        </p>
      </div>
    </div>
  );
}
