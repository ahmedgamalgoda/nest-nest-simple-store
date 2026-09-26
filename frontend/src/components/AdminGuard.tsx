'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Access Denied</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            You are signed in as <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.email}</span> with role <span className="font-semibold text-amber-600 dark:text-amber-400">'{user.role}'</span>. This area is strictly restricted to administrator accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
