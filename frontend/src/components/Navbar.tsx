'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import {
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Menu,
  X,
  Package,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/products' && (pathname === '/' || pathname === '/products')) return true;
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <NextLink
              href="/products"
              className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-white group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                NestStore
              </span>
            </NextLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <NextLink
                href="/products"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/products')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                Products
              </NextLink>

              {isAuthenticated && (
                <NextLink
                  href="/orders"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/orders')
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </NextLink>
              )}

              {isAdmin && (
                <NextLink
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50'
                      : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </NextLink>
              )}
            </nav>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Button */}
            <NextLink
              href="/cart"
              className="relative p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
                  {totalItems}
                </span>
              )}
            </NextLink>

            {/* User Profile / Auth buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                      {user?.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  <NextLink
                    href="/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </NextLink>
                  <NextLink
                    href="/register"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </NextLink>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-4 space-y-2">
          <NextLink
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Products
          </NextLink>
          {isAuthenticated && (
            <NextLink
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              My Orders
            </NextLink>
          )}
          {isAdmin && (
            <NextLink
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              Admin Panel
            </NextLink>
          )}
          <NextLink
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {totalItems} items
              </span>
            )}
          </NextLink>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email} • {user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <NextLink
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 px-3 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  Sign In
                </NextLink>
                <NextLink
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 px-3 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                >
                  Register
                </NextLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
