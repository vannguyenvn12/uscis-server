const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Sau khi kết nối, server sẽ gửi dữ liệu cho extension
  setInterval(() => {
    const message = 'IOE9348850264'; // Ví dụ về số biên nhận hoặc dữ liệu bạn muốn gửi
    console.log('Sending message to client:', message);

    // Gửi dữ liệu đến extension qua WebSocket
    ws.send(message);
  }, 5000); // Gửi thông báo mỗi 5 giây (hoặc bạn có thể sử dụng trigger thực tế khác)
});

console.log('WebSocket server running on ws://localhost:8081');
