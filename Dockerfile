# Dùng image Node nhẹ
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy package*
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Mở cổng ứng dụng (nếu dùng .env thì PORT được docker-compose set)
EXPOSE 3000

# Lệnh khởi chạy server
CMD ["node", "src/server.js"]
