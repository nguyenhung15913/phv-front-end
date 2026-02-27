/**
 * Pho Huong Viet — Frontend Server
 */

require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

const API_URL = process.env.RESTAURANT_API_URL || 'http://localhost:3001';

// Root → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// order.html → inject API URL
app.get('/order.html', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'order.html'), 'utf8');
  html = html.replace('__RESTAURANT_API_URL__', `${API_URL}/api`);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Everything else (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍜 Frontend running on http://localhost:${PORT}`);
  console.log(`   API URL: ${API_URL}`);
});
