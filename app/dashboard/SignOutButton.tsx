'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
      className="text-[#6b7280] hover:text-[#111827] text-sm transition-colors"
    >
      Sign out
    </button>
  );
}
