require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const verifyApiKey = require('./middlewares/verifyApiKey');

const app = express();
const server = http.createServer(app);

app.use(express.json()); // Đảm bảo rằng bạn có middleware để xử lý JSON
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Tạo WebSocket server
const wss = new WebSocket.Server({ port: process.env.WS_PORT }); // Đổi cổng WebSocket nếu cần

// Biến lưu dữ liệu nhận được từ Apps Script
let receivedData = '';
let responseData = '';

// Lưu tất cả các kết nối WebSocket hiện tại
let clients = [];

// Khi có kết nối WebSocket
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Thêm client vào danh sách kết nối
  clients.push(ws);

  // Gửi dữ liệu khi có client kết nối (nếu có dữ liệu mới)
  if (receivedData) {
    ws.send(receivedData);
  }

  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 5 * 60 * 1000); // 5 phút

  // Lắng nghe dữ liệu từ client WebSocket
  ws.on('message', (message) => {
    responseData = message.toString();
  });

  // Xử lý khi client đóng kết nối
  ws.on('close', () => {
    console.log('Client disconnected');
    clients = clients.filter((client) => client !== ws);
    clearInterval(pingInterval); // Dọn dẹp interval
  });
});

// API để nhận dữ liệu từ Apps Script
app.post('/send-data', verifyApiKey, async (req, res) => {
  try {
    const { receiptNumber } = req.body;

    if (!receiptNumber) {
      return res.status(400).send('Bad Request: No receipt number provided');
    }

    console.log('Received data from Apps Script:', receiptNumber);

    // Lưu dữ liệu vào biến để gửi qua WebSocket
    receivedData = receiptNumber;

    // Gửi dữ liệu cho tất cả các client đã kết nối
    clients.forEach((client) => {
      client.send(receivedData);
    });

    // Chờ phản hồi từ WebSocket
    // viết hàm delay
    await delay(1000);

    // Gửi phản hồi thành công
    res.status(200).send(responseData);
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).send('Server Error: Unable to process the data');
  }
});

// Tạo HTTP server với Express
app.listen(process.env.PORT || 8081, '0.0.0.0', () => {
  console.log(`Express server running on http://localhost:${process.env.PORT}`);
});

// Kết nối WebSocket vào server HTTP của Express
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
