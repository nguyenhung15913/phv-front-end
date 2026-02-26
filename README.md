# 🍜 Pho Huong Viet — Restaurant Order API

A Node.js + Express API that receives pickup orders from the website and forwards them to any external app via webhook (HTTP POST).

---

## Project Structure

```
restaurant-api/
├── server.js          ← Express API server (main entry point)
├── package.json
├── .env.example       ← Copy to .env and fill in your values
└── public/
    └── order.html     ← Separate order page (served by the API)
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Open `.env` and set:
```
PORT=3001
WEBHOOK_URL=https://your-app.com/webhook/orders
WEBHOOK_SECRET=your_secret_token   # optional
ALLOWED_ORIGIN=https://phohuongviet17.com
```

### 3. Start the server
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

The API will be available at `http://localhost:3001`

---

## API Endpoints

### `GET /api/health`
Health check.

**Response:**
```json
{ "status": "ok", "restaurant": "Pho Huong Viet", "timestamp": "..." }
```

---

### `GET /api/menu`
Returns full menu grouped by category.

**Response:**
```json
{
  "success": true,
  "menu": {
    "Noodle Soup": [ { "id": 1, "name": "Pho Dac Biet", "price": 17, ... } ],
    "Rice Plate":  [ ... ],
    ...
  },
  "items": [ ... ]
}
```

---

### `POST /api/orders`
Places a new pickup order. Validates the payload, computes totals with 5% GST, then forwards the complete order to your `WEBHOOK_URL`.

**Request Body:**
```json
{
  "customer": {
    "name":  "John Nguyen",
    "phone": "403-555-0199",
    "email": "john@email.com"
  },
  "items": [
    { "id": 1, "qty": 2 },
    { "id": 12, "qty": 1 }
  ],
  "notes": "No onions please"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Order placed successfully!",
  "order_id": "PHV-1708800000000",
  "order": {
    "order_id": "PHV-1708800000000",
    "placed_at": "2026-02-24T14:32:00.000Z",
    "restaurant": {
      "name": "Pho Huong Viet",
      "address": "#3855 17 Ave SW, Calgary, AB T3C 1J7",
      "phone": "(403) 686-3799"
    },
    "customer": { "name": "John Nguyen", "phone": "403-555-0199", "email": "john@email.com" },
    "items": [
      { "id": 1, "name": "Pho Dac Biet (Special Pho)", "category": "Noodle Soup", "qty": 2, "unit_price": 17, "subtotal": 34 },
      { "id": 12, "name": "Sate Chicken Sub (Banh Mi)", "category": "Sandwich",    "qty": 1, "unit_price": 10, "subtotal": 10 }
    ],
    "pricing": { "subtotal": 44, "tax": 2.20, "total": 46.20 },
    "notes": "No onions please",
    "type": "pickup"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "errors": ["customer.name is required", "items[0].qty must be a positive integer"]
}
```

---

## Webhook Format

When an order is placed, the API sends a `POST` request to your `WEBHOOK_URL` with the full order JSON (same as the `order` field above) and these headers:

```
Content-Type: application/json
X-Webhook-Secret: your_secret_token   (if WEBHOOK_SECRET is set)
```

### Integrations that work out of the box:
| App | How |
|-----|-----|
| **Make.com** (Integromat) | Create a "Custom Webhook" trigger, paste URL into `WEBHOOK_URL` |
| **Zapier** | Create a "Webhooks by Zapier" trigger, paste URL into `WEBHOOK_URL` |
| **n8n** | Create a Webhook node, paste URL |
| **Slack** | Use an Incoming Webhook URL from Slack |
| **Your own backend** | Any URL that accepts POST JSON |

---

## Order Page

The order page (`public/order.html`) is served automatically at:
```
http://localhost:3001/order.html
```

To connect your main website's "Order Pick-Up" button to this page, update the button link in `pho-huong-viet.html`:
```html
<a href="http://localhost:3001/order.html">Order Pick-Up Online</a>
```

Or if deployed, replace with your production URL:
```html
<a href="https://api.yoursite.com/order.html">Order Pick-Up Online</a>
```

---

## Deployment

The API can be deployed to any Node.js host:

- **Railway** — `railway up`
- **Render** — connect GitHub repo, set env vars in dashboard
- **Fly.io** — `fly launch`
- **VPS (Ubuntu)** — run with `pm2 start server.js`

Set all environment variables (`WEBHOOK_URL`, `PORT`, etc.) in your hosting platform's dashboard.
