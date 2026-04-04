const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\x1b[32m%s\x1b[0m', '✅ MongoDB Connection Successful!');
    
    // Create database by inserting a temporary document
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await TestModel.create({ name: 'Connection Test' });
    console.log('\x1b[32m%s\x1b[0m', '✅ Database "ngo_db" created successfully and test document inserted!');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB Connection Failed!');
    console.error(error.message);
    process.exit(1);
  }
};

testConnection();
