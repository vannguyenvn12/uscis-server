require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const verifyApiKey = require('./middlewares/verifyApiKey');

const app = express();
const server = http.createServer(app);
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// WebSocket Server chỉ nhận /ws
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws' || request.url === '/ws/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

let clients = [];
let receivedData = '';
let responseData = '';

wss.on('connection', (ws) => {
  console.log('Client connected');

  clients.push(ws);

  // Gửi dữ liệu hiện tại nếu có
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

// API nhận dữ liệu từ Apps Script
app.post('/send-data', verifyApiKey, async (req, res) => {
  try {
    const { receiptNumber } = req.body;
    if (!receiptNumber)
      return res.status(400).send('No receipt number provided');

    receivedData = String(receiptNumber);
    clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.send(receivedData);
    });

    // Chờ phản hồi 1s
    await new Promise((r) => setTimeout(r, 1000));
    res.status(200).send(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 8082;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
