const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

let io = null;

const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          socket.user = user;
        }
      }
      return next();
    } catch (err) {
      // Allow unauthenticated connection for public discovery watchers, but mark as guest
      socket.user = null;
      return next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${socket.user?.email || 'Guest'})`);

    if (socket.user) {
      socket.join(`user:${socket.user._id}`);
      if (socket.user.businessId) {
        socket.join(`business:${socket.user.businessId}`);
      }
    }

    // Public business queue watchers
    socket.on('business:watch', ({ businessId }) => {
      if (businessId) {
        socket.join(`business:${businessId}`);
      }
    });

    socket.on('business:unwatch', ({ businessId }) => {
      if (businessId) {
        socket.leave(`business:${businessId}`);
      }
    });

    socket.on('token:watch', ({ tokenId }) => {
      if (tokenId) {
        socket.join(`token:${tokenId}`);
      }
    });

    socket.on('disconnect', () => {
      // disconnected
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

module.exports = { initSocketIO, getIO };
