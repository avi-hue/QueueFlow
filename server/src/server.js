const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocketIO } = require('./sockets');

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSocketIO(server);

    server.listen(env.PORT, () => {
      console.log(`[Server] QueueFlow API running on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Health check at http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error(`[Server] Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
