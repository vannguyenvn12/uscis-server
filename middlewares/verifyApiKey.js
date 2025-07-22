const ApiClient = require('../models/apiClient.model');

const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['v-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      message: 'Bạn thiếu API Key, vui lòng nạp tiền qua Văn Nguyễn',
    });
  }

  const client = await ApiClient.findOne({ apiKey, isActive: true });

  if (!client) {
    return res
      .status(403)
      .json({ message: 'API Key không hợp lệ, hoặc đã bị block' });
  }

  // Cập nhật usage
  //   client.usageCount += 1;
  //   await client.save();

  req.apiClient = client; // Gắn client nếu cần dùng sau
  next();
};

module.exports = verifyApiKey;
