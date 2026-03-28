import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LoginButton from './LoginButton';

export const metadata = { title: 'Staff Login | HEA' };

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#202020] flex items-center justify-center">
      <div className="bg-[#2a2a2a] border border-[#333] rounded-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        {/* Logo */}
        <img src="/Logo_transparent.png" alt="HEA" className="h-16 w-auto" />

        <div className="text-center">
          <h1 className="text-white text-2xl font-semibold">Staff Dashboard</h1>
          <p className="text-[#888] text-sm mt-1">Sign in with your HEA Google account</p>
        </div>

        <LoginButton />

        <p className="text-[#555] text-xs text-center">
          Access restricted to authorised HEA staff only.
        </p>
      </div>
    </div>
  );
}
