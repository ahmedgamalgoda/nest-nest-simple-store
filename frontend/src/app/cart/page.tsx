'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Order } from '@/types';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  PackageCheck,
  ArrowLeft,
  LogIn,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart');
      return;
    }

    if (items.length === 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // BACKEND RULE:
      // STRICTLY send { items: [{ productId, quantity }] }
      // NEVER send userId in the body!
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const createdOrder = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setOrderSuccess(createdOrder);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Check product stock availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed
  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/10">
          <PackageCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Order <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">#{orderSuccess.id.slice(0, 8)}</span> has been confirmed. Stock has been adjusted automatically.
        </p>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-left mb-8 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800 text-sm">
            <span className="text-zinc-500">Total Charged:</span>
            <span className="font-bold text-lg text-zinc-900 dark:text-white">
              ${orderSuccess.totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="pt-4 space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Items Ordered ({orderSuccess.items?.length || 0})
            </span>
            {orderSuccess.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-zinc-800 dark:text-zinc-200">
                  {item.productName || 'Product'} × {item.quantity}
                </span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  ${((item.price || item.unitPrice || 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            View My Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Looks like you haven't added any gear to your cart yet. Explore our product collection.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Shopping Cart
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review your items and place your order with automatic stock verification
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 flex-shrink-0" />
            <span>You need to be signed in to complete checkout.</span>
          </div>
          <Link
            href="/login?redirect=/cart"
            className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 whitespace-nowrap"
          >
            Sign in now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const maxStock = item.product.stock;
                const itemTotal = item.product.price * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        ${item.product.price.toFixed(2)} each •{' '}
                        <span className={maxStock < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}>
                          {maxStock} available
                        </span>
                      </p>
                    </div>

                    {/* Quantity controls and price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= maxStock}
                          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[80px]">
                        <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                          ${itemTotal.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={clearCart}
              className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear entire cart
            </button>
            <Link
              href="/products"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Add more products
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Items ({totalItems})</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Estimated Shipping</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Free
                </span>
              </div>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline">
                <span className="font-bold text-base text-zinc-900 dark:text-white">Total</span>
                <span className="font-black text-2xl text-zinc-900 dark:text-white">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || items.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Order...
                </span>
              ) : isAuthenticated ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Place Order (${totalPrice.toFixed(2)})
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to Place Order
                </>
              )}
            </button>

            <div className="text-[11px] text-zinc-400 text-center space-y-1">
              <p>🔒 Authenticated checkout via httpOnly token</p>
              <p>Stock will be decremented upon successful response</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
