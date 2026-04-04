/**
 * Database Configuration
 * Handles MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');

function isPlaceholderMongoUri(uri) {
  if (!uri || typeof uri !== 'string' || !uri.trim()) return true;
  const markers = ['<username>', '<password>', '<cluster>', '<dbname>'];
  return markers.some((m) => uri.includes(m));
}

const isProductionLike =
  process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    if (isPlaceholderMongoUri(uri)) {
      if (isProductionLike) {
        console.error(
          '❌ MONGO_URI is missing or still a placeholder (e.g. <username> in .env.example). ' +
            'In Render → Environment, set MONGO_URI to your real MongoDB Atlas connection string, then redeploy.'
        );
        process.exit(1);
      }

      console.warn(
        '⚠️  No real MONGO_URI — using in-memory MongoDB for local dev (data is lost on exit).'
      );
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          console.error(
            '❌ Install dev helper: npm install mongodb-memory-server --save-dev\n' +
              '   Or set MONGO_URI in backend/.env to your Atlas URI.'
          );
          process.exit(1);
        }
        throw err;
      }
    }

    const conn = await mongoose.connect(uri, {
      // These options are supported in newer Mongoose versions
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
