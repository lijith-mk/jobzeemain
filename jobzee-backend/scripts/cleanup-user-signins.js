/*
  Script: cleanup-user-signins.js
  Purpose: Remove duplicate documents from the usersignin collection, keeping the most recent
           per userId, and ensure a unique index on { userId: 1 }.

  Usage:
    node scripts/cleanup-user-signins.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const UserSignIn = require('../models/UserSignIn');

async function connect() {
  const mongoUri = process.env.MONGODB_URI?.includes('mongodb+srv')
    ? process.env.MONGODB_URI
    : process.env.MONGO_URI;

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
  });
}

async function ensureUniqueIndex()() {}

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await connect();
    console.log('Connected.');

    console.log('Ensuring unique index on { userId: 1 } ...');
    await UserSignIn.collection.createIndex({ userId: 1 }, { unique: true });

    console.log('Finding duplicates...');
    const duplicates = await UserSignIn.aggregate([
      { $group: { _id: '$userId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let removedTotal = 0;
    for (const dup of duplicates) {
      const allDocs = await UserSignIn.find({ userId: dup._id }).sort({ updatedAt: -1, createdAt: -1 }).lean();
      const keep = allDocs[0]?._id;
      const removeIds = allDocs.filter(d => String(d._id) !== String(keep)).map(d => d._id);
      if (removeIds.length > 0) {
        const res = await UserSignIn.deleteMany({ _id: { $in: removeIds } });
        removedTotal += res.deletedCount || 0;
        console.log(`userId=${dup._id}: kept ${keep}, removed ${removeIds.length}`);
      }
    }

    console.log(`Cleanup complete. Removed ${removedTotal} duplicates.`);

    // Final sync to ensure index exists
    await UserSignIn.syncIndexes();
    console.log('Indexes synced.');
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
}

main();


