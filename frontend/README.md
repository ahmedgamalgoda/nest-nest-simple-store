# 💻 NestStore — Next.js Frontend Application

The customer storefront and admin management web application for **NestStore**, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 📚 Documentation Links

- [Frontend Architecture & Component Guide](file:///c:/dev/personal/lab/nest-nest-store/docs/FRONTEND_GUIDE.md)
- [System Architecture & Sequence Flow](file:///c:/dev/personal/lab/nest-nest-store/docs/ARCHITECTURE.md)
- [Backend API Reference](file:///c:/dev/personal/lab/nest-nest-store/docs/BACKEND_API.md)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Production Build & Validation
```bash
npm run build
npm run start
```

---

## 🔑 Key Features
- **Auto-redirect**: Visiting `/` automatically redirects to `/products`.
- **Dual-Mode Theme**: Seamless light/dark mode switch with local storage persistence.
- **Cart & Orders**: Client-side cart persistence (`localStorage`), stock guarding, and strict order checkout.
- **Authentication**: `httpOnly` cookie integration via `apiFetch`, session restoration via `GET /auth/me`.
- **Role-based Route Guards**: `AuthGuard` for customer routes, `AdminGuard` for `/admin` product management.
