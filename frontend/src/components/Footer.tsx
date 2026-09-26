import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 dark:text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">NestStore</span>
          <span>•</span>
          <span>NestJS + Next.js Fullstack Architecture</span>
        </div>
        <p>© {new Date().getFullYear()} NestStore. All rights reserved.</p>
      </div>
    </footer>
  );
}
