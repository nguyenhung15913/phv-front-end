/**
 * Pho Huong Viet — Frontend Server
 * Serves the static website (index.html + order.html)
 * Injects RESTAURANT_API_URL into order.html at runtime
 */

require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Set in Railway environment variables
const API_URL = process.env.RESTAURANT_API_URL || 'http://localhost:3001';

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve order.html with API URL injected
app.get('/order.html', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'order.html'), 'utf8');
  html = html.replace('__RESTAURANT_API_URL__', `${API_URL}/api`);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Root serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍜 Pho Huong Viet frontend running on http://localhost:${PORT}`);
  console.log(`   API URL: ${API_URL}`);
});
