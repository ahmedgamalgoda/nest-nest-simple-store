import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';
(globalThis as any).Temporal = Temporal;
import bcrypt from 'bcrypt';
import { db } from './prisma/db.js';

async function seed() {
  console.log('Connecting to database...');
  await db.connect();

  // 1. Seed Admin User
  const adminEmail = 'admin@store.com';
  const existingAdmin = await db.orm.public.User.where({ email: adminEmail }).first();

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await db.orm.public.User.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Store Admin',
      role: 'admin',
    });
    console.log(`Created admin user: ${admin.email} (Password: admin123, Role: admin)`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // 2. Seed Sample Customer User
  const customerEmail = 'customer@store.com';
  const existingCustomer = await db.orm.public.User.where({ email: customerEmail }).first();

  if (!existingCustomer) {
    const hashedPassword = await bcrypt.hash('customer123', 10);
    const customer = await db.orm.public.User.create({
      email: customerEmail,
      password: hashedPassword,
      name: 'John Customer',
      role: 'user',
    });
    console.log(`Created customer user: ${customer.email} (Password: customer123, Role: user)`);
  } else {
    console.log(`Customer user already exists: ${customerEmail}`);
  }

  // 3. Seed Sample Products
  const sampleProducts = [
    {
      name: 'Ergonomic Mechanical Keyboard',
      description: 'Custom lubed switches with PBT double-shot keycaps and per-key RGB backlighting.',
      price: 129.99,
      stock: 35,
    },
    {
      name: 'Precision Wireless Mouse',
      description: 'Ultra-lightweight 58g ergonomic gaming and productivity mouse with 26K DPI optical sensor.',
      price: 79.99,
      stock: 45,
    },
    {
      name: 'Noise-Cancelling Studio Headphones',
      description: 'Audiophile-grade active noise cancellation with 40-hour battery life and memory foam earcups.',
      price: 249.99,
      stock: 20,
    },
    {
      name: 'Ultra-Wide 34" Curved Monitor',
      description: 'WQHD 144Hz IPS display with 99% sRGB color gamut and USB-C 90W power delivery.',
      price: 499.99,
      stock: 12,
    },
    {
      name: 'USB-C Aluminum Multiport Dock',
      description: '10-in-1 hub featuring dual 4K HDMI, 100W PD passthrough, Gigabit Ethernet, and SD card reader.',
      price: 64.99,
      stock: 50,
    },
    {
      name: 'Minimalist Desk Mat (XL)',
      description: 'Water-resistant vegan leather desk pad with anti-slip base and stitched edges.',
      price: 29.99,
      stock: 60,
    },
  ];

  const existingProducts = await db.orm.public.Product.all();
  if (existingProducts.length === 0) {
    console.log('Seeding initial products...');
    for (const prod of sampleProducts) {
      const created = await db.orm.public.Product.create(prod);
      console.log(`Created product: ${created.name} - $${created.price} (Stock: ${created.stock})`);
    }
  } else {
    console.log(`Database already has ${existingProducts.length} products.`);
  }

  await db.close();
  console.log('Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
