# AuraMart — Full-Stack E-Commerce Platform

> **"Everything You Love, All in One Place."**  
> Modern, production-ready, full-stack e-commerce application inspired by the functionality and rich shopping experience of Amazon, designed with a distinct visual identity, database persistence, secure payments, and conversational AI assistance (**AURA AI**).

---

## 🌟 Key Highlights & Features

- **Unique Visual Identity**: Designed with a distinctive Midnight Navy (`#101828`), Royal Indigo (`#5146E5`), and Electric Violet (`#7C3AED`) color palette.
- **Full Database-Backed Catalog**: 15 major departments (Electronics, Mobiles, Computers & Laptops, Fashion, Footwear, Home & Kitchen, Furniture, Beauty, Grocery, Books, Toys, Sports, Automotive, Watches, Health).
- **Multi-Facet Search & Filtering**: Real-time typeahead suggestions, category filters, price range filter, rating filters, in-stock only switch, brand checkboxes, and dynamic sorting.
- **Persistent User Identity**: Email/password registration, password hashing with bcrypt, secure HTTP-only cookies, JWT verification, and persistent session on refresh.
- **Multiple Address Management**: Add, edit, delete, and set default delivery addresses with PIN code validation.
- **Server-Authoritative Cart & Checkout**:
  - Live inventory validation preventing overselling.
  - Multi-step checkout (Address selection → Items review → Payment selection → Coupon discount & final review).
  - Server-calculated subtotals, free shipping threshold (₹499+), and discount validation.
  - Immutable delivery address snapshots recorded at checkout time.
- **Razorpay Payment Gateway Integration**:
  - Server-side Razorpay order creation.
  - Cryptographic HMAC-SHA256 signature verification.
  - Webhook listener with raw-body signature validation.
  - Cash on Delivery (COD) mode with clear accounting.
- **AURA AI Shopping Assistant**:
  - Floating conversational widget at bottom-right.
  - Grounded catalog retrieval with embedded product cards and direct links.
  - Authenticated order lookup (strictly scoped to user's orders with zero leakage).
  - Automated rule-based fallback when external LLM API key is not supplied.
- **Protected Administrator Dashboard**:
  - Role-Based Access Control (`role: 'admin'`).
  - Real-time revenue metrics, total orders, product counts, and active customers.
  - Low-stock inventory alerts (&le; 10 units).
  - Product creation, stock modification, and deletion.
  - Order fulfillment state management (Pending → Confirmed → Processing → Shipped → Out for Delivery → Delivered → Cancelled).
  - Promotional coupon creation and activation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v7, Lucide Icons, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose ODM, Zod, Helmet, Cookie-Parser |
| **Database** | MongoDB (Local MongoDB Server or MongoDB Atlas) |
| **Authentication**| JWT (JSON Web Tokens), bcryptjs, HTTP-only secure cookies |
| **Payments** | Razorpay Node.js SDK, HMAC-SHA256 signature verification, Webhook processing |
| **AI Assistant** | AURA AI (Google Gemini Interactions API with local catalog RAG fallback) |
| **Testing** | Vitest, Supertest |
| **Deployment** | Vercel (Client SPA) & Render / Railway (Backend API) |

---

## 📁 Monorepo Folder Structure

```text
WT mini project/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/            # AuraChatModal.tsx (AURA AI Shopping Assistant)
│   │   │   ├── layout/        # Navbar, AnnouncementBar, CategoryBar, Footer
│   │   │   └── product/       # ProductCard, ProductGallery
│   │   ├── context/           # AuthContext, CartContext, WishlistContext, ToastContext
│   │   ├── pages/
│   │   │   ├── admin/         # AdminDashboardPage.tsx
│   │   │   ├── auth/          # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProductListingPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── WishlistPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   └── OrderConfirmationPage.tsx
│   │   ├── services/          # api.ts (Axios with credentials)
│   │   ├── types/             # index.ts (Full TypeScript contracts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json
├── server/
│   ├── src/
│   │   ├── config/            # db.ts, env.ts
│   │   ├── middlewares/       # auth.ts, errorHandler.ts, validate.ts
│   │   ├── models/            # User, Address, Product, Category, Cart, Order, Coupon, Review, Payment...
│   │   ├── routes/            # auth, product, category, cart, wishlist, address, order, payment, ai, admin
│   │   ├── services/          # razorpayService.ts, aiService.ts
│   │   ├── tests/             # api.test.ts (20 Vitest integration tests)
│   │   ├── seed.ts            # Database seed script for 15 departments
│   │   ├── app.ts             # Express app
│   │   └── server.ts          # HTTP listener
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env
├── package.json               # Root monorepo workspace scripts
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** running locally on port 27017 or a **MongoDB Atlas** connection string

### 2. Install Dependencies
From the project root:
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Environment Configuration
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/auramart
JWT_SECRET=auramart-ultra-secure-jwt-secret-key-2026
JWT_EXPIRES_IN=7d
COOKIE_SECRET=auramart-cookie-secret-key-2026
FRONTEND_URL=http://localhost:5173

# Optional: Add Razorpay test credentials from https://dashboard.razorpay.com/
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Optional: Add Gemini API key for live LLM text generation
GEMINI_API_KEY=

ADMIN_EMAIL=admin@auramart.com
ADMIN_PASSWORD=Admin@AuraMart2026
```

### 4. Seed the Database
Populate all 15 categories, 21 realistic products with high-resolution imagery, demo customer, admin user, and sample promotional coupons:
```bash
cd server
npm run seed
```

### 5. Run Automated Tests
Execute the 20 comprehensive Vitest test cases:
```bash
cd server
npm test
```

### 6. Run the Application
In terminal 1 (start backend API on port 5000):
```bash
cd server
npm run dev
```

In terminal 2 (start frontend Vite dev server on port 5173):
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your web browser!

---

## 🔑 Demo Evaluation Accounts

For quick grading and interactive testing, convenient **"1-Click Auto-Fill"** buttons are provided on the Login page:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@auramart.com` | `Customer@123` | Browsing, Cart, Multi-step checkout, Order tracking, Address book, Reviews |
| **Admin** | `admin@auramart.com` | `Admin@AuraMart2026` | Admin Portal, Revenue stats, Inventory control, Order status management, Coupons |

---

## 💳 Razorpay Test Mode & Indian Payments

AuraMart is engineered to adhere strictly to real payment security guidelines:
1. **Server-Side Order Creation**: The browser never declares an order paid. `POST /api/payments/razorpay/create-order` creates the order on Razorpay servers.
2. **Cryptographic Signature Verification**: `POST /api/payments/razorpay/verify` calculates `HMAC-SHA256(order_id + '|' + payment_id, secret)` and compares it safely with `crypto.timingSafeEqual`. Forged signatures are immediately rejected.
3. **Webhook Verification**: Verifies raw-body signature before processing asynchronous `payment.captured` webhooks.
4. **Cash on Delivery (COD)**: Fully functional out of the box with separate payment status tracking.

---

## 🤖 AURA AI Shopping Assistant

1. **Floating AI Button**: Available on every page at the bottom-right corner.
2. **Catalog-Grounded RAG**: When asked queries such as *"Show me headphones under 30000"* or *"Recommend a laptop"*, AURA AI queries MongoDB and renders actionable product cards with prices, ratings, and direct links.
3. **Secure Order Lookup**: When an authenticated user asks *"Where is my latest order?"*, AURA AI inspects the database strictly for orders belonging to `req.user._id` and reports live fulfillment status.
4. **Intelligent Fallback**: If `GEMINI_API_KEY` is not present, the assistant automatically switches to its catalog-grounded search & FAQ engine.

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `client`.
3. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://auramart-api.onrender.com/api`).
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Backend (Render / Railway)
1. Create a Web Service on [Render](https://render.com).
2. Set Root Directory to `server`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Configure Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, etc.).
6. Database: Use a free cluster from [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## 📜 API Route Reference

- `POST /api/auth/register` — Register account with initial delivery address
- `POST /api/auth/login` — Sign in and issue HTTP-only cookie / JWT
- `GET /api/auth/me` — Current user profile and addresses
- `GET /api/products` — Catalog listing with pagination and multi-facet filtering
- `GET /api/products/:idOrSlug` — Detailed product specification and related items
- `GET /api/categories` — Department list with aggregated item counts
- `GET /api/cart` — Live database-backed cart with stock calculations
- `POST /api/cart/items` — Add item with stock limit validation
- `POST /api/checkout/validate` — Server-side price calculation and coupon verification
- `POST /api/orders` — Atomic inventory decrement and order creation
- `POST /api/payments/razorpay/verify` — HMAC signature verification
- `POST /api/ai/chat` — Grounded conversational shopping assistant
- `GET /api/admin/dashboard` — Role-protected operational analytics and low-stock alerts

