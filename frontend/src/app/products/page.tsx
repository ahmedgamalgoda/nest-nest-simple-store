'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '@/types';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import {
  Search,
  ShoppingCart,
  Check,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const { addToCart, items } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        const data = await apiFetch<Product[]>('/products');
        setProducts(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    const success = addToCart(product, 1);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 1500);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStock = inStockOnly ? p.stock > 0 : true;
      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, inStockOnly]);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Curated Hardware Collection
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Engineered Gear for Modern Creators
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Explore our line of precision workspace tools, ergonomic peripherals, and audio instruments. Real-time inventory powered by NestJS and Prisma.
          </p>
        </div>
      </section>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>In stock only</span>
          </label>

          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}. Make sure the backend server on port 3001 is running.</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
              <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <Package className="w-12 h-12 mx-auto text-zinc-400 mb-3" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No products found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isAdded = !!addedIds[product.id];
            const inCartQuantity =
              items.find((item) => item.product.id === product.id)?.quantity || 0;
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= 10;
            const isMaxInCart = inCartQuantity >= product.stock;

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Stock and Category Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                      ID: {product.id.slice(0, 8)}
                    </span>
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Only {product.stock} left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                      {product.description || 'Premium hardware accessory with precision crafting.'}
                    </p>
                  </div>
                </div>

                {/* Footer: Price & Add to Cart */}
                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 uppercase font-medium">Price</span>
                    <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock || isMaxInCart}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : isOutOfStock || isMaxInCart
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added</span>
                      </>
                    ) : isOutOfStock ? (
                      <span>Sold Out</span>
                    ) : isMaxInCart ? (
                      <span>Max in Cart</span>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
