const { store } = require('../db/inMemoryStore');

const connectDB = async () => {
  if (store.users.length === 0) {
    store.seed();
  }
  console.log(`[Database] Prototype In-Memory Store initialized with demo accounts.`);
  console.log(`[Database] Loaded ${store.users.length} demo users and ${store.businesses.length} demo businesses.`);
};

const disconnectDB = async () => {
  // No-op for in-memory store
};

module.exports = { connectDB, disconnectDB };
