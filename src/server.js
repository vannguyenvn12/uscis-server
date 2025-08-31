require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const verifyApiKey = require('./middlewares/verifyApiKey');

const app = express();
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// HTTPS options
const server = https.createServer(
  {
    cert: fs.readFileSync(
      '/etc/letsencrypt/live/vannguyenv12.com/fullchain.pem'
    ), // hoặc cert.pem nếu self-signed
    key: fs.readFileSync('/etc/letsencrypt/live/vannguyenv12.com/privkey.pem'), // hoặc key.pem
  },
  app
);

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});

let clients = [];
let receivedData = '';
let responseData = '';

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.push(ws);

  if (receivedData) ws.send(String(receivedData));

  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }, 5 * 60 * 1000);

  ws.on('message', (message) => {
    responseData = message.toString();
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients = clients.filter((c) => c !== ws);
    clearInterval(pingInterval);
  });
});

// API từ Apps Script
app.post('/send-data', verifyApiKey, async (req, res) => {
  try {
    const { receiptNumber } = req.body;
    if (!receiptNumber) return res.status(400).send('No receipt number');

    receivedData = String(receiptNumber);
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.send(receivedData);
    });

    await new Promise((r) => setTimeout(r, 1000));
    res.status(200).send(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start HTTPS + WSS server
const PORT = process.env.PORT || 8443;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS + WSS server listening on port ${PORT}`);
});
