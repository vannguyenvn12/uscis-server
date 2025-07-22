const mongoose = require('mongoose');

const apiClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  //   usageLimit: { type: Number, default: 1000 },
  //   usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('ApiClient', apiClientSchema);
