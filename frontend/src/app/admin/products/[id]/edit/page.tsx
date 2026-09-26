'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { apiFetch } from '@/lib/api';
import { Product, UpdateProductInput } from '@/types';
import {
  ArrowLeft,
  Pencil,
  AlertCircle,
  Tag,
  DollarSign,
  Package,
  FileText,
  Loader2,
} from 'lucide-react';

function EditProductForm() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        setIsFetching(true);
        const product = await apiFetch<Product>(`/products/${productId}`);
        setName(product.name || '');
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setStock(product.stock.toString());
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setIsFetching(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be a positive number greater than 0.');
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      setError('Stock must be an integer greater than or equal to 0.');
      return;
    }

    setIsSaving(true);

    try {
      // BACKEND RULE:
      // Whitelist strict validation: Only send name, description, price, stock
      // NEVER send id, createdAt, updatedAt!
      const payload: UpdateProductInput = {
        name: name.trim(),
        price: parsedPrice,
        stock: parsedStock,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      await apiFetch<Product>(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm text-zinc-500">Loading product #{productId}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory Dashboard
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
            <Pencil className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Product</h1>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">ID: {productId}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
              Product Name *
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Price (USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49.99"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1.5">
                Available Stock Quantity *
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="25"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/20 disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditProductPage() {
  return (
    <AdminGuard>
      <EditProductForm />
    </AdminGuard>
  );
}
