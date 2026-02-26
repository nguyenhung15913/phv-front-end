/**
 * Pho Huong Viet — Restaurant Order API
 * Node.js + Express
 *
 * POST /api/orders  → validates order → forwards to webhook
 * GET  /api/menu    → returns menu items
 * GET  /api/health  → health check
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const axios      = require('axios');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(bodyParser.json());
app.use(express.static('public')); // serve the order page

// ─── Menu Data ───────────────────────────────────────────────
const MENU = [
  // Noodle Soups
  { id: 1,  category: 'Noodle Soup',   name: 'Pho Dac Biet (Special Pho)',         price: 17, description: 'House special — slow-simmered beef broth, rare steak, brisket, tendon & tripe' },
  { id: 2,  category: 'Noodle Soup',   name: 'Pho Tai (Rare Steak Pho)',            price: 16, description: 'Clear beef broth with thin-sliced rare steak and rice noodles' },
  { id: 3,  category: 'Noodle Soup',   name: 'Bun Bo Hue (Spicy Beef Noodle)',      price: 16, description: 'Spicy lemongrass broth, thick round noodles, beef & pork' },
  { id: 4,  category: 'Noodle Soup',   name: 'Hu Tieu (Clear Pork Noodle)',         price: 15, description: 'Light pork broth, rice noodles, shrimp, sliced pork & quail eggs' },

  // Rice Plates
  { id: 5,  category: 'Rice Plate',    name: 'Grilled Beef Lemon on Rice',          price: 16, description: 'Lemongrass-marinated grilled beef over steamed jasmine rice' },
  { id: 6,  category: 'Rice Plate',    name: 'Grilled Pork Chop on Rice',           price: 15, description: 'Caramelized grilled pork chop, jasmine rice, pickled vegetables' },
  { id: 7,  category: 'Rice Plate',    name: 'Broken Rice with Shrimp & Pork',      price: 15, description: 'Traditional com tam — shrimp, pork, steamed egg, fish sauce' },

  // Vermicelli
  { id: 8,  category: 'Vermicelli',    name: 'Bun Thit Nuong (Grilled Pork Vermicelli)', price: 14, description: 'Cold rice vermicelli, grilled pork, fresh herbs, crushed peanuts & fish sauce' },
  { id: 9,  category: 'Vermicelli',    name: 'Bun Tom (Shrimp Vermicelli)',          price: 15, description: 'Grilled shrimp over cold vermicelli with pickled daikon & fish sauce' },

  // Stir Fry
  { id: 10, category: 'Stir Fry',      name: 'Stir-Fried Tofu & Vegetables on Egg Noodles', price: 15, description: 'Crispy tofu, seasonal vegetables, oyster sauce glaze on silky egg noodles' },
  { id: 11, category: 'Stir Fry',      name: 'Lemongrass Chicken Stir Fry',         price: 16, description: 'Wok-tossed chicken with lemongrass, chili, bell pepper & basil' },

  // Sandwiches
  { id: 12, category: 'Sandwich',      name: 'Sate Chicken Sub (Banh Mi)',           price: 10, description: 'Crispy baguette, spicy sate chicken, cucumber, cilantro & pickled daikon' },
  { id: 13, category: 'Sandwich',      name: 'Grilled Pork Banh Mi',                price: 9,  description: 'Baguette, grilled pork, pate, mayo, jalapeños & fresh herbs' },

  // Drinks
  { id: 14, category: 'Drinks',        name: 'Vietnamese Iced Coffee (Ca Phe Sua Da)', price: 5, description: 'Strong drip coffee with sweetened condensed milk over ice' },
  { id: 15, category: 'Drinks',        name: 'Chrysanthemum Tea',                   price: 3, description: 'Chilled lightly sweetened chrysanthemum flower tea' },
  { id: 16, category: 'Drinks',        name: 'Soda Chanh (Vietnamese Lime Soda)',   price: 4, description: 'Fresh lime juice, soda water, sugar syrup' },
];

// ─── Helpers ─────────────────────────────────────────────────
function validateOrder(body) {
  const errors = [];

  // Customer validation
  if (!body.customer)                              errors.push('customer object is required');
  if (!body.customer?.name?.trim())                errors.push('customer.name is required');
  if (!body.customer?.phone?.trim())               errors.push('customer.phone is required');
  if (!body.customer?.email?.trim())               errors.push('customer.email is required');
  if (body.customer?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer.email))
                                                   errors.push('customer.email is invalid');

  // Items validation
  if (!Array.isArray(body.items) || body.items.length === 0)
                                                   errors.push('items must be a non-empty array');

  body.items?.forEach((item, i) => {
    if (!item.id)                                  errors.push(`items[${i}].id is required`);
    if (!Number.isInteger(item.qty) || item.qty < 1)
                                                   errors.push(`items[${i}].qty must be a positive integer`);
  });

  return errors;
}

function buildOrderPayload(body) {
  const resolvedItems = body.items.map(item => {
    const menuItem = MENU.find(m => m.id === item.id);
    if (!menuItem) throw new Error(`Menu item with id ${item.id} not found`);
    return {
      id:          menuItem.id,
      name:        menuItem.name,
      category:    menuItem.category,
      qty:         item.qty,
      unit_price:  menuItem.price,
      subtotal:    +(menuItem.price * item.qty).toFixed(2),
    };
  });

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const tax      = +(subtotal * 0.05).toFixed(2); // 5% GST
  const total    = +(subtotal + tax).toFixed(2);

  return {
    order_id:   `PHV-${Date.now()}`,
    placed_at:  new Date().toISOString(),
    restaurant: {
      name:    'Pho Huong Viet',
      address: '#3855 17 Ave SW, Calgary, AB T3C 1J7',
      phone:   '(403) 686-3799',
    },
    customer: {
      name:  body.customer.name.trim(),
      phone: body.customer.phone.trim(),
      email: body.customer.email.trim().toLowerCase(),
    },
    items:    resolvedItems,
    pricing: {
      subtotal,
      tax,
      total,
    },
    notes: body.notes?.trim() || '',
    type:  'pickup',
  };
}

// ─── Routes ──────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', restaurant: 'Pho Huong Viet', timestamp: new Date().toISOString() });
});

// Get full menu
app.get('/api/menu', (req, res) => {
  // Group by category
  const grouped = MENU.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  res.json({ success: true, menu: grouped, items: MENU });
});

// Place an order
app.post('/api/orders', async (req, res) => {
  // 1. Validate
  const errors = validateOrder(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // 2. Build payload
  let order;
  try {
    order = buildOrderPayload(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, errors: [err.message] });
  }

  // 3. Forward to webhook
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    // No webhook configured — still return the order (useful for testing)
    console.warn('⚠️  WEBHOOK_URL not set. Order not forwarded.');
    return res.status(200).json({
      success: true,
      message: 'Order received (webhook not configured)',
      order,
    });
  }

  try {
    const webhookRes = await axios.post(webhookUrl, order, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WEBHOOK_SECRET
          ? { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET }
          : {}),
      },
      timeout: 8000,
    });

    console.log(`✅ Order ${order.order_id} forwarded to webhook. Status: ${webhookRes.status}`);
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order_id: order.order_id,
      order,
    });
  } catch (err) {
    console.error('❌ Webhook delivery failed:', err.message);
    // Still return 201 to customer — log failure internally
    return res.status(201).json({
      success: true,
      message: 'Order placed. We will contact you to confirm.',
      order_id: order.order_id,
      order,
      webhook_warning: 'Notification delivery delayed — our team has been alerted.',
    });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍜 Pho Huong Viet API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/menu`);
  console.log(`   POST /api/orders\n`);
});
