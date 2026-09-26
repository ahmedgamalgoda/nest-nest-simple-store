'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AdminGuard';
import { apiFetch } from '@/lib/api';
import { Product } from '@/types';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Search,
} from 'lucide-react';

function AdminDashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<Product[]>('/products');
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/products/${deleteModalProduct.id}`, {
        method: 'DELETE',
      });
      setDeleteModalProduct(null);
      await loadProducts();
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-8">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider mb-1">
            Admin Management
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Product Inventory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Create, update, monitor stock levels, and delete products
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 shadow-md shadow-violet-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Products</span>
            <Package className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">{products.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Units</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">{totalStockUnits}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{lowStockCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{outOfStockCount}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2">
        <Search className="w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter by product name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    Loading inventory data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 10;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {product.name}
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                          {product.description || 'No description provided.'}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                          ID: {product.id}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                            0 (Out of stock)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                            {product.stock} (Low stock)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            {product.stock} available
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModalProduct(product)}
                            className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Product</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to permanently delete{' '}
              <strong className="text-zinc-900 dark:text-white">
                "{deleteModalProduct.name}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
