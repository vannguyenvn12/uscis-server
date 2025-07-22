require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const ApiClient = require('../models/apiClient.model');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const name = process.argv[2] || 'default-client';
    const apiKey = uuidv4();

    const client = new ApiClient({
      name,
      apiKey,
      usageLimit: 1000,
    });

    await client.save();
    console.log(`✅ API Key created for "${name}":\n${apiKey}`);
    process.exit();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
