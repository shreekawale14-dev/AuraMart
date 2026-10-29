import { Product, IProduct } from '../models/Product.js';
import { Order, IOrder } from '../models/Order.js';
import { ENV } from '../config/env.js';
import { Types } from 'mongoose';

export interface ChatResponse {
  reply: string;
  products?: Array<{
    _id: string;
    title: string;
    price: number;
    discountedPrice: number;
    discountPercent: number;
    rating: number;
    image: string;
    category: string;
    stock: number;
  }>;
  suggestedQueries?: string[];
  isFallback: boolean;
}

export const processAuraChat = async (
  userMessage: string,
  userId?: string
): Promise<ChatResponse> => {
  const normalizedMsg = userMessage.toLowerCase().trim();

  // 1. Check if user is asking about an order
  if (
    normalizedMsg.includes('my order') ||
    normalizedMsg.includes('track order') ||
    normalizedMsg.includes('order status') ||
    normalizedMsg.includes('where is my order') ||
    normalizedMsg.includes('latest order')
  ) {
    if (!userId) {
      return {
        reply: "To check your order status, please log in to your AuraMart account. I'll then look up your real-time tracking details immediately!",
        suggestedQueries: ["Login to account", "Show trending electronics", "Return policy"],
        isFallback: false
      };
    }

    // Look up the user's latest orders (STRICTLY authenticated user)
    const latestOrders = await Order.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(3);

    if (!latestOrders || latestOrders.length === 0) {
      return {
        reply: "You don't have any orders placed yet on AuraMart. Once you make your first purchase, you can track it here or on your My Orders page!",
        suggestedQueries: ["Show bestsellers", "Browse electronics", "Special offers"],
        isFallback: false
      };
    }

    const latest = latestOrders[0];
    const itemsSummary = latest.items.map(i => `${i.title} (x${i.quantity})`).join(', ');
    const deliveryNote = latest.estimatedDeliveryDate 
      ? `Estimated delivery by ${new Date(latest.estimatedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}.`
      : '';

    return {
      reply: `Here is the status of your latest order (#${latest.orderNumber}):\n\n• **Status:** ${latest.orderStatus}\n• **Items:** ${itemsSummary}\n• **Total:** ₹${latest.pricing.grandTotal.toLocaleString('en-IN')}\n• **Payment:** ${latest.paymentMethod.toUpperCase()} (${latest.paymentStatus})\n${deliveryNote}\n\nYou can view full tracking timelines and download invoices on your **My Orders** page.`,
      suggestedQueries: ["View all my orders", "Return policy", "Recommend gadgets"],
      isFallback: false
    };
  }

  // 2. Check if user is asking about return/refund/delivery policies
  if (
    normalizedMsg.includes('return') ||
    normalizedMsg.includes('refund') ||
    normalizedMsg.includes('replacement') ||
    normalizedMsg.includes('cancel')
  ) {
    return {
      reply: "### AuraMart Return & Cancellation Policy\n\n• **Easy Returns:** Most products can be returned within **7 days** of delivery if unused and in original packaging.\n• **Cancellation:** You can cancel orders anytime before they are shipped directly from your **My Orders** page.\n• **Refunds:** For online payments via Razorpay, refunds are processed within 3-5 business days to your original payment method. For Cash on Delivery, refunds are issued via store credit or direct bank transfer.",
      suggestedQueries: ["Where is my latest order?", "Do you have free delivery?", "Show laptops"],
      isFallback: false
    };
  }

  if (normalizedMsg.includes('delivery') || normalizedMsg.includes('shipping') || normalizedMsg.includes('charges')) {
    return {
      reply: "### AuraMart Shipping & Delivery\n\n• **Free Delivery:** Standard delivery is completely FREE on all orders of ₹499 and above!\n• **Standard Fee:** ₹40 flat shipping fee on orders below ₹499.\n• **Delivery Timeline:** Usually 2 to 5 business days across all supported Indian PIN codes.\n• **Cash on Delivery:** Available across all eligible locations.",
      suggestedQueries: ["Show deals under ₹500", "Top smartphones", "Browse categories"],
      isFallback: false
    };
  }

  // 3. Extract budget if specified (e.g. "under 60000", "below 1000", "under ₹50,000")
  let maxBudget: number | undefined;
  const budgetMatch = normalizedMsg.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
  }

  // 4. Search relevant products from the real database catalog
  const queryConditions: any = { stock: { $gt: 0 } };

  if (maxBudget) {
    queryConditions.discountedPrice = { $lte: maxBudget };
  }

  // Detect category keywords
  const categoriesMap: Record<string, string> = {
    laptop: 'Computers & Laptops',
    computer: 'Computers & Laptops',
    macbook: 'Computers & Laptops',
    phone: 'Mobiles & Accessories',
    mobile: 'Mobiles & Accessories',
    smartphone: 'Mobiles & Accessories',
    headphone: 'Electronics',
    earphone: 'Electronics',
    earbuds: 'Electronics',
    audio: 'Electronics',
    watch: 'Watches & Jewellery',
    jewellery: 'Watches & Jewellery',
    fashion: 'Fashion',
    shirt: 'Fashion',
    dress: 'Fashion',
    shoe: 'Footwear',
    sneaker: 'Footwear',
    boot: 'Footwear',
    book: 'Books & Stationery',
    novel: 'Books & Stationery',
    beauty: 'Beauty & Personal Care',
    skincare: 'Beauty & Personal Care',
    perfume: 'Beauty & Personal Care',
    toy: 'Toys & Games',
    fitness: 'Sports & Fitness',
    gym: 'Sports & Fitness',
    kitchen: 'Home & Kitchen',
    furniture: 'Furniture & Decor'
  };

  let matchedCategory: string | undefined;
  for (const [kw, cat] of Object.entries(categoriesMap)) {
    if (normalizedMsg.includes(kw)) {
      matchedCategory = cat;
      break;
    }
  }

  if (matchedCategory) {
    queryConditions.categoryName = new RegExp(matchedCategory, 'i');
  } else {
    // If no category detected, try generic text search or regex on title/brand
    const words = normalizedMsg.split(/\s+/).filter(w => w.length > 2 && !['show', 'find', 'give', 'best', 'good', 'some', 'what', 'need', 'want', 'under', 'below'].includes(w));
    if (words.length > 0) {
      queryConditions.$or = [
        { title: { $regex: words.join('|'), $options: 'i' } },
        { brand: { $regex: words.join('|'), $options: 'i' } },
        { categoryName: { $regex: words.join('|'), $options: 'i' } }
      ];
    }
  }

  const matchingProducts = await Product.find(queryConditions)
    .sort({ ratingsAvg: -1, discountedPrice: 1 })
    .limit(4);

  const formattedProducts = matchingProducts.map(p => ({
    _id: p._id.toString(),
    title: p.title,
    price: p.price,
    discountedPrice: p.discountedPrice,
    discountPercent: p.discountPercent,
    rating: p.ratingsAvg,
    image: p.images[0] || '',
    category: p.categoryName,
    stock: p.stock
  }));

  // 5. If GEMINI_API_KEY is present, synthesize with LLM
  if (ENV.GEMINI_API_KEY && !ENV.GEMINI_API_KEY.includes('dummy') && !ENV.GEMINI_API_KEY.includes('your_')) {
    try {
      const catalogSummary = matchingProducts.map(p => 
        `- ${p.title} by ${p.brand} (₹${p.discountedPrice}, original ₹${p.price}, rating ${p.ratingsAvg}/5): ${p.description.substring(0, 100)}`
      ).join('\n');

      const systemPrompt = `You are AURA AI, the smart, helpful, and friendly shopping assistant for AuraMart e-commerce.
Tagline: "Everything You Love, All in One Place."
Instructions:
- Answer the user concisely and professionally.
- Ground your product suggestions ONLY on the available AuraMart catalog products provided below.
- Do NOT hallucinate products that are not in the list.
- If no matching products exist, politely inform the user and suggest exploring categories.
- Never reveal private customer information, passwords, or order data of other users.
- Prices are in Indian Rupees (₹).

Available matching products in AuraMart:
${catalogSummary || 'No specific catalog items matched the query criteria.'}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nCustomer question: ${userMessage}` }
                ]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            reply: generatedText,
            products: formattedProducts,
            suggestedQueries: ["Show top rated items", "Compare with bestsellers", "Check delivery time"],
            isFallback: false
          };
        }
      }
    } catch (err) {
      console.warn('[AURA AI] Gemini API call failed, switching to rule-based fallback:', err);
    }
  }

  // 6. Honest, intelligent catalog-grounded fallback
  if (formattedProducts.length > 0) {
    const budgetText = maxBudget ? ` within your budget of ₹${maxBudget.toLocaleString('en-IN')}` : '';
    const catText = matchedCategory ? ` in **${matchedCategory}**` : '';

    return {
      reply: `Here are the top-rated recommendations${catText}${budgetText} from the AuraMart catalog. Click on any product below to view specifications and add it to your cart:`,
      products: formattedProducts,
      suggestedQueries: [
        "Filter under ₹10,000",
        "Show bestselling electronics",
        "What is your return policy?"
      ],
      isFallback: !ENV.GEMINI_API_KEY
    };
  }

  // If no products matched:
  return {
    reply: "I couldn't find an exact match for that query in our catalog right now. Try searching for specific items like **wireless headphones**, **laptops under ₹60,000**, or **smartphones**, or explore our featured categories!",
    suggestedQueries: [
      "Find laptops under ₹60,000",
      "Show wireless headphones",
      "Deals of the day",
      "Where is my order?"
    ],
    isFallback: !ENV.GEMINI_API_KEY
  };
};
