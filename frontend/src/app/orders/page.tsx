'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { apiFetch } from '@/lib/api';
import { Order } from '@/types';
import {
  Package,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);
        const data = await apiFetch<Order[]>('/orders');
        setOrders(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load past orders');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Past Orders</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          You haven't placed any orders yet. Once you place an order, its details and status will appear here.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          My Past Orders
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Showing orders strictly associated with your account
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Order Header / Summary Card */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-5 sm:p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 capitalize">
                      <CheckCircle className="w-3 h-3" />
                      {order.status || 'completed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Placed on {formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <span className="block text-xs text-zinc-400">Total Price</span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expandable Order Items Breakdown */}
              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 p-5 sm:p-6 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Purchased Items ({order.items?.length || 0})
                  </h4>
                  <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between text-sm"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {item.productName || `Product #${item.productId.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Quantity: {item.quantity} × ${((item.price || item.unitPrice || 0)).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          ${(
                            item.subtotal ||
                            (item.price || item.unitPrice || 0) * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}
