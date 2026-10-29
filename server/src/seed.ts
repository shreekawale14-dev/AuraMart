import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Address } from './models/Address.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { Coupon } from './models/Coupon.js';
import { Review } from './models/Review.js';
import { ENV } from './config/env.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Starting database cleanup and seeding...');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Address.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({})
    ]);

    // 1. Create Admin and Demo Customer Accounts
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(ENV.ADMIN_PASSWORD, adminSalt);
    const adminUser = await User.create({
      name: 'AuraMart Administrator',
      email: ENV.ADMIN_EMAIL.toLowerCase(),
      phone: '+91 9876543210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isEmailVerified: true
    });

    const customerSalt = await bcrypt.genSalt(10);
    const customerPasswordHash = await bcrypt.hash('Customer@123', customerSalt);
    const demoCustomer = await User.create({
      name: 'Rahul Sharma',
      email: 'customer@auramart.com',
      phone: '+91 9811223344',
      passwordHash: customerPasswordHash,
      role: 'customer',
      isEmailVerified: true
    });

    // Create default address for demo customer
    await Address.create({
      user: demoCustomer._id,
      fullName: 'Rahul Sharma',
      phone: '+91 9811223344',
      street: '402, Lotus Grandeur, Veera Desai Road',
      addressLine2: 'Opposite Country Club, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400053',
      country: 'India',
      addressType: 'Home',
      isDefault: true
    });

    console.log('[Seed] Admin and Demo Customer created successfully.');

    // 2. Categories
    const categoriesData = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Premium audio, smart displays, wearable tech, and photography gear',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        icon: 'Headphones'
      },
      {
        name: 'Mobiles & Accessories',
        slug: 'mobiles-accessories',
        description: 'Latest flagship 5G smartphones, power banks, and accessories',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
        icon: 'Smartphone'
      },
      {
        name: 'Computers & Laptops',
        slug: 'computers-laptops',
        description: 'High-performance ultrabooks, gaming rigs, monitors, and peripherals',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
        icon: 'Laptop'
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Contemporary apparel, ethnic wear, and everyday essentials for men, women & kids',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
        icon: 'Shirt'
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        description: 'Running shoes, casual sneakers, formal shoes, and sandals',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        icon: 'Footprints'
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Smart kitchen appliances, cookware sets, and home utilities',
        image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
        icon: 'Utensils'
      },
      {
        name: 'Furniture & Decor',
        slug: 'furniture-decor',
        description: 'Ergonomic chairs, coffee tables, ambient lamps, and modern aesthetic accents',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        icon: 'Armchair'
      },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        description: 'Clean skincare, luxury fragrances, haircare, and grooming kits',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        icon: 'Sparkles'
      },
      {
        name: 'Grocery & Essentials',
        slug: 'grocery-essentials',
        description: 'Organic staples, gourmet coffee, snacks, and daily household needs',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
        icon: 'ShoppingBasket'
      },
      {
        name: 'Books & Stationery',
        slug: 'books-stationery',
        description: 'Bestselling novels, engineering textbooks, premium journals, and art supplies',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        icon: 'BookOpen'
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Educational STEAM sets, board games, and action collectibles',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80',
        icon: 'Gamepad2'
      },
      {
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        description: 'Gym equipment, yoga mats, resistance bands, and outdoor gear',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
        icon: 'Dumbbell'
      },
      {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car chargers, air purifiers, emergency kits, and tyre inflators',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
        icon: 'Car'
      },
      {
        name: 'Watches & Jewellery',
        slug: 'watches-jewellery',
        description: 'Luxury chronographs, smart fitness watches, and sterling silver accents',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        icon: 'Watch'
      },
      {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        description: 'Herbal supplements, massagers, wellness monitors, and vitamins',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
        icon: 'HeartPulse'
      }
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    const catMap = new Map<string, mongoose.Types.ObjectId>();
    createdCategories.forEach(c => catMap.set(c.slug, c._id as mongoose.Types.ObjectId));

    console.log(`[Seed] ${createdCategories.length} Categories seeded.`);

    // 3. Products
    const productsData = [
      // 1. Electronics
      {
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        slug: 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
        description: 'Industry-leading noise cancellation optimized to you; Magnificent Sound, engineered to perfection with the new Integrated Processor V1; Crystal clear hands-free calling with 4 beamforming microphones.',
        price: 34990,
        discountPercent: 15,
        discountedPrice: 29741,
        brand: 'Sony',
        category: catMap.get('electronics'),
        categoryName: 'Electronics',
        sku: 'SONY-WHXM5-BLK',
        stock: 24,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 342,
        features: [
          'Industry-leading active noise cancellation',
          'Up to 30-hour battery life with quick charging',
          'Ultra-comfortable, lightweight design in soft fit leather',
          'Multipoint connection allows switching between devices'
        ],
        variants: [{ name: 'Color', options: ['Black', 'Silver', 'Midnight Blue'] }],
        tags: ['audio', 'headphones', 'sony', 'wireless', 'anc', 'bluetooth'],
        isFeatured: true,
        isTrending: true,
        isBestseller: true,
        specifications: {
          'Battery Life': '30 Hours',
          'Driver Unit': '30mm',
          'Bluetooth': 'v5.2',
          'Weight': '250g'
        }
      },
      {
        title: 'Bose SoundLink Flex Bluetooth Portable Speaker',
        slug: 'bose-soundlink-flex-bluetooth-portable-speaker',
        description: 'Clear, deep sound and powerful bass with PositionIQ technology that automatically optimizes sound orientation. Waterproof and dustproof (IP67).',
        price: 15900,
        discountPercent: 20,
        discountedPrice: 12720,
        brand: 'Bose',
        category: catMap.get('electronics'),
        categoryName: 'Electronics',
        sku: 'BOSE-SLFLEX-BLK',
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 189,
        features: ['IP67 waterproof and dustproof', 'Up to 12 hours of battery life', 'Built-in microphone for speakerphone'],
        variants: [{ name: 'Color', options: ['Black', 'White Smoke', 'Stone Blue'] }],
        tags: ['speaker', 'bose', 'audio', 'portable', 'waterproof'],
        isFeatured: false,
        isTrending: true,
        isBestseller: false,
        specifications: { 'Water Resistance': 'IP67', 'Battery': '12 Hours', 'Charging': 'USB-C' }
      },

      // 2. Mobiles & Accessories
      {
        title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
        slug: 'apple-iphone-15-pro-128gb-natural-titanium',
        description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and a more versatile Pro camera system with 48MP main sensor.',
        price: 134900,
        discountPercent: 8,
        discountedPrice: 124108,
        brand: 'Apple',
        category: catMap.get('mobiles-accessories'),
        categoryName: 'Mobiles & Accessories',
        sku: 'APL-IP15P-128-NT',
        stock: 18,
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.9,
        ratingsCount: 520,
        features: ['Aerospace-grade titanium design', 'A17 Pro chip with 6-core GPU', '48MP Pro camera system with 3x Telephoto', 'Super Retina XDR display with ProMotion 120Hz'],
        variants: [
          { name: 'Storage', options: ['128GB', '256GB', '512GB', '1TB'] },
          { name: 'Color', options: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] }
        ],
        tags: ['iphone', 'apple', 'mobile', 'smartphone', '5g', 'titanium'],
        isFeatured: true,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Processor': 'A17 Pro', 'Display': '6.1-inch OLED 120Hz', 'Camera': '48MP + 12MP + 12MP', 'Connector': 'USB-C (USB 3)' }
      },
      {
        title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256GB)',
        slug: 'samsung-galaxy-s24-ultra-5g-256gb-titanium-gray',
        description: 'Welcome to the era of mobile AI. With Galaxy AI, search like never before, get real-time voice translation on a call, and format your notes effortlessly. Quad Tele System with 200MP camera.',
        price: 129999,
        discountPercent: 10,
        discountedPrice: 116999,
        brand: 'Samsung',
        category: catMap.get('mobiles-accessories'),
        categoryName: 'Mobiles & Accessories',
        sku: 'SAM-S24U-256-GRY',
        stock: 14,
        images: [
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 290,
        features: ['Built-in S Pen stylus', 'Snapdragon 8 Gen 3 for Galaxy', '200MP Quad Camera with 100x Space Zoom', 'Corning Gorilla Armor anti-reflective glass'],
        variants: [{ name: 'Storage', options: ['256GB', '512GB'] }],
        tags: ['samsung', 'galaxy', 'smartphone', '5g', 'ai', 'spen'],
        isFeatured: true,
        isTrending: true,
        isBestseller: false,
        specifications: { 'Screen': '6.8-inch QHD+ AMOLED', 'RAM': '12GB', 'Battery': '5000 mAh', 'Weight': '232g' }
      },
      {
        title: 'Anker 65W GaN Fast Charger PowerPort III 3-Port',
        slug: 'anker-65w-gan-fast-charger-3-port',
        description: 'Charge phones, tablets, and USB-C notebooks from a single compact pocket-sized charger. Powered by GaN II technology.',
        price: 3999,
        discountPercent: 25,
        discountedPrice: 2999,
        brand: 'Anker',
        category: catMap.get('mobiles-accessories'),
        categoryName: 'Mobiles & Accessories',
        sku: 'ANK-GAN65-BLK',
        stock: 80,
        images: [
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.6,
        ratingsCount: 145,
        features: ['65W Max high-speed output', '2x USB-C and 1x USB-A ports', 'Compact foldable design'],
        variants: [{ name: 'Color', options: ['Black', 'White'] }],
        tags: ['charger', 'anker', 'fast-charging', 'accessories'],
        isFeatured: false,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Output': '65W Max', 'Ports': '2x USB-C, 1x USB-A', 'Technology': 'GaN II' }
      },

      // 3. Computers & Laptops
      {
        title: 'Apple MacBook Air 15-inch M3 Chip (16GB RAM, 512GB SSD)',
        slug: 'apple-macbook-air-15-inch-m3-chip-16gb-512gb',
        description: 'Lean, mean, M3 machine. Incredibly thin with a spacious 15.3-inch Liquid Retina display, up to 18 hours of battery life, and silent fanless design.',
        price: 154900,
        discountPercent: 12,
        discountedPrice: 136312,
        brand: 'Apple',
        category: catMap.get('computers-laptops'),
        categoryName: 'Computers & Laptops',
        sku: 'APL-MBA15-M3-ST',
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.9,
        ratingsCount: 210,
        features: ['Apple M3 chip with 8-core CPU and 10-core GPU', 'Spacious 15.3-inch Liquid Retina display', 'MagSafe 3 charging and two Thunderbolt ports', 'Magic Keyboard with Touch ID'],
        variants: [
          { name: 'Color', options: ['Starlight', 'Midnight', 'Space Gray', 'Silver'] },
          { name: 'Storage', options: ['256GB', '512GB'] }
        ],
        tags: ['laptop', 'macbook', 'apple', 'm3', 'ultrabook'],
        isFeatured: true,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Processor': 'Apple M3', 'RAM': '16GB Unified', 'Storage': '512GB SSD', 'Weight': '1.51 kg' }
      },
      {
        title: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
        slug: 'asus-rog-zephyrus-g16-oled-gaming-laptop',
        description: 'Intel Core Ultra 9 185H, NVIDIA GeForce RTX 4070 8GB GDDR6, 16-inch 2.5K 240Hz OLED ROG Nebula Display, 32GB LPDDR5X, 1TB PCIe 4.0 SSD.',
        price: 199990,
        discountPercent: 15,
        discountedPrice: 169991,
        brand: 'ASUS',
        category: catMap.get('computers-laptops'),
        categoryName: 'Computers & Laptops',
        sku: 'ASUS-G16-RTX4070',
        stock: 8,
        images: [
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 94,
        features: ['NVIDIA GeForce RTX 4070 Laptop GPU', '2.5K 240Hz 0.2ms ROG Nebula OLED display', 'Sleek CNC aluminum chassis with Slash Lighting', 'Vapor chamber cooling system'],
        variants: [{ name: 'Color', options: ['Eclipse Gray', 'Platinum White'] }],
        tags: ['laptop', 'gaming', 'asus', 'rtx4070', 'oled'],
        isFeatured: true,
        isTrending: false,
        isBestseller: false,
        specifications: { 'GPU': 'RTX 4070 8GB', 'Display': '16-inch 240Hz OLED', 'RAM': '32GB', 'Storage': '1TB SSD' }
      },
      {
        title: 'Lenovo IdeaPad Slim 3 12th Gen Intel Core i5 (16GB/512GB SSD)',
        slug: 'lenovo-ideapad-slim-3-intel-core-i5-16gb-512gb',
        description: 'Budget-friendly powerhouse laptop for students and professionals. Thin and light 1.63kg with FHD IPS display and Dolby Audio.',
        price: 68990,
        discountPercent: 28,
        discountedPrice: 49672,
        brand: 'Lenovo',
        category: catMap.get('computers-laptops'),
        categoryName: 'Computers & Laptops',
        sku: 'LEN-IPS3-I5-16',
        stock: 35,
        images: [
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.5,
        ratingsCount: 310,
        features: ['12th Gen Intel Core i5-12450H', '16GB DDR4 RAM and 512GB SSD', '15.6-inch FHD Antiglare display', 'Rapid Charge technology (80% in 1 hr)'],
        variants: [{ name: 'Color', options: ['Arctic Grey', 'Abyss Blue'] }],
        tags: ['laptop', 'budget', 'lenovo', 'students', 'intel', 'under-60000'],
        isFeatured: false,
        isTrending: true,
        isBestseller: true,
        specifications: { 'CPU': 'Intel Core i5-12450H', 'RAM': '16GB', 'Storage': '512GB SSD', 'Display': '15.6" FHD' }
      },

      // 4. Fashion
      {
        title: 'Levi\'s Men\'s Premium Slim Fit Denim Jacket',
        slug: 'levis-mens-premium-slim-fit-denim-jacket',
        description: 'The iconic Levi\'s trucker jacket crafted from durable rigid denim with point collar, front button placket, and dual flap chest pockets.',
        price: 5999,
        discountPercent: 35,
        discountedPrice: 3899,
        brand: 'Levi\'s',
        category: catMap.get('fashion'),
        categoryName: 'Fashion',
        sku: 'LEV-TRK-JKT-BLU',
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.6,
        ratingsCount: 167,
        features: ['100% Cotton denim', 'Classic point collar', 'Standard slim fit', 'Side welt pockets'],
        variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] }],
        tags: ['fashion', 'jacket', 'denim', 'menswear', 'levis'],
        isFeatured: false,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Material': '100% Cotton', 'Fit': 'Slim Fit', 'Wash Care': 'Machine wash cold' }
      },
      {
        title: 'ZARA Women\'s Oversized Structured Trench Coat',
        slug: 'zara-womens-oversized-structured-trench-coat',
        description: 'Double-breasted long trench coat with lapel collar, long sleeves, front welt pockets, and matching belt with buckle.',
        price: 7990,
        discountPercent: 20,
        discountedPrice: 6392,
        brand: 'Zara',
        category: catMap.get('fashion'),
        categoryName: 'Fashion',
        sku: 'ZAR-W-TRNCH-KHK',
        stock: 22,
        images: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 88,
        features: ['Classic double breasted closure', 'Adjustable waist belt', 'Water repellent fabric'],
        variants: [
          { name: 'Size', options: ['XS', 'S', 'M', 'L'] },
          { name: 'Color', options: ['Camel', 'Black'] }
        ],
        tags: ['fashion', 'coat', 'womenswear', 'outerwear', 'zara'],
        isFeatured: true,
        isTrending: false,
        isBestseller: false,
        specifications: { 'Material': 'Polyester & Cotton blend', 'Lining': '100% Viscose' }
      },

      // 5. Footwear
      {
        title: 'Nike Air Max 270 Men\'s Running & Lifestyle Sneakers',
        slug: 'nike-air-max-270-mens-sneakers',
        description: 'Boasting Nike\'s biggest heel Air unit yet, the Nike Air Max 270 delivers visible air under every step. Knit fabric on the upper provides a lightweight fit and airy feel.',
        price: 13995,
        discountPercent: 15,
        discountedPrice: 11895,
        brand: 'Nike',
        category: catMap.get('footwear'),
        categoryName: 'Footwear',
        sku: 'NKE-AM270-BLK',
        stock: 40,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 412,
        features: ['Large Max Air unit delivers responsive cushioning', 'Stretchy inner sleeve creates a snug, sock-like fit', 'Rubber on the outsole adds durable traction'],
        variants: [
          { name: 'Size (UK)', options: ['7', '8', '9', '10', '11'] },
          { name: 'Color', options: ['Black/University Red', 'Triple White', 'Triple Black'] }
        ],
        tags: ['shoes', 'sneakers', 'nike', 'running', 'footwear', 'airmax'],
        isFeatured: true,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Closure': 'Lace-Up', 'Sole': 'Rubber with Air Cushion', 'Upper': 'Engineered Mesh' }
      },

      // 6. Home & Kitchen
      {
        title: 'Philips Air Fryer HD9252/90 with Rapid Air Technology',
        slug: 'philips-air-fryer-hd9252-90-rapid-air-technology',
        description: 'Fry with up to 90% less fat. Rapid Air Technology with unique starfish design swirls hot air to create delicious foods that are crispy on the outside and tender on the inside.',
        price: 11995,
        discountPercent: 30,
        discountedPrice: 8396,
        brand: 'Philips',
        category: catMap.get('home-kitchen'),
        categoryName: 'Home & Kitchen',
        sku: 'PHI-AF-HD9252',
        stock: 32,
        images: [
          'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 245,
        features: ['4.1 Litre capacity for family cooking', 'Touchscreen with 7 presets', 'Keep warm function', 'Dishwasher safe parts'],
        variants: [{ name: 'Color', options: ['Black', 'White'] }],
        tags: ['kitchen', 'airfryer', 'appliances', 'philips', 'cooking'],
        isFeatured: false,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Capacity': '4.1 L', 'Power': '1400 Watts', 'Presets': '7 Cooking Presets' }
      },

      // 7. Furniture & Decor
      {
        title: 'Green Soul Monster Ultimate Ergonomic Gaming & Work Chair',
        slug: 'green-soul-monster-ultimate-ergonomic-chair',
        description: 'Heavy duty internal metal frame with premium breathable spandex fabric, magnetic memory foam headrest pillow, and adjustable lumbar support.',
        price: 24990,
        discountPercent: 32,
        discountedPrice: 16993,
        brand: 'Green Soul',
        category: catMap.get('furniture-decor'),
        categoryName: 'Furniture & Decor',
        sku: 'GS-MNSTR-ULT-GRY',
        stock: 19,
        images: [
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.6,
        ratingsCount: 178,
        features: ['4D adjustable armrests', 'Magnetic memory foam neck pillow', 'Multi-tilt mechanism with 180° recline', 'Class 4 gas lift for up to 135kg support'],
        variants: [{ name: 'Color', options: ['Charcoal Gray', 'All Black', 'Ruby Red'] }],
        tags: ['furniture', 'chair', 'gaming-chair', 'office', 'ergonomic'],
        isFeatured: true,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Weight Capacity': '135 kg', 'Recline': '90° to 180°', 'Frame': 'Metal' }
      },

      // 8. Beauty & Personal Care
      {
        title: 'Minimalist 10% Niacinamide Face Serum with Zinc (30ml)',
        slug: 'minimalist-10-niacinamide-face-serum-zinc-30ml',
        description: 'Nourishing daily serum packed with pure Vitamin B3 (Niacinamide) and antioxidant Zinc to balance oil, reduce acne marks, and improve skin barrier.',
        price: 599,
        discountPercent: 10,
        discountedPrice: 539,
        brand: 'Minimalist',
        category: catMap.get('beauty-personal-care'),
        categoryName: 'Beauty & Personal Care',
        sku: 'MIN-NIA10-30ML',
        stock: 120,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 560,
        features: ['Reduces blemish appearance and pore congestion', 'Fragrance free and non-comedogenic', 'Suitable for all skin types including sensitive skin'],
        variants: [{ name: 'Size', options: ['30ml', '50ml'] }],
        tags: ['skincare', 'serum', 'niacinamide', 'beauty', 'minimalist'],
        isFeatured: false,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Skin Type': 'All Skin Types', 'Volume': '30ml', 'Active Ingredients': '10% Niacinamide, 1% Zinc' }
      },

      // 9. Grocery & Essentials
      {
        title: 'Blue Tokai Coffee Roasters Vienna Roast Dark Roast Ground Coffee (250g)',
        slug: 'blue-tokai-coffee-vienna-roast-dark-roast-250g',
        description: '100% Specialty Arabica beans with tasting notes of cocoa, oaky notes, and a chocolatey aftertaste. Sourced directly from premier Indian estates.',
        price: 490,
        discountPercent: 10,
        discountedPrice: 441,
        brand: 'Blue Tokai',
        category: catMap.get('grocery-essentials'),
        categoryName: 'Grocery & Essentials',
        sku: 'BT-VIENNA-250G',
        stock: 95,
        images: [
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.9,
        ratingsCount: 198,
        features: ['100% Specialty Grade Arabica', 'Freshly roasted in small batches', 'Ideal for French Press, South Indian Filter, or Espresso'],
        variants: [{ name: 'Grind', options: ['French Press', 'Aeropress', 'Whole Beans', 'Moka Pot'] }],
        tags: ['coffee', 'grocery', 'arabica', 'artisan', 'beverages'],
        isFeatured: false,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Weight': '250g', 'Roast Level': 'Dark', 'Flavour Notes': 'Cocoa, Oaky' }
      },

      // 10. Books & Stationery
      {
        title: 'Atomic Habits by James Clear (Hardcover Collector\'s Edition)',
        slug: 'atomic-habits-james-clear-hardcover',
        description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 15 million copies sold worldwide. Transform your life with tiny changes.',
        price: 899,
        discountPercent: 33,
        discountedPrice: 602,
        brand: 'Penguin Random House',
        category: catMap.get('books-stationery'),
        categoryName: 'Books & Stationery',
        sku: 'BK-ATOM-HAB-HC',
        stock: 75,
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.9,
        ratingsCount: 890,
        features: ['Hardcover Collector\'s Edition', 'High quality paper and ribbon bookmark', 'Includes habit tracking diagrams and cheatsheets'],
        variants: [{ name: 'Format', options: ['Hardcover', 'Paperback'] }],
        tags: ['books', 'self-help', 'habits', 'bestseller', 'productivity'],
        isFeatured: true,
        isTrending: true,
        isBestseller: true,
        specifications: { 'Pages': '320', 'Language': 'English', 'Publisher': 'Penguin Business' }
      },

      // 11. Toys & Games
      {
        title: 'LEGO Technic McLaren Senna GTR Racing Supercar Building Kit',
        slug: 'lego-technic-mclaren-senna-gtr-building-kit',
        description: 'Packed with authentic features inspired by the original track-focused supercar icon. Features realistic V8 engine with moving pistons and opening dihedral doors.',
        price: 4999,
        discountPercent: 15,
        discountedPrice: 4249,
        brand: 'LEGO',
        category: catMap.get('toys-games'),
        categoryName: 'Toys & Games',
        sku: 'LEGO-MCL-42123',
        stock: 28,
        images: [
          'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 132,
        features: ['830 piece construction model', 'Authentic V8 engine with moving pistons', 'Iconic dihedral doors that open up and out'],
        variants: [],
        tags: ['toys', 'lego', 'technic', 'cars', 'supercar', 'collectibles'],
        isFeatured: false,
        isTrending: true,
        isBestseller: false,
        specifications: { 'Age': '10+', 'Pieces': '830', 'Dimensions': '32cm Length' }
      },

      // 12. Sports & Fitness
      {
        title: 'Boldfit Heavy Resistance Loop Exercise Bands Set of 5',
        slug: 'boldfit-heavy-resistance-bands-set-5',
        description: 'Premium natural latex workout bands for resistance training, pull-up assistance, physiotherapy, and yoga stretching.',
        price: 1999,
        discountPercent: 50,
        discountedPrice: 999,
        brand: 'Boldfit',
        category: catMap.get('sports-fitness'),
        categoryName: 'Sports & Fitness',
        sku: 'BLD-RES-BND-5PK',
        stock: 85,
        images: [
          'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.6,
        ratingsCount: 310,
        features: ['100% Eco-friendly natural latex', '5 progressive resistance levels (10 lbs to 50 lbs)', 'Includes carry pouch and workout booklet'],
        variants: [],
        tags: ['fitness', 'gym', 'workout', 'resistance-bands', 'sports'],
        isFeatured: false,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Levels': 'X-Light to X-Heavy', 'Material': 'Natural Latex', 'Use': 'Home & Gym' }
      },

      // 13. Automotive
      {
        title: '70mai Smart Dash Cam Pro Plus+ A500S with Built-in GPS',
        slug: '70mai-smart-dash-cam-pro-plus-a500s-gps',
        description: '1944P Ultra HD resolution, Sony IMX335 sensor, superior night vision with 3D DNR & WDR, 24-hour parking surveillance, and Advanced Driver Assistance Systems (ADAS).',
        price: 12999,
        discountPercent: 23,
        discountedPrice: 10009,
        brand: '70mai',
        category: catMap.get('automotive'),
        categoryName: 'Automotive',
        sku: '70MAI-A500S-GPS',
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 164,
        features: ['1944P Full HD recording', 'Built-in GPS & route tracking', 'Advanced Driver Assistance (Lane Departure & Forward Collision warnings)', 'G-Sensor emergency recording'],
        variants: [{ name: 'Camera Kit', options: ['Front Only', 'Front + Rear Cam'] }],
        tags: ['automotive', 'dashcam', 'car-accessories', 'gadgets'],
        isFeatured: false,
        isTrending: true,
        isBestseller: false,
        specifications: { 'Resolution': '2.7K 1944P', 'Sensor': 'Sony IMX335', 'Storage': 'Up to 128GB MicroSD' }
      },

      // 14. Watches & Jewellery
      {
        title: 'Fossil Men\'s Grant Stainless Steel Chronograph Watch',
        slug: 'fossil-mens-grant-chronograph-watch-fs4835',
        description: 'A classic silhouette with modern proportions. Featuring Roman numerals set against a rich navy blue dial and rose-gold plated case with genuine leather strap.',
        price: 13495,
        discountPercent: 30,
        discountedPrice: 9446,
        brand: 'Fossil',
        category: catMap.get('watches-jewellery'),
        categoryName: 'Watches & Jewellery',
        sku: 'FSL-FS4835-BLU',
        stock: 30,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.7,
        ratingsCount: 225,
        features: ['Quartz chronograph movement with 3 sub-dials', '50m water resistance (swim proof)', 'Interchangeable 22mm genuine leather strap'],
        variants: [{ name: 'Strap Color', options: ['Brown Leather', 'Blue Leather', 'Silver Steel'] }],
        tags: ['watch', 'fossil', 'chronograph', 'accessories', 'luxury'],
        isFeatured: true,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Case Size': '44mm', 'Movement': 'Quartz Chronograph', 'Water Resistance': '5 ATM' }
      },

      // 15. Health & Wellness
      {
        title: 'Omron HEM 7120 Fully Automatic Digital Blood Pressure Monitor',
        slug: 'omron-hem-7120-automatic-blood-pressure-monitor',
        description: 'Clinically validated accuracy with IntelliSense Technology for comfortable, controlled inflation without the need of pressure pre-setting.',
        price: 2640,
        discountPercent: 24,
        discountedPrice: 2006,
        brand: 'Omron',
        category: catMap.get('health-wellness'),
        categoryName: 'Health & Wellness',
        sku: 'OMR-HEM7120-WHT',
        stock: 60,
        images: [
          'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=80'
        ],
        ratingsAvg: 4.8,
        ratingsCount: 450,
        features: ['IntelliSense technology for personalized inflation', 'Hypertension indicator and irregular heartbeat detection', 'One-touch easy operation with 3-year warranty'],
        variants: [],
        tags: ['health', 'medical', 'bp-monitor', 'wellness', 'omron'],
        isFeatured: false,
        isTrending: false,
        isBestseller: true,
        specifications: { 'Measurement': 'Oscillometric', 'Display': 'Digital LCD', 'Warranty': '3 Years' }
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`[Seed] ${createdProducts.length} Products seeded across all 15 categories.`);

    // 4. Coupons
    const couponsData = [
      {
        code: 'AURA10',
        discountPercent: 10,
        maxDiscountAmount: 500,
        minOrderAmount: 999,
        validUntil: new Date('2028-12-31'),
        isActive: true,
        usageLimit: 1000
      },
      {
        code: 'WELCOME50',
        discountPercent: 50,
        maxDiscountAmount: 200,
        minOrderAmount: 499,
        validUntil: new Date('2028-12-31'),
        isActive: true,
        usageLimit: 1000
      },
      {
        code: 'FESTIVE25',
        discountPercent: 25,
        maxDiscountAmount: 1500,
        minOrderAmount: 2499,
        validUntil: new Date('2028-12-31'),
        isActive: true,
        usageLimit: 1000
      }
    ];

    await Coupon.insertMany(couponsData);
    console.log('[Seed] Sample coupons (AURA10, WELCOME50, FESTIVE25) seeded.');

    // 5. Sample Reviews for Sony Headphones and iPhone
    const sonyProduct = createdProducts.find(p => p.sku === 'SONY-WHXM5-BLK');
    if (sonyProduct) {
      await Review.create([
        {
          product: sonyProduct._id,
          user: demoCustomer._id,
          userName: demoCustomer.name,
          rating: 5,
          title: 'Unbelievable noise cancelling and all-day comfort!',
          comment: 'Upgraded from the XM3 and the difference in microphone call quality and ANC is night and day. Battery lasts for days on a single charge. Worth every rupee on AuraMart!',
          verifiedPurchase: true
        }
      ]);
    }

    console.log('[Seed] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();

